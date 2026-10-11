/**
 * THE ENGINE'S SETTINGS, from <data home>/engine.json.
 *
 * One file holds everything (start from templates/engine.example.json).
 * It has two parts, and each program reads only its own:
 *
 *   the finder part   search key, models, prices, budget, caps, user agent,
 *                     personal-mailbox and country rules. Read here, by
 *                     loadLeadConfig(), for every program.
 *   "sending"         who the email is from, the postal address, AWS SES
 *                     settings and the sending route (by hand by default). Read ONLY by mailer.ts,
 *                     which only the approval page imports. loadLeadConfig()
 *                     drops this part, so the finder never holds it (a test
 *                     checks that).
 *
 * The Anthropic key (only needed by the unattended runner) comes from the
 * environment variable ANTHROPIC_API_KEY; it is never written to a file by
 * this code. Never put a real key in templates/ or anywhere in git.
 */
import fs from "fs";
import path from "path";
import { dataPath, leadScoutHome } from "./paths.js";

export interface ModelPrice {
  /** US cents per million input tokens. */
  inputCentsPerMTok: number;
  /** US cents per million output tokens. */
  outputCentsPerMTok: number;
  /** A dearer rate for prompts over a size (Haiku 5.5: over 100K tokens). */
  longPrompt?: { overInputTokens: number; inputCentsPerMTok: number; outputCentsPerMTok: number };
}

/** A price with a missing or nonsense number would make calls free. */
export function checkPrice(model: string, p: ModelPrice | undefined): ModelPrice {
  const ok = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n > 0;
  if (!p || !ok(p.inputCentsPerMTok) || !ok(p.outputCentsPerMTok)) {
    throw new Error(`The price for ${model} is missing or not a positive number; fix "prices" in engine.json.`);
  }
  if (p.longPrompt && (!ok(p.longPrompt.overInputTokens) || !ok(p.longPrompt.inputCentsPerMTok) || !ok(p.longPrompt.outputCentsPerMTok))) {
    throw new Error(`The long-prompt price for ${model} is incomplete; fix "prices" in engine.json.`);
  }
  return p;
}

export interface LeadConfig {
  /** The SQLite file holding leads, the no-contact list and the budget. */
  dbPath: string;
  /** Brave Search API key (https://brave.com/search/api). Empty = no search. */
  braveApiKey: string;
  /** The model that searches and reads (cheap). Unattended runs only. */
  model: string;
  /** The model that writes email drafts. Unattended runs only. */
  draftModel: string;
  /** Prices, so every model call is charged to the budget in cents. */
  prices: Record<string, ModelPrice>;
  /** What one search costs, in hundredths of a cent ($5 per 1,000 = 50). */
  searchCostHundredthsOfCent: number;
  budget: {
    /** Credited once per calendar day the engine runs (US cents). */
    dailyBaseCents: number;
    /** Credited when the user approves one of the finder's leads. */
    approvedRewardCents: number;
    /** Credited when a lead replies with interest. */
    repliedRewardCents: number;
    /** The balance never grows past this. */
    maxBalanceCents: number;
  };
  /** Hard cap on model calls in one unattended run, whatever the budget. */
  maxModelCallsPerRun: number;
  /** Sent with every web request. The part before "/" is the robot name
   * robots.txt rules are matched against. */
  userAgent: string;
  /** May a lead's email be a personal mailbox (gmail, yahoo ...)? Off by
   * default: Lead Scout collects business contact details only. When on,
   * only an address printed on the lead's own website counts. */
  allowPersonalMailbox: boolean;
  /**
   * Countries (two-letter codes) that get NO cold email by default.
   * guide/channels/cold-email.md: Germany's UWG section 7 needs prior
   * express consent even between businesses. A lead marked with one of
   * these countries, or whose email ends in that country's domain (.de),
   * cannot be drafted or sent. Set to [] only after taking advice.
   */
  noColdEmailCountries: string[];
  /**
   * Countries (two-letter codes) where cold email needs a consent basis
   * first. Canada's CASL (guide/channels/cold-email.md): express or implied
   * consent, e.g. an address the person published for business, with no
   * "no unsolicited messages" note. A lead in one of these countries (by
   * country, email or website ending) is only drafted or sent when it
   * records its consent_basis.
   */
  consentRequiredCountries: string[];
}

/** The defaults. Prices checked against Anthropic's model table, 6 Oct
 * 2026 (Haiku 5.5: $0.10 / $0.50 per million tokens up to 100K-token
 * prompts, $0.50 / $2.50 over; Sonnet 5.5: $2 / $10). */
export const DEFAULT_LEAD_CONFIG: Omit<LeadConfig, "dbPath"> = {
  braveApiKey: "",
  model: "claude-haiku-5-5",
  draftModel: "claude-sonnet-5-5",
  prices: {
    "claude-haiku-5-5": { inputCentsPerMTok: 10, outputCentsPerMTok: 50,
                          longPrompt: { overInputTokens: 100_000, inputCentsPerMTok: 50, outputCentsPerMTok: 250 } },
    "claude-sonnet-5-5": { inputCentsPerMTok: 200, outputCentsPerMTok: 1000 },
  },
  searchCostHundredthsOfCent: 50,
  budget: {
    dailyBaseCents: 200,
    approvedRewardCents: 100,
    repliedRewardCents: 500,
    maxBalanceCents: 5000,
  },
  maxModelCallsPerRun: 60,
  userAgent: "LeadScout/0.1 (+contact via the address in each email)",
  allowPersonalMailbox: false,
  noColdEmailCountries: ["DE"],
  consentRequiredCountries: ["CA"],
};

/** The finder part's keys: anything else in engine.json is ignored here. */
const FINDER_KEYS = new Set<string>([...Object.keys(DEFAULT_LEAD_CONFIG), "dbPath"]);

/** Load engine.json (finder part only), filling gaps from the defaults. */
export function loadLeadConfig(file = dataPath("engine.json")): LeadConfig {
  let raw: Record<string, unknown> = {};
  if (fs.existsSync(file)) raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  // Keep only the finder's keys: the "sending" part never enters this object.
  const fromFile = Object.fromEntries(Object.entries(raw).filter(([k]) => FINDER_KEYS.has(k))) as Partial<LeadConfig>;
  const cfg: LeadConfig = {
    ...DEFAULT_LEAD_CONFIG,
    ...fromFile,
    prices: { ...DEFAULT_LEAD_CONFIG.prices, ...(fromFile.prices || {}) },
    budget: { ...DEFAULT_LEAD_CONFIG.budget, ...(fromFile.budget || {}) },
    noColdEmailCountries: (fromFile.noColdEmailCountries ?? DEFAULT_LEAD_CONFIG.noColdEmailCountries).map((c) => String(c).toUpperCase()),
    consentRequiredCountries: (fromFile.consentRequiredCountries ?? DEFAULT_LEAD_CONFIG.consentRequiredCountries).map((c) => String(c).toUpperCase()),
    dbPath: path.resolve(leadScoutHome(), fromFile.dbPath || dataPath("leads.db")),
  };
  // The database stays inside the data home (never in the shared project).
  const rel = path.relative(leadScoutHome(), cfg.dbPath);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`dbPath must be a file inside the data home (${leadScoutHome()}); fix engine.json.`);
  }
  // A search that costs nothing, or NaN, would make the budget meaningless.
  checkSearchPrice(cfg.searchCostHundredthsOfCent);
  // Refuse to start with a price that would make a model free.
  checkPrice(cfg.model, cfg.prices[cfg.model]);
  checkPrice(cfg.draftModel, cfg.prices[cfg.draftModel]);
  return cfg;
}

/** The price of one search must be a real, positive number. */
export function checkSearchPrice(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
    throw new Error("searchCostHundredthsOfCent is missing or not a positive number; fix engine.json (Brave: 50 = $5 per 1,000).");
  }
  return v;
}

/** A country code's internet domain ending: "DE" -> "de", "GB" -> "uk". */
function countryTld(code: string): string {
  const c = code.trim().toLowerCase();
  return c === "gb" ? "uk" : c;
}

/**
 * Why this lead may not be cold-emailed because of its country, or null.
 * Checked when a draft is stored AND again at the send gate.
 */
export function countryRefusal(cfg: Pick<LeadConfig, "noColdEmailCountries" | "consentRequiredCountries">,
  lead: { country?: string | null; contact_email?: string | null; website?: string | null; consent_basis?: string | null }): string | null {
  // The lead's country, by what it says and by its email and website endings.
  const tlds: string[] = [];
  const email = (lead.contact_email || "").trim().toLowerCase();
  if (email.includes("@")) tlds.push(email.slice(email.lastIndexOf(".") + 1));
  try {
    if (lead.website) tlds.push(new URL(lead.website).hostname.toLowerCase().replace(/\.+$/, "").split(".").pop() || "");
  } catch { /* not an address */ }
  const country = (lead.country || "").trim().toUpperCase();
  const inList = (list: string[]) => list.map((c) => c.toUpperCase())
    .find((c) => c === country || tlds.includes(countryTld(c)));
  const blocked = inList(cfg.noColdEmailCountries);
  if (blocked) {
    return `No cold email to leads in ${blocked} (by its country, email or website; see guide/channels/cold-email.md). Use another channel, or change noColdEmailCountries in engine.json after taking advice.`;
  }
  const consent = inList(cfg.consentRequiredCountries);
  if (consent && !(lead.consent_basis || "").trim()) {
    return `Leads in ${consent} need a consent basis before any email (Canada's CASL; see guide/channels/cold-email.md). Record consent_basis on the lead, or use another channel.`;
  }
  return null;
}
