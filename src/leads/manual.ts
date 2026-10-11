/**
 * MANUAL MODE: the finder's tools, driven from the command line.
 *
 * Claude Code (or the user) does the finder's job by hand, through exactly
 * the same gates as the unattended runner. No Anthropic API key is used,
 * so only Brave searches are charged.
 *
 *   npm run leads:manual -- plan                     settings, budget, and what is missing
 *   npm run leads:manual -- search "<query>" [pd|pw|pm|py]
 *                                                    a real Brave search (key in engine.json)
 *   npm run leads:manual -- read   <url>             read one page through fetch-guard
 *   npm run leads:manual -- save   <file.json|json>  save_lead, same checks
 *   npm run leads:manual -- record                   the lead list and the user's decisions
 *   npm run leads:manual -- brief  <id>              the drafting rules, the profile and that lead
 *   npm run leads:manual -- draft  <id> <file.json|json>   store {subject, body}
 *   npm run leads:manual -- reset                    start a new session
 *
 * What was shown (quotes and the page each was on, addresses, phone
 * numbers, pages, dates) is kept in manual-session.json between commands,
 * so save_lead's "you must have been shown it" rules still hold. It cannot
 * send email, approve, or change the do-not-contact list.
 */
import fs from "fs";
import path from "path";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { fileURLToPath } from "url";
import { loadLeadConfig, countryRefusal } from "./config.js";
import { getLead, openLeadsDb } from "./db.js";
import { SeenText, runLeadTool, type ToolContext } from "./tools.js";
import { balanceCents, creditDailyAllowance } from "./budget.js";
import { DRAFT_SYSTEM, draftRequest, readProfile, storeDraft } from "./drafting.js";
import { dataPath, leadScoutHome } from "./paths.js";

/*
 * THE SESSION FILE IS SIGNED. manual-session.json holds what the finder
 * was shown; save_lead trusts it. It is signed with an HMAC (a keyed
 * checksum) whose key sits in manual-session.key, and a file that does not
 * match its signature is thrown away, not trusted.
 *
 * Honest limit: Claude Code can read files in this folder, so this stops
 * a careless or naive edit (a hand-added quote or address), not a
 * determined one. The hard rule in CLAUDE.md section 5 forbids reading or
 * writing either file; the signature makes breaking that rule visible.
 */
function sessionKey(): Buffer {
  const file = dataPath("manual-session.key");
  try {
    const k = Buffer.from(fs.readFileSync(file, "utf-8").trim(), "hex");
    if (k.length === 32) return k;
  } catch { /* made below */ }
  const k = randomBytes(32);
  fs.mkdirSync(leadScoutHome(), { recursive: true });
  fs.writeFileSync(file, k.toString("hex"), { mode: 0o600 });
  return k;
}
function sign(body: string): string {
  return createHmac("sha256", sessionKey()).update(body).digest("hex");
}
/** The saved session, or a fresh one. `tampered` is true when a file was
 * there but its signature did not match. */
export function loadSeen(): { seen: SeenText; tampered: boolean } {
  let raw: string;
  try { raw = fs.readFileSync(dataPath("manual-session.json"), "utf-8"); } catch { return { seen: new SeenText(), tampered: false }; }
  try {
    const { body, mac } = JSON.parse(raw) as { body?: string; mac?: string };
    const want = Buffer.from(sign(String(body ?? "")), "hex");
    const got = Buffer.from(String(mac ?? ""), "hex");
    if (typeof body === "string" && got.length === want.length && timingSafeEqual(got, want)) {
      return { seen: SeenText.fromJSON(JSON.parse(body)), tampered: false };
    }
  } catch { /* fall through */ }
  return { seen: new SeenText(), tampered: true };
}
export function saveSeen(seen: SeenText): void {
  fs.mkdirSync(leadScoutHome(), { recursive: true });
  const body = JSON.stringify(seen.toJSON());
  fs.writeFileSync(dataPath("manual-session.json"), JSON.stringify({ body, mac: sign(body) }));
}
const TAMPERED = "WARNING: manual-session.json was changed outside the engine, so it was thrown away. Nothing shown earlier counts now: search and read again.";
/** A JSON file, or the JSON itself typed on the command line. */
function readJson(arg: string): unknown {
  const s = String(arg ?? "").trim();
  return JSON.parse(s.startsWith("{") || s.startsWith("[") ? s : fs.readFileSync(s, "utf-8"));
}

/**
 * Run one command. `hooks` exist for tests only (a fake search, and a fake
 * network UNDER fetch-guard, so the guard still runs); the command line
 * never passes them.
 */
export async function manual(argv: string[], hooks: ManualHooks = {}): Promise<string> {
  sessionWasTampered = false;
  const out = await manualRun(argv, hooks);
  return sessionWasTampered ? `${TAMPERED}\n\n${out}` : out;
}
type ManualHooks = Pick<ToolContext, "search" | "transport" | "sleep" | "fetchPage">;
let sessionWasTampered = false;

async function manualRun(argv: string[], hooks: ManualHooks): Promise<string> {
  const [cmd, a, b] = argv;
  const cfg = loadLeadConfig();
  const db = openLeadsDb(cfg.dbPath);
  const { seen, tampered } = loadSeen();
  if (tampered) { saveSeen(seen); sessionWasTampered = true; }
  const ctx: ToolContext = { db, cfg, seen, runId: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`, ...hooks };
  // The same budget as the runner: today's allowance, and no search once it is spent.
  creditDailyAllowance(db, cfg);
  try {
    switch (cmd) {
      case "reset":
        saveSeen(new SeenText());
        return "New manual session.";
      case "plan": {
        const missing = [
          !fs.existsSync(dataPath("engine.json")) && "engine.json (copy templates/engine.example.json)",
          !cfg.braveApiKey && "a Brave Search key in engine.json",
          !readProfile().trim() && "profile.md (run the interview first)",
          !fs.existsSync(dataPath("do-not-contact.md")) && "do-not-contact.md (may be empty; needed before any draft)",
        ].filter(Boolean);
        return [
          `Data home: ${leadScoutHome()}`,
          `Budget balance: $${(balanceCents(db) / 100).toFixed(2)} (search price ${(cfg.searchCostHundredthsOfCent / 100).toFixed(2)} cents).`,
          `Personal mailboxes (gmail ...): ${cfg.allowPersonalMailbox ? "only when printed on the company's own site" : "never saved"}.`,
          `No cold email to: ${cfg.noColdEmailCountries.join(", ") || "(none set)"}.`,
          missing.length ? `Missing: ${missing.join("; ")}.` : "Ready.",
        ].join("\n");
      }
      case "search": {
        if (!cfg.braveApiKey && !hooks.search) return "Put your Brave key in engine.json first (\"braveApiKey\").";
        if (balanceCents(db) < 1) return "The budget is used up for today. Stop.";
        // An optional last word limits how recent: pd, pw, pm or py.
        const out = await runLeadTool("web_search", { query: String(a ?? ""), ...(b ? { freshness: b } : {}) }, ctx);
        saveSeen(seen);
        return out;
      }
      case "read": {
        const out = await runLeadTool("read_page", { url: a }, ctx);
        saveSeen(seen);
        return out;
      }
      case "save": {
        const lead = readJson(a) as Record<string, unknown>;
        return await runLeadTool("save_lead", lead, ctx);
      }
      case "brief": {
        const lead = getLead(db, Number(a));
        if (!lead) return `There is no lead #${a}.`;
        if (lead.channel !== "email" || !lead.contact_email) return `Lead #${a} is a ${lead.channel} lead with no email: the user contacts them directly.`;
        const blocked = countryRefusal(cfg, lead);
        if (blocked) return `Lead #${a}: ${blocked}`;
        const profile = readProfile();
        if (!profile.trim()) return "There is no my-company/profile.md yet: no draft can use proof the profile does not hold.";
        return `${DRAFT_SYSTEM}\n\n--- The company profile ---\n${profile}\n\n--- The lead ---\n${draftRequest(lead)}`
          + `\n\nSave it with: draft ${lead.id} <file.json>`;
      }
      case "draft": {
        const d = readJson(b) as { subject?: string; body?: string };
        return storeDraft(db, cfg, Number(a), String(d.subject ?? ""), String(d.body ?? ""));
      }
      case "record":
        return await runLeadTool("my_record", {}, ctx);
      default:
        return "Commands: plan | reset | search \"<query>\" [pd|pw|pm|py] | read <url> | save <file.json> | record | brief <id> | draft <id> <file.json>";
    }
  } finally {
    db.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  manual(process.argv.slice(2)).then((out) => console.log(out)).catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
