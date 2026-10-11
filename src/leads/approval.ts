/**
 * THE USER'S DECISIONS, AND THE ONLY ROAD TO A SENT EMAIL.
 *
 * Imported only by the approval page (approval-server.ts). The finder
 * (runner, tools, manual mode) never imports this file, so it cannot
 * approve, send or touch the do-not-contact list (a test holds that).
 *
 * THE ROUTES (mailer.ts): BY HAND is the default. Approving writes the
 * final email to the outbox; the user sends it from their own mailbox and
 * then clicks "I sent it" (markSentByHand). SES, the optional advanced
 * route, sends it from here. Practice writes it with a PRACTICE banner.
 *
 * THE GATE (approveAndSend), every check BEFORE the email is written or sent:
 *   1. the lead has a draft waiting ("drafted") and is an email lead;
 *   2. what the user saw on screen is what is sent (draftVersion);
 *   3. the subject is not a fake reply or forward;
 *   4. the lead's country may be cold-emailed (not Germany, by default);
 *   5. the address, its +variants and its whole domain are not on the
 *      do-not-contact list (the database and do-not-contact.md);
 *   6. by hand: the footer is complete (name, business, real postal
 *      address, no placeholders) before anything can be approved; SES:
 *      all of that, plus the user's confirmation of AWS's requirement;
 *   7. a row is claimed in `sends` first: its unique key on the lead means
 *      a double click, a reload or a retry can never send twice.
 * Only then is the email sent, once. A failure is recorded, never retried.
 */
import fs from "fs";
import { createHash } from "crypto";
import type BetterSqlite3 from "better-sqlite3";
import { baseAddress, getLead, isNoContact, isNoContactPhone, now } from "./db.js";
import { credit } from "./budget.js";
import { countryRefusal, type LeadConfig } from "./config.js";
import { draftProblem } from "./drafting.js";
import { dataPath } from "./paths.js";
import { buildEmail, checkFooterReady, checkMailConfig, MailNotReady, type MailConfig, type Sender } from "./mailer.js";

export class Refused extends Error {}

/** A short fingerprint of a draft: what the user was shown when they pressed. */
export function draftVersion(subject: string | null, body: string | null): string {
  return createHash("sha256").update(`${subject ?? ""}\u0000${body ?? ""}`).digest("hex").slice(0, 16);
}

/**
 * Approve and send. `mail` may be null on the practice route.
 *
 * WHAT THE USER SAW IS WHAT IS SENT: the page posts the subject and body on
 * screen, plus the fingerprint of the draft the page was drawn with. If the
 * stored draft changed since (a new run re-drafted it), nothing is sent.
 * If the user edited the text on screen, their text is saved and sent.
 */
export async function approveAndSend(
  db: BetterSqlite3.Database, cfg: LeadConfig, mail: MailConfig | null, sender: Sender,
  leadId: number, note = "",
  onScreen?: { subject: string; body: string; version: string },
): Promise<{ status: "sent" | "send_failed" | "practice" | "by_hand"; providerId: string; error?: string }> {
  let lead = getLead(db, leadId);
  if (!lead) throw new Refused("There is no such lead.");
  if (lead.status !== "drafted") throw new Refused(`This lead is ${lead.status}; only a lead with a waiting draft can be sent.`);
  if (lead.channel !== "email" || !lead.contact_email) throw new Refused("This is not an email lead: use Approve (no email).");
  if (onScreen) {
    if (onScreen.version !== draftVersion(lead.draft_subject, lead.draft_body)) {
      throw new Refused("The draft changed since this page was drawn. Reload and read it again.");
    }
    if (onScreen.subject !== lead.draft_subject || onScreen.body !== lead.draft_body) {
      editDraft(db, leadId, onScreen.subject, onScreen.body);
      lead = getLead(db, leadId)!;
    }
  }
  if (!lead.draft_subject || !lead.draft_body) throw new Refused("This lead has no draft yet.");
  const problem = draftProblem(lead.draft_subject, lead.draft_body);
  if (problem) throw new Refused(problem);
  const country = countryRefusal(cfg, lead);
  if (country) throw new Refused(country);
  const to = lead.contact_email;
  if (!to) throw new Refused("This is not an email lead: use Approve (no email).");
  if (isNoContact(db, to)) throw new Refused("That address or its domain is on the do-not-contact list.");
  let fromCfg: MailConfig;
  const notReady = (err: unknown) => new Refused(`Not approved: ${err instanceof MailNotReady ? err.message : "the sending settings are unreadable."}`);
  if (sender.mode === "ses") {
    // Real sending: every setting real, and AWS's requirement confirmed.
    try { fromCfg = checkMailConfig(mail); } catch (err) { throw notReady(err); }
  } else if (sender.mode === "by_hand") {
    // The user will send this exact text: the footer must be complete first.
    try { fromCfg = checkFooterReady(mail); } catch (err) { throw notReady(err); }
  } else {
    fromCfg = {
      senderName: mail?.senderName || "(sender name not set)",
      businessName: mail?.businessName || "(business name not set)",
      fromAddress: mail?.fromAddress,
      replyTo: mail?.replyTo,
      postalAddress: mail?.postalAddress || "(practice: no postal address set; required before any real email)",
    };
  }
  const email = buildEmail(fromCfg, to, lead.draft_subject, lead.draft_body);

  // Claim the send and record the decision in ONE transaction, before sending.
  const claim = db.transaction(() => {
    const changed = db.prepare(
      "UPDATE leads SET status = 'approved', decided_at = ?, decided_note = ? WHERE id = ? AND status = 'drafted'",
    ).run(now(), note || null, leadId).changes;
    if (!changed) throw new Refused("This lead was decided a moment ago.");
    db.prepare("INSERT INTO sends (lead_id, to_address, at, mode) VALUES (?, ?, ?, ?)")
      .run(leadId, email.to, now(), sender.mode);
  });
  try {
    claim();
  } catch (err) {
    if (err instanceof Refused) throw err;
    throw new Refused("This lead has already been sent.");
  }
  credit(db, cfg, "approved", String(leadId), cfg.budget.approvedRewardCents, `approved lead ${leadId}`);

  try {
    const providerId = await sender.send(email);
    db.prepare("UPDATE sends SET provider_id = ? WHERE lead_id = ?").run(providerId, leadId);
    if (sender.mode === "practice") {
      // Practice mode wrote the outbox; nothing went out, so it is NOT "sent".
      db.prepare("UPDATE leads SET decided_note = COALESCE(decided_note || ' ', '') || '(practice: outbox only, not sent)' WHERE id = ?").run(leadId);
      return { status: "practice", providerId };
    }
    if (sender.mode === "by_hand") {
      // Written to the outbox. It is "sent" only when the user says so.
      return { status: "by_hand", providerId };
    }
    db.prepare("UPDATE leads SET status = 'sent', sent_at = ? WHERE id = ?").run(now(), leadId);
    return { status: "sent", providerId };
  } catch (err) {
    // Recorded, NOT retried: the service may have sent it anyway, and a
    // second copy is worse than none. The user can follow up by hand.
    db.prepare("UPDATE leads SET status = 'send_failed' WHERE id = ?").run(leadId);
    return { status: "send_failed", providerId: "", error: (err as Error).message };
  }
}

/**
 * "I sent it": the user sent the outbox email from their own mailbox. Only
 * for a lead approved on the by-hand route; recorded once.
 */
export function markSentByHand(db: BetterSqlite3.Database, leadId: number): void {
  const send = db.prepare("SELECT mode FROM sends WHERE lead_id = ?").get(leadId) as { mode: string } | undefined;
  if (!send || send.mode !== "by_hand") throw new Refused("Only an email approved on the by-hand route can be marked as sent by hand.");
  const changed = db.prepare("UPDATE leads SET status = 'sent', sent_at = ? WHERE id = ? AND status = 'approved'")
    .run(now(), leadId).changes;
  if (!changed) throw new Refused("This lead is not waiting to be sent.");
}

/** Approve a lead without the engine sending anything (another channel,
 * or the user sends it by hand). */
export function approveOnly(db: BetterSqlite3.Database, cfg: LeadConfig, leadId: number, note = ""): void {
  const changed = db.prepare(
    "UPDATE leads SET status = 'approved', decided_at = ?, decided_note = ? WHERE id = ? AND status IN ('new','drafted')",
  ).run(now(), note || null, leadId).changes;
  if (!changed) throw new Refused("Only a waiting lead can be approved.");
  credit(db, cfg, "approved", String(leadId), cfg.budget.approvedRewardCents, `approved lead ${leadId}`);
}

export function reject(db: BetterSqlite3.Database, leadId: number, note: string): void {
  const changed = db.prepare(
    "UPDATE leads SET status = 'rejected', decided_at = ?, decided_note = ? WHERE id = ? AND status IN ('new','drafted')",
  ).run(now(), note.trim().slice(0, 500) || null, leadId).changes;
  if (!changed) throw new Refused("Only a waiting lead can be rejected.");
}

/** They answered with interest. */
export function markReplied(db: BetterSqlite3.Database, cfg: LeadConfig, leadId: number): void {
  const changed = db.prepare(
    "UPDATE leads SET status = 'replied', decided_at = ? WHERE id = ? AND status IN ('approved','sent','send_failed')",
  ).run(now(), leadId).changes;
  if (!changed) throw new Refused("Only an approved or contacted lead can be marked as replied.");
  credit(db, cfg, "replied", String(leadId), cfg.budget.repliedRewardCents, `lead ${leadId} replied`);
}

/** They said no: closed, and their address goes on the do-not-contact list
 * for good (CLAUDE.md section 5). */
export function markNotInterested(db: BetterSqlite3.Database, leadId: number): void {
  const lead = getLead(db, leadId);
  if (!lead || !["approved", "sent", "send_failed", "replied"].includes(lead.status)) {
    throw new Refused("Only an approved or contacted lead can be marked as not interested.");
  }
  db.prepare("UPDATE leads SET status = 'not_interested', decided_at = ? WHERE id = ?").run(now(), leadId);
  if (lead.contact_email) addNoContact(db, lead.contact_email, `lead #${leadId} said not interested`);
}

/**
 * Never contact this address (or, given a bare domain, anyone there). It is
 * written to the database AND appended to my-company/do-not-contact.md, so
 * Lead Scout and the engine share one list. Any waiting lead at that
 * address or domain is closed at once.
 */
export function addNoContact(db: BetterSqlite3.Database, value: string, reason: string,
  file = dataPath("do-not-contact.md")): void {
  let v = value.trim().toLowerCase().replace(/^mailto:/, "");
  if (v.includes("@")) v = baseAddress(v);
  // A phone number is kept as its digits.
  const digits = /^[+\d\s().-]+$/.test(v) ? v.replace(/\D/g, "") : "";
  if (digits.length >= 7 && digits.length <= 15) v = digits;
  else if (!/^([^@\s]+@)?[a-z0-9.-]+\.[a-z]{2,}$/.test(v)) throw new Refused("Give an email address, a domain or a phone number.");
  const why = reason.replace(/[\r\n]+/g, " ").trim().slice(0, 300) || "asked not to be contacted";
  const added = db.prepare("INSERT OR IGNORE INTO no_contact (value, added_at, reason) VALUES (?, ?, ?)")
    .run(v, now(), why).changes;
  if (added) {
    const head = fs.existsSync(file) ? "" : "# Do not contact\n\nPermanent. Checked before every draft and every send.\n\n";
    fs.appendFileSync(file, `${head}- ${v} (${why}; added ${now().slice(0, 10)} on the approval page)\n`);
  }
  const waiting = db.prepare("SELECT id, contact_email, contact_phone FROM leads WHERE status IN ('new','drafted')").all() as
    { id: number; contact_email: string | null; contact_phone: string | null }[];
  for (const l of waiting) {
    if ((l.contact_email && isNoContact(db, l.contact_email)) || (l.contact_phone && isNoContactPhone(db, l.contact_phone))) {
      db.prepare("UPDATE leads SET status = 'do_not_contact', decided_at = ? WHERE id = ?").run(now(), l.id);
    }
  }
}

/** The user may edit a draft before sending. Their words are their call;
 * only the rules that apply to every email (draftProblem) are checked.
 * With `version`, the edit is refused if the stored draft changed since the
 * page was drawn (so a newer draft is never overwritten unseen). */
export function editDraft(db: BetterSqlite3.Database, leadId: number, subject: string, body: string, version?: string): void {
  if (version !== undefined) {
    const cur = getLead(db, leadId);
    if (!cur || version !== draftVersion(cur.draft_subject, cur.draft_body)) {
      throw new Refused("The draft changed since this page was drawn. Reload and read it again.");
    }
  }
  const s = subject.replace(/[\r\n]+/g, " ").trim();
  const b = body.replace(/\r\n/g, "\n").trim();
  if (s.length < 3 || s.length > 120 || b.length < 20 || b.length > 4000) throw new Refused("Subject 3-120 characters, body 20-4,000.");
  const problem = draftProblem(s, b);
  if (problem) throw new Refused(problem);
  const changed = db.prepare("UPDATE leads SET draft_subject = ?, draft_body = ? WHERE id = ? AND status = 'drafted'")
    .run(s, b, leadId).changes;
  if (!changed) throw new Refused("Only a waiting draft can be edited.");
}
