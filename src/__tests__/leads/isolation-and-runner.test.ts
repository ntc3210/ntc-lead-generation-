/**
 * THE FINDER CANNOT REACH THE SEND PATH, a run respects its budget, and
 * the approval page is locked to this computer and this user.
 */
import fs from "fs";
import path from "path";
import http from "http";
import os from "os";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { buildSystemPrompt, runLeads, trimOldResults } from "../../leads/runner.js";
import { balanceCents, credit } from "../../leads/budget.js";
import { createApprovalServer } from "../../leads/approval-server.js";
import { draftVersion } from "../../leads/approval.js";
import { practiceSender } from "../../leads/mailer.js";
import { getLead } from "../../leads/db.js";
import { addLead, freshDb } from "./helpers.js";
import type { CallArgs, Message, ModelReply } from "../../leads/anthropic.js";

const LEADS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "leads");

/** Every file reachable by imports from one file inside src/leads. */
function reachable(start: string): Set<string> {
  const seen = new Set<string>();
  const walk = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = fs.readFileSync(file, "utf-8");
    // EVERY relative module string: static, side-effect and dynamic
    // imports and require() alike.
    for (const m of src.matchAll(/["'`](\.{1,2}\/[^"'`]+?)(?:\.js|\.ts)?["'`]/g)) {
      const next = path.resolve(path.dirname(file), m[1] + ".ts");
      if (fs.existsSync(next)) walk(next);
    }
  };
  walk(start);
  return seen;
}

describe("the finder's code never reaches the send path", () => {
  // Every program and module the finder runs: the unattended runner, manual
  // mode (how Claude Code runs hunts), the tools and the drafting rules.
  for (const start of ["runner.ts", "tools.ts", "manual.ts", "drafting.ts"]) {
    it(`${start} cannot import the mailer or the approvals, read the sending settings, or run programs`, () => {
      const files = [...reachable(path.join(LEADS, start))];
      const names = files.map((f) => path.basename(f));
      expect(names).toContain(start);
      expect(names).not.toContain("mailer.ts");
      expect(names).not.toContain("approval.ts");
      expect(names).not.toContain("approval-server.ts");
      for (const f of files) {
        const src = fs.readFileSync(f, "utf-8");
        expect(src, f).not.toMatch(/client-sesv2|@aws-sdk|nodemailer|smtp/i);
        expect(src, f).not.toMatch(/\.sending\b|\[\s*["']sending["']\s*\]|loadMailConfig/);
        expect(src, f).not.toMatch(/child_process|execSync|spawn\(/);
      }
    });
  }
  it("the finder's settings object never holds the sending settings", async () => {
    const { dir } = freshDb();
    fs.writeFileSync(path.join(dir, "engine.json"), JSON.stringify({
      braveApiKey: "k", sending: { fromAddress: "a@b.example.com", postalAddress: "1 Main St, Town" } }));
    const { loadLeadConfig } = await import("../../leads/config.js");
    const cfg = loadLeadConfig();
    expect(cfg.braveApiKey).toBe("k");
    expect(Object.keys(cfg)).not.toContain("sending");
    expect(JSON.stringify(cfg)).not.toContain("postalAddress");
  });
  it("the tripwire sees every kind of import", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leads-iso-"));
    fs.writeFileSync(path.join(dir, "mailer.ts"), "export const x = 1;");
    for (const line of ['import "./mailer.js";', 'await import("./mailer.js");', "const m = require('./mailer.js');",
      'import { x } from "./mailer.js";']) {
      fs.writeFileSync(path.join(dir, "start.ts"), line);
      expect([...reachable(path.join(dir, "start.ts"))].map((f) => path.basename(f)), line).toContain("mailer.ts");
    }
  });
  it("nothing in the engine places calls or touches the social sites' APIs", () => {
    for (const f of fs.readdirSync(LEADS).filter((n) => n.endsWith(".ts"))) {
      const src = fs.readFileSync(path.join(LEADS, f), "utf-8");
      expect(src, f).not.toMatch(/twilio|api\.linkedin|graph\.facebook|api\.twitter|oauth\.reddit/i);
    }
  });
});

function reply(content: ModelReply["content"], id: string): ModelReply {
  return { content, stopReason: "tool_use", inputTokens: 2000, outputTokens: 200, requestId: id };
}

it("old page text is trimmed from the conversation to keep prompts small", () => {
  const big = "x".repeat(5000);
  const messages: Message[] = [];
  for (let i = 0; i < 6; i++) {
    messages.push({ role: "assistant", content: [{ type: "tool_use", id: `t${i}`, name: "read_page", input: {} }] });
    messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: `t${i}`, content: big }] });
  }
  trimOldResults(messages);
  const sizes = messages.filter((m) => m.role === "user").map((m) => ((m.content as { content: string }[])[0].content).length);
  expect(sizes.slice(0, 4).every((s) => s < 400)).toBe(true);
  expect(sizes.slice(-2).every((s) => s === 5000)).toBe(true);
});

describe("an unattended run (fake model, fake web: no paid calls)", () => {
  const SITE = "https://brightwell.example.com/";
  const NEWS = "https://brightwell.example.com/news/expansion";
  const html = "<html><body><h1>Brightwell opens three new clinic sites and is hiring a scheduling coordinator</h1>"
    + "<p>Contact Dana Reyes, Operations Manager: ops@brightwell.example.com</p></body></html>";

  it("searches, reads, saves a lead, drafts its email, and charges every call", async () => {
    const { db, cfg } = freshDb();
    const models: string[] = [];
    const prompts: string[] = [];
    let n = 0;
    const call = async (args: CallArgs): Promise<ModelReply> => {
      models.push(args.model);
      n++;
      if (args.model === cfg.draftModel) {
        prompts.push(args.system + "\n" + JSON.stringify(args.messages));
        const draft = JSON.stringify({ subject: "Your scheduling coordinator role",
          body: "Hi Dana, I saw Brightwell is hiring a scheduling coordinator as you open three new sites. We make shift-scheduling software for clinics. Would a short call be useful? If not, just say so." });
        return { ...reply([{ type: "text", text: draft }], `d${n}`), stopReason: "end_turn" };
      }
      if (n === 1) prompts.push(args.system);
      if (n === 1) return reply([{ type: "tool_use", id: "t1", name: "web_search", input: { query: "clinic hiring scheduling coordinator", freshness: "pm" } }], `r${n}`);
      if (n === 2) return reply([{ type: "tool_use", id: "t2", name: "read_page", input: { url: NEWS } }], `r${n}`);
      if (n === 3) return reply([{ type: "tool_use", id: "t3", name: "save_lead", input: {
        company: "Brightwell Clinics", website: SITE, country: "US", signal_type: "hiring",
        signal_quote: "Brightwell opens three new clinic sites and is hiring a scheduling coordinator", signal_url: NEWS,
        contact_name: "Dana Reyes", contact_role: "Operations Manager", contact_email: "ops@brightwell.example.com",
        contact_source_url: NEWS, score_fit: 4, score_timing: 4, score_reach: 2, channel: "email",
      } }], `r${n}`);
      return reply([{ type: "tool_use", id: "t4", name: "done_for_today", input: { summary: "one lead" } }], `r${n}`);
    };
    const s = await runLeads({ db, cfg, apiKey: "test", call, log: () => {},
      toolHooks: {
        search: async () => [{ title: "Brightwell expands", url: NEWS, snippet: "three new clinic sites" }],
        transport: async (u: URL) => u.pathname === "/robots.txt"
          ? { status: 404, headers: {}, body: "" } : { status: 200, headers: { "content-type": "text/html" }, body: html },
        sleep: async () => {},
      } });
    expect(s.saved).toBe(1);
    expect(s.drafted).toBe(1);
    expect(s.stopped).toBe("said done for today");
    expect(models.filter((m) => m === cfg.draftModel)).toHaveLength(1);
    // The finder is given the profile and the scoring guide; the writer the profile and the lead.
    expect(prompts[0]).toContain("Acme Scheduling");
    expect(prompts[0]).toMatch(/Fit 0 means stop/);
    expect(prompts[1]).toContain("Brightwell opens three new clinic sites");
    expect(getLead(db, 1)?.status).toBe("drafted");
    expect(s.spentCents).toBeGreaterThan(0);
    expect(balanceCents(db)).toBeCloseTo(cfg.budget.dailyBaseCents - s.spentCents, 6);
  });

  it("does not start without a company profile", async () => {
    const { db, cfg } = freshDb({ profile: null });
    let calls = 0;
    const s = await runLeads({ db, cfg, apiKey: "t", log: () => {}, call: async () => { calls++; throw new Error("x"); } });
    expect(calls).toBe(0);
    expect(s.stopped).toMatch(/no company profile/);
  });

  it("the call limit covers the drafting pass too", async () => {
    const { db, cfg } = freshDb();
    for (let i = 0; i < 5; i++) addLead(db, { status: "new", draft_subject: null, draft_body: null, company: `Co ${i}` });
    let calls = 0;
    const call = async (args: CallArgs): Promise<ModelReply> => {
      calls++;
      if (args.model === cfg.draftModel) return { content: [{ type: "text", text: '{"subject":"Hi","body":"x"}' }], stopReason: "end_turn", inputTokens: 10, outputTokens: 10, requestId: `d${calls}` };
      return { content: [{ type: "tool_use", id: "t", name: "my_record", input: {} }], stopReason: "tool_use", inputTokens: 10, outputTokens: 10, requestId: `r${calls}` };
    };
    const s = await runLeads({ db, cfg: { ...cfg, maxModelCallsPerRun: 2 }, apiKey: "t", call, log: () => {} });
    expect(s.modelCalls).toBe(2);
    expect(calls).toBe(2);
  });

  it("stops before a call when the budget is gone", async () => {
    const { db, cfg } = freshDb();
    credit(db, cfg, "daily", new Date().toISOString().slice(0, 10), 0);
    db.prepare("INSERT INTO budget (at, kind, ref, cents) VALUES ('now','spend','x', -1000)").run();
    let calls = 0;
    const s = await runLeads({ db, cfg, apiKey: "test", log: () => {}, call: async () => { calls++; throw new Error("no"); } });
    expect(calls).toBe(0);
    expect(s.stopped).toBe("budget used up");
  });

  it("an unpriced model is refused before any call", async () => {
    const { db, cfg } = freshDb();
    let calls = 0;
    await expect(runLeads({ db, cfg: { ...cfg, model: "mystery-model" }, apiKey: "t", log: () => {},
      call: async () => { calls++; throw new Error("x"); } })).rejects.toThrow(/No price/);
    expect(calls).toBe(0);
  });

  it("a failed model call stops the run; it is not retried", async () => {
    const { db, cfg } = freshDb();
    let calls = 0;
    // Fails once, then would succeed: a retry would show up as a second call.
    const s = await runLeads({ db, cfg, apiKey: "t", log: () => {}, call: async () => {
      calls++;
      if (calls === 1) throw new Error("overloaded");
      return reply([{ type: "tool_use", id: "t", name: "done_for_today", input: { summary: "x" } }], `r${calls}`);
    } });
    expect(calls).toBe(1);
    expect(s.stopped).toMatch(/model call failed: overloaded/);
  });

  it("the system prompt holds no product-specific wording", () => {
    const { db, cfg } = freshDb();
    const p = buildSystemPrompt(db, cfg, "PROFILE");
    expect(p).not.toMatch(/amazon seller|\bppc\b|\basin\b/i);
    expect(p).toContain("PROFILE");
  });
});

describe("the approval page", () => {
  async function req(port: number, method: string, pathQ: string, body = "", host = `127.0.0.1:${port}`) {
    return new Promise<{ status: number; text: string; headers: http.IncomingHttpHeaders }>((resolve) => {
      const r = http.request({ host: "127.0.0.1", port, method, path: pathQ,
        headers: { host, "content-type": "application/x-www-form-urlencoded" } }, (res) => {
        let t = ""; res.on("data", (c) => (t += c)); res.on("end", () => resolve({ status: res.statusCode || 0, text: t, headers: res.headers }));
      });
      r.end(body);
    });
  }
  it("needs the token and our host, changes nothing on GET, and sends only the on-screen draft on POST", async () => {
    const { db, cfg, dir } = freshDb();
    const id = addLead(db);
    const probe = http.createServer();
    await new Promise<void>((r) => probe.listen(0, "127.0.0.1", () => r()));
    const port = (probe.address() as { port: number }).port;
    await new Promise<void>((r) => probe.close(() => r()));
    const server = createApprovalServer({ db, cfg, mail: null, sender: practiceSender(path.join(dir, "outbox")),
      modeNote: "PRACTICE", token: "secret" }, port);
    await new Promise<void>((r) => server.listen(port, "127.0.0.1", () => r()));
    try {
      expect((await req(port, "GET", "/")).status).toBe(403);
      expect((await req(port, "GET", "/?t=secret", "", "evil.example:80")).status).toBe(403);
      expect((await req(port, "GET", `/send?t=secret&id=${id}`)).status).toBe(405);
      const page = await req(port, "GET", "/?t=secret");
      expect(page.status).toBe(200);
      expect(page.headers["content-security-policy"]).toMatch(/default-src 'none'/);
      expect(page.text).toContain("Brightwell Clinics");
      expect(page.text).toContain("MEASURED");
      expect(page.text).toContain("4+4+2 = 10/10");
      expect(page.text).not.toMatch(/<script/i);
      // Without the on-screen draft and its fingerprint, nothing is sent.
      expect((await req(port, "POST", "/send?t=secret", `id=${id}`)).text).toContain("Not done");
      const lead = getLead(db, id)!;
      const body = new URLSearchParams({ id: String(id), subject: lead.draft_subject!, body: lead.draft_body!,
        version: draftVersion(lead.draft_subject, lead.draft_body) }).toString();
      expect((await req(port, "POST", "/send?t=secret", body)).text).toContain("practice mode, NOT sent");
      expect(fs.readdirSync(path.join(dir, "outbox"))).toHaveLength(1);
    } finally {
      server.close();
    }
  });
});
