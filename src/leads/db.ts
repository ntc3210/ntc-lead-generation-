/**
 * THE DATABASE: one SQLite file (leads.db) in the data home, holding
 *
 *   leads       every lead the finder saved, with its evidence, scores,
 *               contact, channel, status and draft
 *   no_contact  people, whole domains or phone numbers never to be contacted
 *   budget      a ledger of cents: the daily allowance, rewards, spending
 *   sends       one row per email actually sent: the unique key on
 *               lead_id is what makes a double send impossible
 *
 * WHO MAY CHANGE WHAT is enforced by which functions each program imports.
 * The finder's tools (tools.ts) can only ADD leads and write drafts.
 * Approving, rejecting, sending and the no-contact list live in
 * approval.ts, which only the approval page imports. The finder has no tool
 * that runs SQL.
 *
 * The lead record below follows templates/lead-scoring.md.
 */
import Database from "better-sqlite3";
import type BetterSqlite3 from "better-sqlite3";
import fs from "fs";
import path from "path";
import { dataPath } from "./paths.js";
import { emailsIn, phoneDigits, phonesIn, samePhone } from "./extract.js";

/** Why now (guide/lead-signals.md). "lookalike" is fit only, no timing. */
export const SIGNAL_TYPES = [
  "hiring", "funding", "new_leader", "complaint", "competitor_complaint", "launch_or_expansion",
  "regulation", "growth", "tech_change", "event", "lookalike", "other",
] as const;
export type SignalType = typeof SIGNAL_TYPES[number];

/** How the lead will be reached. LinkedIn and community messages are
 * always sent by the user by hand; phone calls are always dialled by a
 * person. Only "email" can go through the engine. */
export const CHANNELS = ["email", "phone", "linkedin", "community", "event", "partner", "contact_form", "other"] as const;
export type Channel = typeof CHANNELS[number];

export type LeadStatus =
  | "new"             // saved, no draft yet
  | "drafted"         // a draft is waiting for the user
  | "approved"        // the user said yes (by hand: waiting for "I sent it"; practice; or another channel)
  | "rejected"        // the user said no to this lead (the finder learns from the reason)
  | "sent"            // approved and the email went out
  | "send_failed"     // approved, but the email service refused it (never retried)
  | "replied"         // they answered with interest
  | "not_interested"  // they said no: also added to the do-not-contact list
  | "do_not_contact"; // closed because the address or domain is on the list
export const LEAD_STATUSES: LeadStatus[] = [
  "new", "drafted", "approved", "rejected", "sent", "send_failed", "replied", "not_interested", "do_not_contact",
];

/** One fit note, labelled measured (seen on a page) or inferred. */
export interface FitNote { note: string; basis: "measured" | "inferred"; source_url?: string; }

export interface Lead {
  id: number;
  found_at: string;
  company: string;
  website: string | null;
  /** Two-letter country code, if known. */
  country: string | null;
  signal_type: SignalType;
  /** Exact words the finder was shown at signal_url. */
  signal_quote: string;
  signal_url: string;
  /** The signal's date, if one was shown (YYYY-MM-DD or as printed). */
  signal_date: string | null;
  /** JSON list of FitNote. */
  fit_notes: string;
  contact_name: string | null;
  contact_role: string | null;
  contact_email: string | null;
  /** Digits only. */
  contact_phone: string | null;
  /** The page the contact details were shown on. */
  contact_source_url: string | null;
  /** The lawful basis for emailing, where consent is required (Canada). */
  consent_basis: string | null;
  score_fit: number;
  score_timing: number;
  score_reach: number;
  channel: Channel;
  status: LeadStatus;
  draft_subject: string | null;
  draft_body: string | null;
  decided_at: string | null;
  decided_note: string | null;
  sent_at: string | null;
}

const list = (xs: readonly string[]) => xs.map((x) => `'${x}'`).join(",");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS leads (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  found_at            TEXT NOT NULL,
  company             TEXT NOT NULL,
  website             TEXT,
  country             TEXT,
  signal_type         TEXT NOT NULL CHECK (signal_type IN (${list(SIGNAL_TYPES)})),
  signal_quote        TEXT NOT NULL,
  signal_url          TEXT NOT NULL,
  signal_date         TEXT,
  fit_notes           TEXT NOT NULL DEFAULT '[]',
  contact_name        TEXT,
  contact_role        TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,
  contact_source_url  TEXT,
  -- Why emailing this lead is lawful where consent is needed (Canada's
  -- CASL): e.g. "published their address for business inquiries on <URL>".
  consent_basis       TEXT,
  -- Fit 0 means stop (templates/lead-scoring.md): such a lead is never stored.
  score_fit           INTEGER NOT NULL CHECK (score_fit BETWEEN 1 AND 4),
  score_timing        INTEGER NOT NULL CHECK (score_timing BETWEEN 0 AND 4),
  score_reach         INTEGER NOT NULL CHECK (score_reach BETWEEN 0 AND 2),
  channel             TEXT NOT NULL CHECK (channel IN (${list(CHANNELS)})),
  status              TEXT NOT NULL DEFAULT 'new' CHECK (status IN (${list(LEAD_STATUSES)})),
  draft_subject       TEXT,
  draft_body          TEXT,
  decided_at          TEXT,
  decided_note        TEXT,
  sent_at             TEXT
);
CREATE INDEX IF NOT EXISTS leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS leads_email ON leads(contact_email);

CREATE TABLE IF NOT EXISTS no_contact (
  value     TEXT PRIMARY KEY,         -- an email address, a bare domain, or phone digits
  added_at  TEXT NOT NULL,
  reason    TEXT NOT NULL
);

-- Every cent in or out. ref + kind is unique, so the same reward or the
-- same day's allowance can never be credited twice (a retry is harmless).
CREATE TABLE IF NOT EXISTS budget (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  at     TEXT NOT NULL,
  kind   TEXT NOT NULL CHECK (kind IN ('daily','approved','replied','spend','adjust')),
  ref    TEXT NOT NULL,
  cents  REAL NOT NULL,
  note   TEXT,
  UNIQUE (kind, ref)
);

CREATE TABLE IF NOT EXISTS sends (
  lead_id      INTEGER PRIMARY KEY REFERENCES leads(id),
  to_address   TEXT NOT NULL,
  at           TEXT NOT NULL,
  mode         TEXT NOT NULL CHECK (mode IN ('ses','by_hand','practice')),
  provider_id  TEXT
);
`;

/** The schema version this code writes (PRAGMA user_version). */
export const SCHEMA_VERSION = 1;

/**
 * Open (or create) the lead file. A file made by some other program (a
 * `leads` table without this engine's columns) is refused, never changed.
 * Later schema changes go in MIGRATIONS, run once each, in order.
 */
export function openLeadsDb(dbPath: string): BetterSqlite3.Database {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  const existing = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'leads'").get() as { sql: string } | undefined;
  if (existing && (!/\bsignal_quote\b/.test(existing.sql) || !/\bscore_fit\b/.test(existing.sql))) {
    db.close();
    throw new Error(`${dbPath} was made by another program, not Lead Scout's engine. Nothing was changed.`);
  }
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  let version = db.pragma("user_version", { simple: true }) as number;
  for (const m of MIGRATIONS) {
    if (m.version > version) { db.transaction(() => m.run(db))(); version = m.version; }
  }
  db.pragma(`user_version = ${Math.max(version, SCHEMA_VERSION)}`);
  return db;
}

/** Schema changes after version 1, each run once. Add new ones at the end. */
export const MIGRATIONS: { version: number; run: (db: BetterSqlite3.Database) => void }[] = [];

export function now(): string {
  return new Date().toISOString();
}

/** The domain part of an address, lower case. */
export function domainOf(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).trim().toLowerCase();
}

/** jane+promo@acme.com -> jane@acme.com: the same person's mailbox. */
export function baseAddress(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  return e.slice(0, at).replace(/\+.*$/, "") + e.slice(at);
}

export interface NoContactEntries { emails: string[]; domains: string[]; phones: string[]; }

/**
 * Everything on the user's do-not-contact.md (the list Lead Scout keeps by
 * hand), read generously, because it is better to block too much than to
 * contact someone who said no:
 *   - EVERY whole email address on EVERY line, whatever surrounds it
 *     ("- a@b.com", "Jane <a@b.com>", "| a@b.com |", "1. a@b.com",
 *     "**a@b.com**", "[a@b.com](mailto:a@b.com)", "2026-10-01: a@b.com said no");
 *   - a bare domain (acme.com) when it is the FIRST word on a line, after
 *     any bullet, number or table bar, so a web address in a note is not
 *     taken for a whole company;
 *   - every phone number on every line (compared as digits).
 */
export function noContactFileEntries(file = dataPath("do-not-contact.md")): NoContactEntries {
  const out: NoContactEntries = { emails: [], domains: [], phones: [] };
  let text = "";
  try { text = fs.readFileSync(file, "utf-8"); } catch { return out; }
  for (const line of text.split(/\r?\n/)) {
    for (const e of emailsIn(line)) out.emails.push(baseAddress(e));
    out.phones.push(...phonesIn(line));
    const first = line.replace(/^\s*(?:[-*+|>]|\d+[.)]|\[[ xX]\])?\s*(?:\[[ xX]\]\s*)?[`*_]*/, "").split(/[\s`*_,;|()]/)[0]
      .toLowerCase().replace(/[.:]+$/, "");
    if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(first)) out.domains.push(first.replace(/^www\./, ""));
  }
  return out;
}

/**
 * True if this address is on the no-contact list (the database table or
 * the user's do-not-contact.md), including its "+tag" variants, or its
 * domain or ANY parent domain is: "acme.com" blocks sales@mail.acme.com.
 */
export function isNoContact(db: BetterSqlite3.Database, email: string): boolean {
  const address = email.trim().toLowerCase();
  const candidates = new Set<string>([address, baseAddress(address)]);
  const labels = domainOf(address).split(".");
  for (let i = 0; i < labels.length - 1; i++) candidates.add(labels.slice(i).join("."));
  const all = [...candidates];
  const row = db
    .prepare(`SELECT 1 FROM no_contact WHERE value IN (${all.map(() => "?").join(",")}) LIMIT 1`)
    .get(...all);
  if (row) return true;
  const file = noContactFileEntries();
  const fromFile = new Set([...file.emails, ...file.domains]);
  return all.some((c) => fromFile.has(c));
}

/** True if this phone number is on the list (database or do-not-contact.md). */
export function isNoContactPhone(db: BetterSqlite3.Database, phone: string): boolean {
  const d = phoneDigits(phone);
  if (!d) return false;
  const listed = [
    ...(db.prepare("SELECT value FROM no_contact").all() as { value: string }[]).map((r) => r.value).filter((v) => /^\d{7,15}$/.test(v)),
    ...noContactFileEntries().phones,
  ];
  return listed.some((p) => samePhone(p, d));
}

export function getLead(db: BetterSqlite3.Database, id: number): Lead | undefined {
  return db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as Lead | undefined;
}

export function listLeads(db: BetterSqlite3.Database, status?: LeadStatus, limit = 200): Lead[] {
  return (status
    ? db.prepare("SELECT * FROM leads WHERE status = ? ORDER BY id DESC LIMIT ?").all(status, limit)
    : db.prepare("SELECT * FROM leads ORDER BY id DESC LIMIT ?").all(limit)) as Lead[];
}

/** The lead's fit notes, as stored. */
export function fitNotesOf(lead: Pick<Lead, "fit_notes">): FitNote[] {
  try {
    const parsed = JSON.parse(lead.fit_notes || "[]");
    return Array.isArray(parsed) ? parsed as FitNote[] : [];
  } catch { return []; }
}

/** The total score out of 10. */
export function totalScore(l: Pick<Lead, "score_fit" | "score_timing" | "score_reach">): number {
  return l.score_fit + l.score_timing + l.score_reach;
}
