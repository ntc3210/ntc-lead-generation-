/**
 * WHERE THE DATA LIVES AND WHAT THE SETTINGS ARE:
 *   - the data home is <project>/my-company, or LEAD_SCOUT_HOME;
 *   - every data file's path comes from dataPath(), and no other engine
 *     file names them;
 *   - git keeps my-company/ out;
 *   - the example settings hold no key, the by-hand route, personal
 *     mailboxes off, and Germany off.
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { PROJECT_ROOT, dataPath, leadScoutHome, type DataFile } from "../../leads/paths.js";
import { DEFAULT_LEAD_CONFIG, loadLeadConfig } from "../../leads/config.js";
import { loadMailConfig, chooseSender } from "../../leads/mailer.js";
import { isNoContact, openLeadsDb, noContactFileEntries } from "../../leads/db.js";
import { freshDb } from "./helpers.js";
import Database from "better-sqlite3";

const LEADS = path.join(PROJECT_ROOT, "src", "leads");
const FILES: DataFile[] = ["engine.json", "leads.db", "outbox", "manual-session.json", "profile.md", "do-not-contact.md"];

describe("the data home", () => {
  const saved = process.env.LEAD_SCOUT_HOME;
  afterEach(() => { process.env.LEAD_SCOUT_HOME = saved; });

  it("is <project>/my-company by default", () => {
    delete process.env.LEAD_SCOUT_HOME;
    expect(leadScoutHome()).toBe(path.join(PROJECT_ROOT, "my-company"));
    expect(fs.existsSync(path.join(PROJECT_ROOT, "CLAUDE.md"))).toBe(true);
    for (const f of FILES) expect(dataPath(f)).toBe(path.join(PROJECT_ROOT, "my-company", f));
  });
  it("LEAD_SCOUT_HOME moves every data file", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "ls-home-"));
    process.env.LEAD_SCOUT_HOME = home;
    for (const f of FILES) expect(path.dirname(dataPath(f))).toBe(path.resolve(home));
    expect(loadLeadConfig().dbPath).toBe(path.join(home, "leads.db"));
  });
  it("no other engine file names a data file or the data folder (one function holds every path)", () => {
    const names = FILES.map((f) => f.replace(/[.-]/g, "\\$&")).join("|");
    // A quoted data-file name is allowed only as the argument of dataPath(...).
    const bare = new RegExp(`(?<!dataPath\\()["'\`](?:${names})["'\`]`);
    for (const f of fs.readdirSync(LEADS).filter((n) => n.endsWith(".ts") && n !== "paths.ts")) {
      const src = fs.readFileSync(path.join(LEADS, f), "utf-8");
      expect(src, f).not.toMatch(bare);
      expect(src, f).not.toMatch(/["'`]my-company["'`]/);
      expect(src, f).not.toMatch(/process\.env\.LEAD_SCOUT_HOME/);
    }
  });
  it("git keeps my-company/ out, except its README", () => {
    const gi = fs.readFileSync(path.join(PROJECT_ROOT, ".gitignore"), "utf-8");
    expect(gi).toMatch(/^my-company\/\*$/m);
    expect(gi).toMatch(/^!my-company\/README\.md$/m);
  });
});

describe("the example settings (templates/engine.example.json)", () => {
  const file = path.join(PROJECT_ROOT, "templates", "engine.example.json");
  const example = JSON.parse(fs.readFileSync(file, "utf-8"));
  it("holds no real key and starts safe", () => {
    expect(example.braveApiKey).toMatch(/^<.*>$/);
    expect(JSON.stringify(example)).not.toMatch(/BSA[A-Za-z0-9]{10,}|sk-ant-|AKIA[A-Z0-9]{12,}/);
    expect(example.allowPersonalMailbox).toBe(false);
    expect(example.noColdEmailCountries).toEqual(["DE"]);
    expect(example.consentRequiredCountries).toEqual(["CA"]);
    expect(example.sending.route).toBe("by_hand");
    expect(example.sending.sesAwsRequirementConfirmed).toBe(false);
    expect(example.sending.postalAddress).toMatch(/^<.*>$/);
  });
  it("loads as it is, and its placeholder address could never send for real", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "ls-ex-"));
    fs.copyFileSync(file, path.join(home, "engine.json"));
    const saved = process.env.LEAD_SCOUT_HOME;
    process.env.LEAD_SCOUT_HOME = home;
    try {
      const cfg = loadLeadConfig();
      expect(cfg.noColdEmailCountries).toEqual(["DE"]);
      const mail = loadMailConfig()!;
      // By hand by default, and NOT READY: nothing can be approved until filled in.
      expect(chooseSender(mail).sender.mode).toBe("by_hand");
      expect(chooseSender(mail).note).toMatch(/NOT READY/);
      // Switching the route to SES alone is not enough.
      expect(chooseSender({ ...mail, route: "ses" }).sender.mode).toBe("by_hand");
      expect(chooseSender({ ...mail, route: "ses", sesAwsRequirementConfirmed: true }).sender.mode).toBe("by_hand");
    } finally { process.env.LEAD_SCOUT_HOME = saved; }
  });
  it("matches the code's defaults", () => {
    expect(example.model).toBe(DEFAULT_LEAD_CONFIG.model);
    expect(example.budget).toEqual(DEFAULT_LEAD_CONFIG.budget);
    expect(example.searchCostHundredthsOfCent).toBe(DEFAULT_LEAD_CONFIG.searchCostHundredthsOfCent);
  });
});

describe("settings that would break the budget or the data home are refused", () => {
  const withEngine = (engine: object) => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "ls-cfg-"));
    fs.writeFileSync(path.join(home, "engine.json"), JSON.stringify(engine));
    process.env.LEAD_SCOUT_HOME = home;
    return home;
  };
  const saved = process.env.LEAD_SCOUT_HOME;
  afterEach(() => { process.env.LEAD_SCOUT_HOME = saved; });
  it.each([0, -1, null, "50", Number.NaN])("a search price of %j is refused", (v) => {
    withEngine({ searchCostHundredthsOfCent: v });
    expect(() => loadLeadConfig()).toThrow(/searchCostHundredthsOfCent/);
  });
  it("dbPath must stay inside the data home", () => {
    withEngine({ dbPath: path.join(os.tmpdir(), "elsewhere.db") });
    expect(() => loadLeadConfig()).toThrow(/inside the data home/);
    withEngine({ dbPath: "../escape.db" });
    expect(() => loadLeadConfig()).toThrow(/inside the data home/);
    const home = withEngine({ dbPath: "sub/leads.db" });
    expect(loadLeadConfig().dbPath).toBe(path.join(home, "sub", "leads.db"));
  });
});

describe("the database", () => {
  it("a lead file made by another program is refused, not changed", () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "other-db-")), "leads.db");
    const old = new Database(file);
    old.exec("CREATE TABLE leads (id INTEGER PRIMARY KEY, kind TEXT, notes TEXT)");
    old.close();
    expect(() => openLeadsDb(file)).toThrow(/another program/);
  });
  it("records its schema version, and opening twice is harmless", () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "v-db-")), "leads.db");
    openLeadsDb(file).close();
    const db = openLeadsDb(file);
    expect(db.pragma("user_version", { simple: true })).toBe(1);
    db.close();
  });
  it("refuses a fit score of 0 even if code tried to write one", () => {
    const db = openLeadsDb(path.join(fs.mkdtempSync(path.join(os.tmpdir(), "c-db-")), "leads.db"));
    expect(() => db.prepare(`INSERT INTO leads (found_at, company, signal_type, signal_quote, signal_url, score_fit, score_timing, score_reach, channel)
      VALUES ('now','X','hiring','q','https://x.example.com',0,4,2,'email')`).run()).toThrow(/CHECK/);
  });
  it("reads EVERY email on every line of do-not-contact.md, whatever the format", () => {
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "dnc-")), "do-not-contact.md");
    fs.writeFileSync(f, [
      "# Do not contact", "Notes: see https://notes.example.com for why.",
      "- jane+x@acme.example.com (said no)",
      "no bullet at all: plain@one.example.com",
      "Dana Reyes <dana@two.example.com>",
      "Lee Park, lee@three.example.com",
      "| Name | Email |", "|---|---|", "| Kim | kim@four.example.com |",
      "1. num@five.example.com",
      "**bold@six.example.com**",
      "[Link Person](mailto:link@seven.example.com)",
      "- 2026-10-01: dated@eight.example.com said no",
      "- [x] mailto:Bob@Corp.example.com.",
      "- Some person by name only",
    ].join("\n"));
    const e = noContactFileEntries(f);
    expect(e.emails.sort()).toEqual([
      "bob@corp.example.com", "dana@two.example.com", "dated@eight.example.com", "jane@acme.example.com", "kim@four.example.com",
      "lee@three.example.com", "link@seven.example.com", "num@five.example.com", "plain@one.example.com", "bold@six.example.com",
    ].sort());
    // A web address inside a note is not taken for a whole blocked company.
    expect(e.domains).not.toContain("notes.example.com");
  });
  it("takes a bare domain only at the start of a line, and every phone number", () => {
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "dnc-")), "do-not-contact.md");
    fs.writeFileSync(f, [
      "* `blocked.example.org`", "competitor.example.net (a competitor)", "1. www.numbered.example.com",
      "| tabled.example.io | asked |",
      "Note: we also talked to talked.example.com once",
      "- Front desk, +1 (512) 555-0142, said no",
    ].join("\n"));
    const e = noContactFileEntries(f);
    expect(e.domains.sort()).toEqual(["blocked.example.org", "competitor.example.net", "numbered.example.com", "tabled.example.io"]);
    expect(e.phones).toContain("15125550142");
  });
  it("a do-not-contact.md entry in any format blocks the address", () => {
    const { db, dir } = freshDb();
    fs.writeFileSync(path.join(dir, "do-not-contact.md"), "Dana Reyes <Dana@Two.example.com> asked us to stop\n");
    expect(isNoContact(db, "dana@two.example.com")).toBe(true);
    expect(isNoContact(db, "dana+news@two.example.com")).toBe(true);
    expect(isNoContact(db, "other@two.example.com")).toBe(false);
  });
});
