/**
 * THE BUDGET: a spending allowance that grows with results.
 *
 *   - Each day the engine runs, it is credited a small allowance.
 *   - Each lead the user APPROVES adds a little to what it may spend.
 *   - Each lead that REPLIES with interest adds more.
 *   - Every model call and every search is charged, to the cent.
 *   - Rejected leads earn nothing, so it learns what the user wants.
 *   - It stops when the balance reaches zero, and the balance never grows
 *     past a ceiling, so a lucky week is never an open tab.
 *
 * These "cents" are a NUMBER the user allows, not money the engine holds:
 * nothing in the engine can pay anyone. The real cost lands on the user's
 * Brave and Anthropic bills, which this ledger is built to stay under.
 */
import type BetterSqlite3 from "better-sqlite3";
import { now } from "./db.js";
import { checkPrice, type LeadConfig, type ModelPrice } from "./config.js";

export function balanceCents(db: BetterSqlite3.Database): number {
  const row = db.prepare("SELECT COALESCE(SUM(cents), 0) AS total FROM budget").get() as { total: number };
  return row.total;
}

/**
 * Credit an amount once per (kind, ref). A repeat of the same credit (a
 * double click, a retry) is ignored, never paid twice. Credits stop at the
 * ceiling: only the part that fits under it is added.
 * Returns the cents actually credited.
 */
export function credit(
  db: BetterSqlite3.Database,
  cfg: LeadConfig,
  kind: "daily" | "approved" | "replied" | "adjust",
  ref: string,
  cents: number,
  note = "",
): number {
  if (!Number.isFinite(cents)) throw new Error(`Refusing to credit ${cents} (${note}).`);
  const room = Math.max(0, cfg.budget.maxBalanceCents - balanceCents(db));
  const amount = Math.min(cents, room);
  const result = db
    .prepare("INSERT OR IGNORE INTO budget (at, kind, ref, cents, note) VALUES (?, ?, ?, ?, ?)")
    .run(now(), kind, ref, amount, note);
  return result.changes ? amount : 0;
}

/** Charge a cost. ref must be unique per charge (a request id, a counter).
 * A cost that is not a real number is an error, never a silent free call. */
export function charge(db: BetterSqlite3.Database, ref: string, cents: number, note: string): void {
  if (!Number.isFinite(cents)) throw new Error(`Refusing to record a cost of ${cents} (${note}).`);
  const r = db.prepare("INSERT OR IGNORE INTO budget (at, kind, ref, cents, note) VALUES (?, 'spend', ?, ?, ?)")
    .run(now(), ref, -Math.abs(cents), note);
  if (!r.changes) throw new Error(`A charge with the reference ${ref} was already recorded.`);
}

/** Today's allowance, once per UTC day. */
export function creditDailyAllowance(db: BetterSqlite3.Database, cfg: LeadConfig, today = now().slice(0, 10)): number {
  return credit(db, cfg, "daily", today, cfg.budget.dailyBaseCents, "daily allowance");
}

/** What one model call cost, in cents, from the token counts the API returns.
 * Over the long-prompt size the dearer rate applies to the whole call. */
export function modelCallCents(price: ModelPrice | undefined, inputTokens: number, outputTokens: number): number {
  if (!price) {
    // An unpriced model must never be free: refuse to guess.
    throw new Error("No price set for this model; add it to engine.json \"prices\" before using it.");
  }
  const p = checkPrice("this model", price);
  const rate = p.longPrompt && inputTokens > p.longPrompt.overInputTokens ? p.longPrompt : p;
  return (inputTokens * rate.inputCentsPerMTok + outputTokens * rate.outputCentsPerMTok) / 1_000_000;
}

/** The numbers the finder sees about itself at the start of each run. */
export function scorecard(db: BetterSqlite3.Database): {
  balanceCents: number; found: number; waiting: number; approved: number;
  rejected: number; sent: number; replied: number;
} {
  const count = (where: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM leads WHERE ${where}`).get() as { n: number }).n;
  return {
    balanceCents: balanceCents(db),
    found: count("1=1"),
    waiting: count("status IN ('new','drafted')"),
    approved: count("status IN ('approved','sent','send_failed','replied','not_interested')"),
    rejected: count("status = 'rejected'"),
    sent: count("status IN ('sent','replied','not_interested')"),
    replied: count("status = 'replied'"),
  };
}

/** Today's line of the scoreboard (UTC day), for the approval page. */
export function todayCents(db: BetterSqlite3.Database, today = now().slice(0, 10)): {
  allowanceCents: number; spentCents: number; earnedCents: number;
} {
  const sum = (where: string) => (db.prepare(
    `SELECT COALESCE(SUM(cents), 0) AS c FROM budget WHERE ${where} AND substr(at, 1, 10) = ?`,
  ).get(today) as { c: number }).c;
  return {
    allowanceCents: sum("kind = 'daily'"),
    spentCents: -sum("kind = 'spend'"),
    earnedCents: sum("kind IN ('approved','replied')"),
  };
}
