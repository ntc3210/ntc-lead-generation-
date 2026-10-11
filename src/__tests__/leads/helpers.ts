/** Shared helpers for the engine tests: a fresh data home and database. */
import fs from "fs";
import os from "os";
import path from "path";
import type BetterSqlite3 from "better-sqlite3";
import { openLeadsDb } from "../../leads/db.js";
import { DEFAULT_LEAD_CONFIG, type LeadConfig } from "../../leads/config.js";

/**
 * A new, empty data home (LEAD_SCOUT_HOME points at it) with a database,
 * an empty do-not-contact.md and a small company profile, unless told not to.
 */
export function freshDb(opts: { dnc?: boolean; profile?: string | null } = {}): { db: BetterSqlite3.Database; cfg: LeadConfig; dir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leads-test-"));
  process.env.LEAD_SCOUT_HOME = dir;
  const dbPath = path.join(dir, "leads.db");
  const db = openLeadsDb(dbPath);
  const cfg: LeadConfig = { ...DEFAULT_LEAD_CONFIG, dbPath, braveApiKey: "test" };
  if (opts.dnc !== false) fs.writeFileSync(path.join(dir, "do-not-contact.md"), "# Do not contact\n");
  const profile = opts.profile === undefined ? PROFILE : opts.profile;
  if (profile !== null) fs.writeFileSync(path.join(dir, "profile.md"), profile);
  return { db, cfg, dir };
}

/** A small, made-up company profile. */
export const PROFILE = [
  "# Company profile: Acme Scheduling (example)",
  "What we sell: shift-scheduling software for clinics. (said by user)",
  "Who buys: clinic operations managers, 20-200 staff, US and UK. (said by user)",
  "Proof: cut scheduling time by 40% at Northside Clinics. (said by user)",
  "Website: acme-scheduling.example.com",
].join("\n");

/** Insert a lead directly (as the finder would have), with a waiting draft. */
export function addLead(db: ReturnType<typeof openLeadsDb>, over: Partial<Record<string, unknown>> = {}): number {
  const row = {
    found_at: new Date().toISOString(), company: "Brightwell Clinics", website: "https://brightwell.example.com",
    country: "US", signal_type: "hiring",
    signal_quote: "We are hiring a scheduling coordinator to manage rotas across 6 sites",
    signal_url: `https://brightwell.example.com/careers/${Math.random()}`, signal_date: "2026-10-01",
    fit_notes: JSON.stringify([{ note: "Six clinic sites", basis: "measured", source_url: "https://brightwell.example.com/about" }]),
    contact_name: "Dana Reyes", contact_role: "Operations Manager", contact_email: "ops@brightwell.example.com",
    contact_phone: null, contact_source_url: "https://brightwell.example.com/contact",
    consent_basis: null, score_fit: 4, score_timing: 4, score_reach: 2, channel: "email", status: "drafted",
    draft_subject: "Your scheduling coordinator role",
    draft_body: "Hi Dana, I saw your post for a scheduling coordinator across your sites. We make shift-scheduling software for clinics. Would a short call be useful? If not, just say so.",
    ...over,
  };
  const r = db.prepare(
    `INSERT INTO leads (found_at, company, website, country, signal_type, signal_quote, signal_url, signal_date, fit_notes,
       contact_name, contact_role, contact_email, contact_phone, contact_source_url, consent_basis, score_fit, score_timing, score_reach,
       channel, status, draft_subject, draft_body)
     VALUES (@found_at, @company, @website, @country, @signal_type, @signal_quote, @signal_url, @signal_date, @fit_notes,
       @contact_name, @contact_role, @contact_email, @contact_phone, @contact_source_url, @consent_basis, @score_fit, @score_timing, @score_reach,
       @channel, @status, @draft_subject, @draft_body)`,
  ).run(row);
  return Number(r.lastInsertRowid);
}
