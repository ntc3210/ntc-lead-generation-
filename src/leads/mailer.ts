/**
 * BUILDING ONE EMAIL, AND THE ROUTES IT CAN TAKE. Imported ONLY by
 * approval.ts (the approval page). The finder's runner, tools and manual
 * mode never import this file, and never read the "sending" part of
 * engine.json (a test holds both).
 *
 * Every email carries, by construction (US CAN-SPAM Act; see
 * guide/channels/cold-email.md):
 *   - the sender's name and business;
 *   - a line saying it is a business email;
 *   - the sender's real physical postal address;
 *   - a plain way to say no, honoured by the do-not-contact list.
 *
 * THE ROUTES ("route" in the "sending" part of engine.json):
 *   by_hand   THE DEFAULT, and the recommended one. Approving writes the
 *             final email to the outbox folder. The user copies it into
 *             their own work email (Gmail, Outlook ...), presses send
 *             there, then clicks "I sent it" on the approval page. Nothing
 *             can be approved until the sender's name, business and real
 *             postal address are filled in.
 *   practice  For trying the tool out: approving writes the email to the
 *             outbox with a clear PRACTICE banner (and NOT READY TO SEND
 *             when the footer is incomplete). It is never marked sent.
 *   ses       OPTIONAL, ADVANCED: the engine sends through Amazon SES.
 *             Only when every setting is real AND the user has confirmed
 *             (sesAwsRequirementConfirmed) that they read AWS's production
 *             access requirement and that their use fits it.
 */
import fs from "fs";
import path from "path";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { dataPath } from "./paths.js";

export type Route = "by_hand" | "practice" | "ses";

export interface MailConfig {
  /** How approved emails go out. Default (and recommended): "by_hand". */
  route?: Route;
  /** The person sending, e.g. "Jane Doe". */
  senderName: string;
  /** The business named in the footer. */
  businessName: string;
  /** The sending address. Required for "ses"; optional for "by_hand"
   * (you send from your own mailbox). */
  fromAddress?: string;
  /** Where replies (and "no thanks") go. Defaults to fromAddress. */
  replyTo?: string;
  /** The sender's real physical postal address, one line. Required by law. */
  postalAddress: string;
  /** SES only: the AWS region the identity is in, e.g. "us-east-1". */
  awsRegion?: string;
  /** SES only: a named AWS CLI profile for sending. */
  awsProfile?: string;
  /**
   * SES only. True ONLY after the user has read AWS's production-access
   * requirement, quoted in SES_REQUIREMENT below, and confirmed their use
   * fits it. Lead Scout never sets this for the user.
   */
  sesAwsRequirementConfirmed?: boolean;
}

/** AWS's words on the SES production-access form (AWS documentation,
 * "Request production access", checked 11 October 2026). */
export const SES_REQUIREMENT = "only send email to individuals who've explicitly requested it";

export class MailNotReady extends Error {}

/** The "sending" part of engine.json, or null if there is none. */
export function loadMailConfig(file = dataPath("engine.json")): MailConfig | null {
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as { sending?: MailConfig };
  return raw.sending ?? null;
}

/** "<your postal address>" and the like: a template value never filled in. */
export function isPlaceholder(v: unknown): boolean {
  return typeof v === "string" && /<[^>]*>|\[[^\]]*(your|name|address)[^\]]*\]|\byour (name|company|postal|address)\b/i.test(v);
}
const EMAIL = /^[^@\s<>]+@[^@\s<>]+\.[a-z]{2,}$/i;

/**
 * The footer is complete: name, business and a real postal address, with
 * no template placeholder left anywhere. Needed before ANY email is
 * approved on the by-hand route, and for SES. Throws MailNotReady.
 */
export function checkFooterReady(cfg: MailConfig | null): MailConfig {
  if (!cfg) throw new MailNotReady("No \"sending\" settings in engine.json yet: add your name, business name and postal address.");
  // Every field that goes into the email must be filled in for real.
  // (The SES-only fields are checked by checkMailConfig, and ignored here.)
  for (const k of ["senderName", "businessName", "postalAddress", "replyTo"] as const) {
    if (isPlaceholder(cfg[k])) throw new MailNotReady(`"${k}" still holds a template placeholder (${String(cfg[k]).slice(0, 60)}). Fill it in${k === "replyTo" ? ", or delete the line" : ""}.`);
  }
  if (!cfg.senderName?.trim()) throw new MailNotReady("senderName is missing.");
  if (!cfg.businessName?.trim()) throw new MailNotReady("businessName is missing.");
  const postal = (cfg.postalAddress || "").trim();
  // A real address has words AND numbers (a street or box number, a postcode).
  if (postal.length < 10 || !/\p{L}{2,}/u.test(postal) || !/\d/.test(postal) || /\bexample\b|\btest\b|n\/a|tbd|^x+$/i.test(postal)) {
    throw new MailNotReady("postalAddress (your company's real physical mailing address, with street or box number and postcode) is required by law before any email.");
  }
  const replyTo = (cfg.replyTo || "").trim();
  if (replyTo && !EMAIL.test(replyTo)) throw new MailNotReady("replyTo is not an email address.");
  return cfg;
}

/** Everything real sending through SES needs. Throws MailNotReady. */
export function checkMailConfig(cfg: MailConfig | null): MailConfig {
  const ok = checkFooterReady(cfg);
  for (const k of ["fromAddress", "awsRegion", "awsProfile"] as const) {
    if (isPlaceholder(ok[k])) throw new MailNotReady(`"${k}" still holds a template placeholder. Fill it in for SES.`);
  }
  if (!ok.fromAddress || !EMAIL.test(ok.fromAddress.trim())) throw new MailNotReady("fromAddress (on your verified sending domain) is required to send through SES.");
  if (!ok.awsRegion?.trim()) throw new MailNotReady("awsRegion is missing.");
  if (ok.sesAwsRequirementConfirmed !== true) {
    throw new MailNotReady(`Before SES can be used, read AWS's production-access requirement ("${SES_REQUIREMENT}"), confirm your use fits it, and set "sesAwsRequirementConfirmed": true yourself. Until then, send by hand.`);
  }
  return ok;
}

export interface OutgoingEmail { to: string; from: string; replyTo: string; subject: string; text: string; }

/** The draft plus the required footer. Pure: easy to test. */
export function buildEmail(cfg: MailConfig, to: string, subject: string, body: string): OutgoingEmail {
  // A placeholder is never printed: an unfilled SES field is just ignored.
  const real = (v?: string) => (v && !isPlaceholder(v) ? v.trim() : "");
  const fromAddress = real(cfg.fromAddress);
  const replyTo = real(cfg.replyTo) || fromAddress;
  const business = cfg.businessName.trim();
  const footer = [
    "",
    "--",
    `${cfg.senderName.trim()}, ${business}`,
    cfg.postalAddress.trim(),
    "",
    `This is a business email from ${business}.`,
    `Not interested? Reply "no thanks"${replyTo ? ` (or write to ${replyTo})` : ""} and we will not email you again.`,
  ].join("\n");
  return {
    to: to.trim().toLowerCase(),
    from: fromAddress ? `${cfg.senderName.trim()} <${fromAddress}>` : `${cfg.senderName.trim()} (your own mailbox)`,
    replyTo,
    subject: subject.replace(/[\r\n]+/g, " ").trim(),
    text: `${body.trim()}\n${footer}\n`,
  };
}

export interface Sender {
  mode: Route;
  send(email: OutgoingEmail): Promise<string>;
}

/** Sends through Amazon SES (v2). One attempt; the caller records failure. */
export function sesSender(cfg: MailConfig): Sender {
  const client = new SESv2Client({
    region: cfg.awsRegion,
    ...(cfg.awsProfile ? { profile: cfg.awsProfile } : {}),
    maxAttempts: 1,
  });
  return {
    mode: "ses",
    async send(email) {
      const out = await client.send(new SendEmailCommand({
        FromEmailAddress: email.from,
        Destination: { ToAddresses: [email.to] },
        ...(email.replyTo ? { ReplyToAddresses: [email.replyTo] } : {}),
        Content: { Simple: {
          Subject: { Data: email.subject, Charset: "UTF-8" },
          Body: { Text: { Data: email.text, Charset: "UTF-8" } },
        } },
      }));
      return out.MessageId || "";
    },
  };
}

/** Write one email to the outbox folder, with a banner line on top. */
function writeOutbox(dir: string, email: OutgoingEmail, banner: string): string {
  fs.mkdirSync(dir, { recursive: true });
  const name = `${new Date().toISOString().replace(/[:.]/g, "-")}-${email.to.replace(/[^a-z0-9@.]/gi, "_")}.txt`;
  fs.writeFileSync(path.join(dir, name),
    `${banner}\n\nTo: ${email.to}\nFrom: ${email.from}\n${email.replyTo ? `Reply-To: ${email.replyTo}\n` : ""}Subject: ${email.subject}\n\n${email.text}`);
  return name;
}

/** The by-hand route: the final email is written to the outbox for the
 * user to send from their own mailbox. Nothing is sent by the engine. */
export function byHandSender(dir = dataPath("outbox")): Sender {
  return {
    mode: "by_hand",
    async send(email) {
      return `outbox:${writeOutbox(dir, email,
        "READY TO SEND BY HAND: copy the subject and the text below into your own work email, send it, then click \"I sent it\" on the approval page.")}`;
    },
  };
}

/** Practice: written to the outbox with a banner, never sent, never marked sent. */
export function practiceSender(dir = dataPath("outbox"), notReady: string | null = null): Sender {
  return {
    mode: "practice",
    async send(email) {
      const banner = (notReady ? `NOT READY TO SEND: ${notReady}\n` : "")
        + "PRACTICE ONLY: this email was not sent and must not be sent as it is.";
      return `practice:${writeOutbox(dir, email, banner)}`;
    },
  };
}

/** The reason the footer is not ready, or null. */
export function footerProblem(mail: MailConfig | null): string | null {
  try { checkFooterReady(mail); return null; } catch (err) { return (err as Error).message; }
}

/**
 * Pick the route for approved emails. Never throws. By hand unless the
 * settings say otherwise; SES only when checkMailConfig passes (otherwise
 * by hand, with the reason in the note).
 */
export function chooseSender(mail: MailConfig | null, outbox?: string): { sender: Sender; mail: MailConfig | null; note: string } {
  const route: Route = mail?.route ?? "by_hand";
  const notReady = footerProblem(mail);
  if (route === "practice") {
    return { sender: practiceSender(outbox, notReady), mail,
      note: `PRACTICE: approved emails are written to the outbox folder with a PRACTICE banner; nothing is sent${notReady ? `. NOT READY TO SEND: ${notReady}` : ""}` };
  }
  if (route === "ses") {
    try {
      const ok = checkMailConfig(mail);
      return { sender: sesSender(ok), mail: ok, note: `LIVE (Amazon SES): approved emails are SENT from ${ok.fromAddress}` };
    } catch (err) {
      return { sender: byHandSender(outbox), mail,
        note: `BY HAND (SES is not switched on: ${(err as Error).message})` };
    }
  }
  return { sender: byHandSender(outbox), mail,
    note: notReady
      ? `BY HAND, NOT READY: ${notReady} Nothing can be approved for email until this is fixed.`
      : "BY HAND: approving writes the final email to the outbox folder; send it from your own mailbox, then click \"I sent it\"" };
}
