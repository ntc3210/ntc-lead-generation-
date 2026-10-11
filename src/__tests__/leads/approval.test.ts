/**
 * THE SEND GATE AND THE REWARDS: only the user's approval sends, never
 * twice, never to a do-not-contact address, never to Germany by default,
 * never for real without a postal address, and every reward is paid once.
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  addNoContact, approveAndSend, approveOnly, draftVersion, editDraft, markNotInterested, markReplied, markSentByHand, reject, Refused,
} from "../../leads/approval.js";
import { balanceCents, charge, creditDailyAllowance, modelCallCents } from "../../leads/budget.js";
import { DEFAULT_LEAD_CONFIG, countryRefusal } from "../../leads/config.js";
import {
  buildEmail, byHandSender, checkFooterReady, checkMailConfig, chooseSender, MailNotReady, practiceSender, SES_REQUIREMENT,
  type MailConfig, type Sender,
} from "../../leads/mailer.js";
import { getLead, isNoContact, isNoContactPhone } from "../../leads/db.js";
import { addLead, freshDb } from "./helpers.js";

/** Complete settings for the optional SES route. */
const MAIL: MailConfig = {
  route: "ses", senderName: "Sam Carter", businessName: "Acme Scheduling", fromAddress: "sam@get-acme.example.com",
  postalAddress: "100 Market Street, Suite 4, Springfield, IL 62701, USA", awsRegion: "us-east-1",
  sesAwsRequirementConfirmed: true,
};
/** Complete settings for the default by-hand route. */
const HAND: MailConfig = {
  senderName: "Sam Carter", businessName: "Acme Scheduling", replyTo: "sam@acme.example.com",
  postalAddress: "100 Market Street, Suite 4, Springfield, IL 62701, USA",
};
/** The template's untouched placeholders. */
const TEMPLATE: MailConfig = {
  route: "by_hand", senderName: "<your name>", businessName: "<your company's name>",
  postalAddress: "<your company's real postal address, one line>", replyTo: "<optional: where replies go>",
};

/** Stands in for SES: counts sends, can be told to fail. */
function countingSender(fail = false): Sender & { calls: number } {
  const s = { mode: "ses" as const, calls: 0, async send() { s.calls++; if (fail) throw new Error("SES said no"); return "id-1"; } };
  return s;
}

describe("approveAndSend", () => {
  it("sends once, pays the approval reward once, and marks it sent", async () => {
    const { db, cfg } = freshDb();
    const id = addLead(db);
    const sender = countingSender();
    expect((await approveAndSend(db, cfg, MAIL, sender, id)).status).toBe("sent");
    expect(getLead(db, id)?.status).toBe("sent");
    expect(balanceCents(db)).toBe(cfg.budget.approvedRewardCents);
    await expect(approveAndSend(db, cfg, MAIL, sender, id)).rejects.toThrow(Refused);
    expect(sender.calls).toBe(1);
    expect(balanceCents(db)).toBe(cfg.budget.approvedRewardCents);
  });
  it("refuses a do-not-contact address, a do-not-contact domain, and one listed in do-not-contact.md", async () => {
    const { db, cfg, dir } = freshDb();
    const a = addLead(db, { contact_email: "x@stop.example.com" });
    addNoContact(db, "x@stop.example.com", "asked");
    const b = addLead(db, { contact_email: "y@blocked.example.com" });
    db.prepare("INSERT INTO no_contact (value, added_at, reason) VALUES ('blocked.example.com', 'now', 'domain')").run();
    const c = addLead(db, { contact_email: "z@handlist.example.com" });
    fs.appendFileSync(path.join(dir, "do-not-contact.md"), "- handlist.example.com (said no on the phone)\n");
    const sender = countingSender();
    await expect(approveAndSend(db, cfg, MAIL, sender, a)).rejects.toThrow(Refused);
    await expect(approveAndSend(db, cfg, MAIL, sender, b)).rejects.toThrow(/do-not-contact/);
    await expect(approveAndSend(db, cfg, MAIL, sender, c)).rejects.toThrow(/do-not-contact/);
    expect(sender.calls).toBe(0);
  });
  it("a domain block covers subdomains, an address block covers +variants", async () => {
    const { db, cfg } = freshDb();
    addNoContact(db, "acme-x.example.com", "no");
    addNoContact(db, "jane@acme-y.example.com", "no");
    const a = addLead(db, { contact_email: "sales@mail.acme-x.example.com" });
    const b = addLead(db, { contact_email: "jane+promo@acme-y.example.com" });
    // addNoContact closes waiting leads at once; reopen them to test the gate itself.
    db.prepare("UPDATE leads SET status = 'drafted'").run();
    const sender = countingSender();
    await expect(approveAndSend(db, cfg, MAIL, sender, a)).rejects.toThrow(Refused);
    await expect(approveAndSend(db, cfg, MAIL, sender, b)).rejects.toThrow(Refused);
    expect(sender.calls).toBe(0);
  });
  it("refuses a lead with no draft, or that is not an email lead", async () => {
    const { db, cfg } = freshDb();
    const noDraft = addLead(db, { draft_subject: null, draft_body: null, status: "new" });
    const phone = addLead(db, { contact_email: null, channel: "phone", contact_phone: "15125550142" });
    await expect(approveAndSend(db, cfg, MAIL, countingSender(), noDraft)).rejects.toThrow(/waiting draft/);
    await expect(approveAndSend(db, cfg, MAIL, countingSender(), phone)).rejects.toThrow(/not an email lead/);
  });
  it("the sends record allows one send per lead, even if the lead's status were reset", async () => {
    const { db, cfg } = freshDb();
    const id = addLead(db);
    const sender = countingSender();
    await approveAndSend(db, cfg, MAIL, sender, id);
    db.prepare("UPDATE leads SET status = 'drafted' WHERE id = ?").run(id);
    await expect(approveAndSend(db, cfg, MAIL, sender, id)).rejects.toThrow(/already been sent/);
    expect(sender.calls).toBe(1);
  });
  it("a refused send is recorded and NOT retried", async () => {
    const { db, cfg } = freshDb();
    const id = addLead(db);
    const sender = countingSender(true);
    expect((await approveAndSend(db, cfg, MAIL, sender, id)).status).toBe("send_failed");
    await expect(approveAndSend(db, cfg, MAIL, sender, id)).rejects.toThrow(Refused);
    expect(sender.calls).toBe(1);
  });
  it("two clicks at once still send one email", async () => {
    const { db, cfg } = freshDb();
    const id = addLead(db);
    const sender = countingSender();
    const results = await Promise.allSettled([
      approveAndSend(db, cfg, MAIL, sender, id), approveAndSend(db, cfg, MAIL, sender, id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(sender.calls).toBe(1);
  });
  it("practice writes the outbox with a PRACTICE banner (and NOT READY while the footer is incomplete), sends nothing, never 'sent'", async () => {
    const { db, cfg, dir } = freshDb();
    const id = addLead(db);
    const outbox = path.join(dir, "outbox");
    const { sender } = chooseSender({ ...TEMPLATE, route: "practice" }, outbox);
    expect(sender.mode).toBe("practice");
    expect((await approveAndSend(db, cfg, TEMPLATE, sender, id)).status).toBe("practice");
    expect(getLead(db, id)?.status).toBe("approved");
    const files = fs.readdirSync(outbox);
    expect(files).toHaveLength(1);
    const text = fs.readFileSync(path.join(outbox, files[0]), "utf-8");
    expect(text.split("\n")[0]).toMatch(/^NOT READY TO SEND: /);
    expect(text).toContain("PRACTICE ONLY");
    expect(text).toContain("Not interested?");
    expect(() => markSentByHand(db, id)).toThrow(/by-hand route/);
  });
  it("what is on the user's screen is what is sent, edits included", async () => {
    const { db, cfg } = freshDb();
    const id = addLead(db);
    const lead = getLead(db, id)!;
    const sent: string[] = [];
    const sender: Sender = { mode: "ses", async send(e) { sent.push(e.text); return "m1"; } };
    const body = "Hello Dana, edited on screen: I saw your scheduling coordinator post. Would a short call help?";
    await approveAndSend(db, cfg, MAIL, sender, id, "", {
      subject: "Edited subject", body, version: draftVersion(lead.draft_subject, lead.draft_body) });
    expect(sent[0]).toContain("edited on screen");
    expect(getLead(db, id)?.draft_subject).toBe("Edited subject");
  });
  it("a draft changed since the page was drawn is not sent", async () => {
    const { db, cfg } = freshDb();
    const id = addLead(db);
    const sender = countingSender();
    await expect(approveAndSend(db, cfg, MAIL, sender, id, "", { subject: "x", body: "y", version: draftVersion("old", "older body") }))
      .rejects.toThrow(/changed since/);
    expect(sender.calls).toBe(0);
  });
  it("a fake reply subject is refused at send time", async () => {
    const { db, cfg } = freshDb();
    const id = addLead(db, { draft_subject: "Re: your order #4411" });
    await expect(approveAndSend(db, cfg, MAIL, countingSender(), id)).rejects.toThrow(/reply/);
  });
});

describe("the by-hand route (the default): the outbox, then 'I sent it'", () => {
  it("is the default route, and the template's settings can approve nothing", async () => {
    expect(chooseSender(null).sender.mode).toBe("by_hand");
    expect(chooseSender(HAND).sender.mode).toBe("by_hand");
    expect(chooseSender(TEMPLATE).note).toMatch(/NOT READY/);
    const { db, cfg, dir } = freshDb();
    const id = addLead(db);
    const outbox = path.join(dir, "outbox");
    await expect(approveAndSend(db, cfg, TEMPLATE, byHandSender(outbox), id)).rejects.toThrow(/Not approved: .*placeholder/);
    await expect(approveAndSend(db, cfg, null, byHandSender(outbox), id)).rejects.toThrow(/Not approved/);
    expect(getLead(db, id)?.status).toBe("drafted");
    expect(fs.existsSync(outbox)).toBe(false);
  });
  it("approving writes the exact final email to the outbox; 'I sent it' records it once", async () => {
    const { db, cfg, dir } = freshDb();
    const id = addLead(db);
    const outbox = path.join(dir, "outbox");
    expect((await approveAndSend(db, cfg, HAND, byHandSender(outbox), id)).status).toBe("by_hand");
    expect(getLead(db, id)?.status).toBe("approved");
    const [file] = fs.readdirSync(outbox);
    const text = fs.readFileSync(path.join(outbox, file), "utf-8");
    expect(text).toMatch(/^READY TO SEND BY HAND/);
    expect(text).toContain(getLead(db, id)!.draft_body!);
    expect(text).toContain(HAND.postalAddress);
    expect(text).toContain('Reply "no thanks" (or write to sam@acme.example.com)');
    markSentByHand(db, id);
    expect(getLead(db, id)?.status).toBe("sent");
    expect(getLead(db, id)?.sent_at).toBeTruthy();
    expect(() => markSentByHand(db, id)).toThrow(Refused);
  });
  it("'I sent it' is only for a by-hand approval", async () => {
    const { db, cfg } = freshDb();
    const a = addLead(db, { status: "new" });
    approveOnly(db, cfg, a);
    expect(() => markSentByHand(db, a)).toThrow(/by-hand route/);
    const b = addLead(db);
    await approveAndSend(db, cfg, MAIL, countingSender(), b);
    expect(() => markSentByHand(db, b)).toThrow(/by-hand route/);
  });
});

describe("the postal address and real values are required before any email is approved", () => {
  it.each([
    ["", /postalAddress/], ["   ", /postalAddress/], ["<your postal address>", /placeholder/],
    ["123", /postalAddress/], ["Somewhere in town, no number", /postalAddress/], ["1 Example Street, 00000", /postalAddress/],
  ])("postal address %j is refused, by hand and for SES", async (postalAddress, why) => {
    const { db, cfg, dir } = freshDb();
    const id = addLead(db);
    const sender = countingSender();
    await expect(approveAndSend(db, cfg, { ...MAIL, postalAddress }, sender, id)).rejects.toThrow(why);
    await expect(approveAndSend(db, cfg, { ...HAND, postalAddress }, byHandSender(path.join(dir, "o")), id)).rejects.toThrow(why);
    expect(sender.calls).toBe(0);
    expect(getLead(db, id)?.status).toBe("drafted");
  });
  it("a placeholder in any email field is refused", () => {
    expect(() => checkFooterReady({ ...HAND, senderName: "<your name>" })).toThrow(/senderName.*placeholder/);
    expect(() => checkFooterReady({ ...HAND, businessName: "<your company's name>" })).toThrow(/businessName/);
    expect(() => checkFooterReady({ ...HAND, replyTo: "<optional: where replies go>" })).toThrow(/replyTo/);
    expect(() => checkMailConfig({ ...MAIL, fromAddress: "<you@your-sending-domain.com>" })).toThrow(/fromAddress/);
    expect(() => checkMailConfig({ ...MAIL, awsProfile: "<SES only: e.g. lead-scout>" })).toThrow(/awsProfile/);
    // By hand ignores the SES-only fields, even unfilled.
    expect(checkFooterReady({ ...HAND, fromAddress: "<SES only>", awsRegion: "<SES only>" }).senderName).toBe("Sam Carter");
  });
  it("an unfilled SES field is never printed in an email", () => {
    const e = buildEmail({ ...HAND, replyTo: undefined, fromAddress: "<SES only: you@x.com>" }, "a@b.example.com", "Hi", "Body");
    expect(e.text).not.toContain("<");
    expect(e.from).toBe("Sam Carter (your own mailbox)");
  });
});

describe("Amazon SES: optional, and only after confirming AWS's requirement", () => {
  it("needs sesAwsRequirementConfirmed, which quotes AWS's own words", async () => {
    expect(SES_REQUIREMENT).toBe("only send email to individuals who've explicitly requested it");
    expect(() => checkMailConfig({ ...MAIL, sesAwsRequirementConfirmed: undefined })).toThrow(/explicitly requested it/);
    expect(chooseSender({ ...MAIL, sesAwsRequirementConfirmed: false }).sender.mode).toBe("by_hand");
    expect(chooseSender({ ...MAIL, sesAwsRequirementConfirmed: false }).note).toMatch(/SES is not switched on/);
    expect(chooseSender(MAIL).sender.mode).toBe("ses");
    const { db, cfg } = freshDb();
    const id = addLead(db);
    const sender = countingSender();
    await expect(approveAndSend(db, cfg, { ...MAIL, sesAwsRequirementConfirmed: false }, sender, id)).rejects.toThrow(/explicitly requested/);
    expect(sender.calls).toBe(0);
  });
  it("checkMailConfig names each missing piece", () => {
    expect(() => checkMailConfig(null)).toThrow(MailNotReady);
    expect(() => checkMailConfig({ ...MAIL, fromAddress: "nope" })).toThrow(/fromAddress/);
    expect(() => checkMailConfig({ ...MAIL, fromAddress: undefined })).toThrow(/fromAddress/);
    expect(() => checkMailConfig({ ...MAIL, senderName: "" })).toThrow(/senderName/);
    expect(() => checkMailConfig({ ...MAIL, businessName: "" })).toThrow(/businessName/);
    expect(() => checkMailConfig({ ...MAIL, awsRegion: "" })).toThrow(/awsRegion/);
    expect(checkMailConfig(MAIL).fromAddress).toBe(MAIL.fromAddress);
  });
  it("practice and by-hand senders never call SES", () => {
    expect(practiceSender().mode).toBe("practice");
    expect(byHandSender().mode).toBe("by_hand");
  });
});

describe("editing a draft on the page", () => {
  it("is refused when the stored draft changed since the page was drawn", () => {
    const { db } = freshDb();
    const id = addLead(db);
    const l = getLead(db, id)!;
    expect(() => editDraft(db, id, "New subject", "A new body for this draft, long enough.", draftVersion("old", "old")))
      .toThrow(/changed since/);
    editDraft(db, id, "New subject", "A new body for this draft, long enough.", draftVersion(l.draft_subject, l.draft_body));
    expect(getLead(db, id)?.draft_subject).toBe("New subject");
  });
});

describe("Germany: no cold email by default (guide/channels/cold-email.md)", () => {
  it("a lead marked DE, or with a .de address, is refused at the send gate", async () => {
    const { db, cfg } = freshDb();
    const de = addLead(db, { country: "DE" });
    const dotDe = addLead(db, { country: null, contact_email: "info@klinik.example.de" });
    const sender = countingSender();
    await expect(approveAndSend(db, cfg, MAIL, sender, de)).rejects.toThrow(/No cold email to leads in DE/);
    await expect(approveAndSend(db, cfg, MAIL, sender, dotDe)).rejects.toThrow(/No cold email to leads in DE \(by its country, email or website/);
    expect(sender.calls).toBe(0);
  });
  it("other countries are fine, and the rule can be changed in config", async () => {
    expect(countryRefusal(DEFAULT_LEAD_CONFIG, { country: "US", contact_email: "a@b.example.com" })).toBeNull();
    expect(countryRefusal(DEFAULT_LEAD_CONFIG, { country: "de" })).not.toBeNull();
    expect(countryRefusal({ noColdEmailCountries: [], consentRequiredCountries: [] }, { country: "DE", contact_email: "a@b.de" })).toBeNull();
    expect(countryRefusal({ noColdEmailCountries: ["FR"], consentRequiredCountries: [] }, { contact_email: "a@b.fr" })).toMatch(/FR/);
    expect(countryRefusal(DEFAULT_LEAD_CONFIG, { country: "US", website: "https://klinik.example.de" })).toMatch(/DE/);
    const { db, cfg } = freshDb();
    const id = addLead(db, { country: "DE" });
    expect((await approveAndSend(db, { ...cfg, noColdEmailCountries: [] }, MAIL, countingSender(), id)).status).toBe("sent");
  });
  it("a lead whose website is .de is refused at the send gate", async () => {
    const { db, cfg } = freshDb();
    const id = addLead(db, { country: null, website: "https://www.klinik.example.de" });
    await expect(approveAndSend(db, cfg, MAIL, countingSender(), id)).rejects.toThrow(/DE/);
  });
});

describe("Canada: email needs a recorded consent basis (CASL)", () => {
  it.each([
    [{ country: "CA" }], [{ country: null, contact_email: "ops@clinic.example.ca" }],
    [{ country: null, website: "https://clinic.example.ca" }],
  ])("%j without consent_basis is refused at the send gate", async (over) => {
    const { db, cfg } = freshDb();
    const id = addLead(db, over);
    const sender = countingSender();
    await expect(approveAndSend(db, cfg, MAIL, sender, id)).rejects.toThrow(/consent basis/);
    expect(sender.calls).toBe(0);
  });
  it("with a consent basis it may go; the list is configurable", async () => {
    const { db, cfg } = freshDb();
    const id = addLead(db, { country: "CA", consent_basis: "published ops@ for business inquiries on their contact page" });
    expect((await approveAndSend(db, cfg, MAIL, countingSender(), id)).status).toBe("sent");
    expect(countryRefusal({ ...DEFAULT_LEAD_CONFIG, consentRequiredCountries: [] }, { country: "CA" })).toBeNull();
  });
});

describe("decisions and rewards", () => {
  it("a reply pays its reward once, only after approval", () => {
    const { db, cfg } = freshDb();
    const id = addLead(db, { contact_email: null, channel: "linkedin", status: "new", score_reach: 0 });
    expect(() => markReplied(db, cfg, id)).toThrow(Refused);
    approveOnly(db, cfg, id);
    markReplied(db, cfg, id);
    expect(() => markReplied(db, cfg, id)).toThrow(Refused);
    expect(balanceCents(db)).toBe(cfg.budget.approvedRewardCents + cfg.budget.repliedRewardCents);
  });
  it("a 'no' closes the lead and puts the address on the do-not-contact list, in the database and the file", async () => {
    const { db, cfg, dir } = freshDb();
    const id = addLead(db);
    await approveAndSend(db, cfg, MAIL, countingSender(), id);
    markNotInterested(db, id);
    expect(getLead(db, id)?.status).toBe("not_interested");
    expect(isNoContact(db, "ops@brightwell.example.com")).toBe(true);
    expect(fs.readFileSync(path.join(dir, "do-not-contact.md"), "utf-8")).toMatch(/^- ops@brightwell\.example\.com \(lead #\d+ said not interested/m);
  });
  it("a rejection pays nothing and keeps the user's reason", () => {
    const { db } = freshDb();
    const id = addLead(db);
    reject(db, id, "a competitor's reseller");
    expect(balanceCents(db)).toBe(0);
    expect(getLead(db, id)?.decided_note).toBe("a competitor's reseller");
  });
  it("a phone number on the list blocks that number, in any format", () => {
    const { db, dir } = freshDb();
    addNoContact(db, "+1 (512) 555-0142", "said no on the phone");
    expect(isNoContactPhone(db, "512.555.0142")).toBe(true);
    expect(isNoContactPhone(db, "512 555 0199")).toBe(false);
    expect(fs.readFileSync(path.join(dir, "do-not-contact.md"), "utf-8")).toContain("- 15125550142");
  });
  it("never-contact closes a waiting lead at that domain", () => {
    const { db } = freshDb();
    const id = addLead(db, { contact_email: "a@shop.example.com" });
    addNoContact(db, "shop.example.com", "asked");
    expect(getLead(db, id)?.status).toBe("do_not_contact");
  });
  it("the daily allowance is paid once a day and the balance has a ceiling", () => {
    const { db, cfg } = freshDb();
    creditDailyAllowance(db, cfg, "2026-10-10");
    creditDailyAllowance(db, cfg, "2026-10-10");
    expect(balanceCents(db)).toBe(cfg.budget.dailyBaseCents);
    for (let i = 0; i < 100; i++) creditDailyAllowance(db, cfg, `2027-01-${String(i).padStart(3, "0")}`);
    expect(balanceCents(db)).toBe(cfg.budget.maxBalanceCents);
  });
  it("model costs come from the token counts, and an unpriced or free model refuses", () => {
    expect(modelCallCents({ inputCentsPerMTok: 10, outputCentsPerMTok: 50 }, 1_000_000, 100_000)).toBeCloseTo(15);
    expect(() => modelCallCents(undefined, 1, 1)).toThrow(/No price/);
    expect(() => modelCallCents({ inputCentsPerMTok: 10 } as never, 1000, 1000)).toThrow(/price/);
    expect(() => modelCallCents({ inputCentsPerMTok: 10, outputCentsPerMTok: Number.NaN }, 1, 1)).toThrow(/price/);
    expect(() => modelCallCents({ inputCentsPerMTok: 0, outputCentsPerMTok: 0 }, 1, 1)).toThrow(/price/);
  });
  it("Haiku's long-prompt price applies over 100K input tokens", () => {
    const haiku = DEFAULT_LEAD_CONFIG.prices["claude-haiku-5-5"];
    expect(modelCallCents(haiku, 100_000, 0)).toBeCloseTo(1);
    expect(modelCallCents(haiku, 100_001, 0)).toBeCloseTo(5.00005);
  });
  it("a cost that is not a number cannot be recorded, and no charge is recorded twice", () => {
    const { db } = freshDb();
    expect(() => charge(db, "r1", Number.NaN, "x")).toThrow();
    expect(() => charge(db, "r1b", Number.POSITIVE_INFINITY, "x")).toThrow(/Refusing/);
    charge(db, "r2", 1, "x");
    expect(() => charge(db, "r2", 1, "x")).toThrow(/already recorded/);
  });
});

describe("the email itself", () => {
  it("always carries the postal address, the business line and the way to say no", () => {
    const e = buildEmail(MAIL, "Ops@Brightwell.example.com", "Hi\nthere", "Body text here.");
    expect(e.to).toBe("ops@brightwell.example.com");
    expect(e.subject).toBe("Hi there");
    expect(e.from).toBe("Sam Carter <sam@get-acme.example.com>");
    expect(e.text).toContain(MAIL.postalAddress);
    expect(e.text).toContain("This is a business email from Acme Scheduling.");
    expect(e.text).toContain("Sam Carter, Acme Scheduling");
    expect(e.text).toMatch(/no thanks/);
  });
});
