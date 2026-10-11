/**
 * A DRY HUNT IN MANUAL MODE, the way Claude Code runs one: separate
 * commands, what was shown kept between them in the session file, and the
 * draft written by Claude itself (no network, no paid calls).
 */
import fs from "fs";
import path from "path";
import { expect, it } from "vitest";
import { manual } from "../../leads/manual.js";
import { _resetFetchState } from "../../leads/fetch-guard.js";
import { freshDb } from "./helpers.js";

const NEWS = "https://brightwell.example.com/news/expansion";
const PAGE = "<html><body><h1>Brightwell opens three new clinic sites and is hiring a scheduling coordinator</h1>"
  + "<p>Press and partnerships: Dana Reyes, Operations Manager, ops@brightwell.example.com</p></body></html>";

it("plan -> search -> read -> save -> record -> brief -> draft, across separate commands", async () => {
  _resetFetchState();
  const { db, dir } = freshDb();
  db.close();
  const hooks = {
    search: async () => [
      { title: "Brightwell expands", url: NEWS, snippet: "three new clinic sites", age: "2026-10-01" },
      { title: "Brightwell Clinics | LinkedIn", url: "https://www.linkedin.com/company/brightwell", snippet: "Clinic group" },
    ],
    transport: async (u: URL) => u.pathname === "/robots.txt"
      ? { status: 404, headers: {}, body: "" } : { status: 200, headers: { "content-type": "text/html" }, body: PAGE },
    sleep: async () => {},
  };
  expect(await manual(["plan"])).toMatch(/Missing: engine\.json/);
  expect(await manual(["search", "clinic group hiring scheduling coordinator", "pm"], hooks)).toContain("snippet only");
  expect(await manual(["read", "https://www.linkedin.com/company/brightwell"], hooks)).toMatch(/Refused/);
  expect(await manual(["read", NEWS], hooks)).toContain("UNTRUSTED PAGE");
  // Each command is a fresh process in real use: what was shown is kept in the session file.
  expect(fs.existsSync(path.join(dir, "manual-session.json"))).toBe(true);
  const lead = {
    company: "Brightwell Clinics", website: "https://brightwell.example.com", country: "US", signal_type: "hiring",
    signal_quote: "opens three new clinic sites and is hiring a scheduling coordinator", signal_url: NEWS,
    fit_notes: [{ note: "Clinic group adding sites", basis: "measured", source_url: NEWS }],
    contact_name: "Dana Reyes", contact_role: "Operations Manager", contact_email: "ops@brightwell.example.com",
    contact_source_url: NEWS, score_fit: 4, score_timing: 4, score_reach: 2, channel: "email",
  };
  expect(await manual(["save", JSON.stringify({ ...lead, contact_email: "dana@brightwell.example.com" })])).toMatch(/Never guess/);
  expect(await manual(["save", JSON.stringify(lead)])).toMatch(/Saved as lead #1/);
  const record = await manual(["record"]);
  expect(record).toContain('"Brightwell Clinics" [hiring] 4+4+2=10/10 email: new dated 2026-10-01');
  const brief = await manual(["brief", "1"]);
  expect(brief).toContain("Acme Scheduling");
  expect(brief).toContain("Dana Reyes, Operations Manager");
  expect(brief).toMatch(/Never invent a number/);
  const body = "Hi Dana, I saw Brightwell is opening three new clinic sites and hiring a scheduling coordinator. We make shift-scheduling software for clinics. Would a short call be useful? If not, just say so.";
  expect(await manual(["draft", "1", JSON.stringify({ subject: "Your new sites", body: `${body} We save clinics 70% of admin time.` })]))
    .toMatch(/70%/);
  expect(await manual(["draft", "1", JSON.stringify({ subject: "Your new sites", body })])).toMatch(/Draft saved/);
  expect(await manual(["record"])).toMatch(/email: drafted .*\(draft written\)/);
  // The walk wrote only into its own data home.
  expect(fs.readdirSync(dir)).toEqual(expect.arrayContaining(["leads.db", "manual-session.json"]));
  expect(await manual(["reset"])).toMatch(/New manual session/);
  expect(await manual(["save", JSON.stringify({ ...lead, company: "Other" })])).toMatch(/Refused/);
});
