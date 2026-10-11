/**
 * WHERE THE USER'S DATA LIVES. Every file the engine reads or writes about
 * the user's company comes from dataPath() below, and nowhere else (a test
 * holds that no other engine file names these files).
 *
 * The data home is `<this folder>/my-company/` by default: the same private
 * folder Lead Scout's notes live in, which .gitignore keeps out of git. Set
 * the environment variable LEAD_SCOUT_HOME to use another folder instead
 * (the tests do, so they never touch the real one).
 *
 * Files in the data home:
 *   engine.json          the engine's settings: search key, budget, sender
 *                        (copied from templates/engine.example.json)
 *   leads.db             the leads, the do-not-contact list, the budget
 *                        ledger and the record of sends (SQLite)
 *   outbox/              each approved email, for the user to send by hand
 *   manual-session.json  manual mode: what the finder has been shown so far,
 *                        signed with the key in manual-session.key
 *   profile.md           the company profile Lead Scout wrote (read only)
 *   do-not-contact.md    the do-not-contact list Lead Scout keeps (read; the
 *                        approval page also appends to it)
 */
import path from "path";
import { fileURLToPath } from "url";

/** The project folder: two levels up from src/leads (or dist/leads). */
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The names of every data file, in one place. */
export type DataFile =
  | "engine.json"
  | "leads.db"
  | "outbox"
  | "manual-session.json"
  | "manual-session.key"
  | "profile.md"
  | "do-not-contact.md";

/** The data home: LEAD_SCOUT_HOME if set, else <project>/my-company. */
export function leadScoutHome(): string {
  const env = (process.env.LEAD_SCOUT_HOME || "").trim();
  return env ? path.resolve(env) : path.join(PROJECT_ROOT, "my-company");
}

/** The full path of one data file in the data home. */
export function dataPath(file: DataFile): string {
  return path.join(leadScoutHome(), file);
}

/** A file shipped with the project itself (templates, the finder's
 * instructions). Never user data. */
export function projectFile(...parts: string[]): string {
  return path.join(PROJECT_ROOT, ...parts);
}
