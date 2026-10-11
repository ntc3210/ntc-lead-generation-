/**
 * DRAFTS: written only when the do-not-contact list exists, never for
 * Germany by default, never with invented familiarity, and never with a
 * number or link that is not in the company profile or the lead's evidence.
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  DRAFT_SYSTEM, draftEvidenceProblem, draftProblem, draftRequest, parseDraft, storeDraft,
} from "../../leads/drafting.js";
import { getLead } from "../../leads/db.js";
import { addLead, freshDb, PROFILE } from "./helpers.js";

const BODY = "Hi Dana, I saw your post for a scheduling coordinator across your sites. We make shift-scheduling software for clinics. Would a short call be useful? If not, just say so.";

describe("storeDraft", () => {
  it("stores a clean draft and moves the lead to 'drafted'", () => {
    const { db, cfg } = freshDb();
    const id = addLead(db, { status: "new", draft_subject: null, draft_body: null });
    expect(storeDraft(db, cfg, id, "Your scheduling coordinator role", BODY)).toMatch(/Draft saved/);
    expect(getLead(db, id)?.status).toBe("drafted");
  });
  it("no draft until my-company/do-not-contact.md exists (CLAUDE.md section 7)", () => {
    const { db, cfg, dir } = freshDb({ dnc: false });
    const id = addLead(db, { status: "new", draft_subject: null, draft_body: null });
    expect(storeDraft(db, cfg, id, "Your scheduling coordinator role", BODY)).toMatch(/do-not-contact\.md first/);
    fs.writeFileSync(path.join(dir, "do-not-contact.md"), "");
    expect(storeDraft(db, cfg, id, "Your scheduling coordinator role", BODY)).toMatch(/Draft saved/);
  });
  it("Germany is refused at the drafting step too", () => {
    const { db, cfg } = freshDb();
    const a = addLead(db, { status: "new", country: "DE" });
    const b = addLead(db, { status: "new", country: null, contact_email: "info@praxis.example.de" });
    expect(storeDraft(db, cfg, a, "Your scheduling coordinator role", BODY)).toMatch(/No cold email to leads in DE/);
    expect(storeDraft(db, cfg, b, "Your scheduling coordinator role", BODY)).toMatch(/No cold email to leads in DE/);
    const c = addLead(db, { status: "new", country: null, website: "https://praxis.example.de" });
    expect(storeDraft(db, cfg, c, "Your scheduling coordinator role", BODY)).toMatch(/No cold email to leads in DE/);
    const ca = addLead(db, { status: "new", country: "CA", company: "Maple Clinics" });
    expect(storeDraft(db, cfg, ca, "Your scheduling coordinator role", BODY)).toMatch(/consent basis/);
  });
  it("an address on do-not-contact.md gets no draft", () => {
    const { db, cfg, dir } = freshDb();
    fs.writeFileSync(path.join(dir, "do-not-contact.md"), "# Do not contact\n- ops@brightwell.example.com (said no, 3 Oct)\n");
    const id = addLead(db, { status: "new" });
    expect(storeDraft(db, cfg, id, "Your scheduling coordinator role", BODY)).toMatch(/do-not-contact list/);
  });
  it("a number from the profile is fine; an invented one is refused", () => {
    const { db, cfg } = freshDb();
    const id = addLead(db, { status: "new" });
    const ok = `${BODY} One clinic group cut scheduling time by 40% with us.`;
    const bad = `${BODY} Clinics save 60% of admin time with us.`;
    expect(storeDraft(db, cfg, id, "Your scheduling coordinator role", bad)).toMatch(/60%.*not in the company profile/);
    expect(storeDraft(db, cfg, id, "Your scheduling coordinator role", ok)).toMatch(/Draft saved/);
  });
  it("not for a non-email lead", () => {
    const { db, cfg } = freshDb();
    const id = addLead(db, { status: "new", channel: "linkedin", contact_email: null });
    expect(storeDraft(db, cfg, id, "Hello there", BODY)).toMatch(/not an email lead/);
  });
});

describe("the evidence rules", () => {
  const allowed = `${PROFILE}\nWe are hiring a scheduling coordinator to manage rotas across 6 sites`;
  it.each([
    ["Great to meet you at the expo last week.", /familiarity/],
    ["As discussed, here is the info.", /familiarity/],
    ["Following up on our call.", /familiarity/],
    ["We guarantee results.", /guarantee/],
    ["We serve 2,000 clinics.", /2,000/],
    ["It costs $49 a month.", /\$49/],
    ["Teams get 3x faster.", /3x/],
    ["See https://bit.ly/abc for more.", /bit\.ly/],
  ])("refused: %s", (line, why) => {
    expect(draftEvidenceProblem("Your rota", `Hi Dana. ${line} Worth a chat?`, allowed)).toMatch(why);
  });
  it.each([
    "Would a 15-minute call help?",
    "One group cut scheduling time by 40% with us.",
    "Our site is acme-scheduling.example.com if useful.",
    "I saw you are managing rotas across 6 sites.",
  ])("allowed: %s", (line) => {
    expect(draftEvidenceProblem("Your rota", `Hi Dana. ${line} Worth a chat?`, allowed)).toBeNull();
  });
  it("no link in the subject, and no fake reply or forward", () => {
    expect(draftEvidenceProblem("See acme-scheduling.example.com", "Hi", allowed)).toMatch(/subject/);
    expect(draftProblem("Re: your order", "x")).toMatch(/reply/);
    expect(draftProblem("FWD: idea", "x")).toMatch(/reply/);
    expect(draftProblem("Your rota", "Hi Dana")).toBeNull();
  });
});

it("the writer is told the signal, its page and each note's basis; the rules forbid invention", () => {
  const { db } = freshDb();
  const req = draftRequest(getLead(db, addLead(db))!);
  expect(req).toContain("Signal (hiring, dated 2026-10-01)");
  expect(req).toContain("Six clinic sites (measured)");
  expect(DRAFT_SYSTEM).toMatch(/Never invent familiarity/);
  expect(DRAFT_SYSTEM).toMatch(/Never invent a number/);
  expect(DRAFT_SYSTEM).toMatch(/proof point, and only one written in the profile/);
  expect(parseDraft('Sure! {"subject":"A","body":"B"}')).toEqual({ subject: "A", body: "B" });
  expect(parseDraft("no json")).toBeNull();
});
