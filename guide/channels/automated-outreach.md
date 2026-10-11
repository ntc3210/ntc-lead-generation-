# Channel: automated outreach (email sequences and multi-step cadences)

> **For the assistant:** a sequence is a planned series of touches (email,
> call, follow-up email) spread over days. "Automated" here means a tool
> **reminds** the user and **sends on schedule what the user has already
> approved**. It never means the assistant sends anything on its own.
> Every message, for every recipient, is approved by the user before it
> can go out. Read `cold-email.md` and `cold-calling.md` first; their
> rules all apply here.
>
> *Practical guidance, not legal advice. Sources checked 11 October 2026.*

---

## What it is and when it works best

A **sequence** (also called a cadence) is a plan like: day 1 email,
day 3 phone call, day 7 short follow-up email, then stop. A sequence tool
(software such as HubSpot, Outreach, Salesloft, Apollo or Lemlist; these
are examples, not recommendations) keeps track of who is on which step
and stops when someone replies.

**Works best when:**
- The user already has a working cold email (replies are coming) and
  wants to follow up reliably without forgetting anyone.
- There are 20 or more good-fit leads a week, each with evidence.
- The user can spend 15–30 minutes a day approving drafts and making the
  calls the sequence schedules.

**Skip it when:**
- Cold email isn't working yet. Automating a message nobody answers just
  annoys people faster. Fix the message first.
- The leads are mostly in Germany, Canada, or are UK sole traders (see
  `cold-email.md` for why).
- The user wants "set and forget" volume. That isn't what this toolkit
  does.

*For example:* a company like Deepgram might run a three-step sequence
to heads of engineering at companies that just posted a job for a
"speech recognition engineer": a short email, a follow-up sharing one
relevant benchmark, then a polite close.

## What to ask the user first

1. "Do you already use a sales tool or CRM (customer relationship
   management system, the software that keeps your contacts and deals)?
   Which one?" (Use what they have before buying anything new.)
2. "Do you have a separate sending domain set up with SPF, DKIM and
   DMARC?" (If not, do steps 1–4 of `cold-email.md` first.)
3. "How many new people per day can you approve? Be honest; that's the
   cap."
4. "Which steps do you want in the sequence: emails only, or emails plus
   phone calls you make yourself?"
5. "How many touches before we stop? I recommend three, four at most."
6. "Which countries are the recipients in?"

## How to find leads here

Sequences don't find leads; they follow up. Feed them only leads that
came from another channel with evidence (`websites.md`,
`job-posts.md`, `news-and-funding.md`, `events.md`). Before a lead joins
a sequence, check:

- It has an evidence URL and quote in `my-company/leads.md`.
- Its address is found, not guessed (or the guess has been verified).
- It isn't on `my-company/do-not-contact.md`.
- Its country's rules allow this kind of message (`cold-email.md`).
- For call steps: the number has passed a DNC check (`cold-calling.md`).

**Strong fit for a sequence:** a lead with a fresh signal and a named
person in the buying role. **Weak:** a generic company list with no
reason to write now. Weak leads don't go into sequences.

## How to reach them (three-step template)

**Step 1, day 1 (email):** use the `cold-email.md` template, personalised
with the evidence.

**Step 2, day 3 or 4 (email or call):**
> Hi <first name>, a quick follow-up on my note about <their situation>.
> One thing that might help either way: <a genuinely useful fact, guide
> or example relevant to them>. Worth a short call?
> <signature, postal address, opt-out line>

**Step 3, day 8 to 10 (close the loop):**
> Hi <first name>, I don't want to clutter your inbox, so this is my last
> note. If <problem> becomes a priority, I'm at <contact>. All the best.
> <signature, postal address, opt-out line>

Then stop. No "just bumping this", no fake "Re:", no guilt.

## Step by step for the user

**Approval-first set-up (the rule for this toolkit):**
1. The assistant writes every step for every lead, personalised, into
   `my-company/leads.md` (or a draft file it names).
2. You read each one. Reply "approved" for the ones to send, or ask for
   changes. The assistant asks Jimmy to check them.
3. Only approved messages go into the tool. The assistant can format
   them for you to paste or import; **you** add them.
4. In the tool, choose the step type that waits for you to press send
   (often called a **manual email** or **task**) whenever you're unsure.
   Use automatic sending only for messages you've already approved,
   word for word.
5. Turn on "stop the sequence when the contact replies" (the setting is
   usually under the sequence's **Settings**; names differ by tool).

**In HubSpot, as an example** (menu names can change; check HubSpot's
help if they differ): 1. Click **Automation** → **Sequences**. 2. Click
**Create sequence** → **Start from scratch**. 3. Click **+** to add a
step; pick **Manual email task** if you want to press send yourself, or
**Automated email** for an approved message. 4. Add **Call task** steps
for calls you'll make. 5. Open the sequence's **Settings** and check that
unenrolment on reply is on. 6. Click **Save**.

**Daily cap:** keep total new contacts at about 20–30 a day per mailbox,
and lower in the first month.

**Unsubscribes and "no":** the same day, add them to
`my-company/do-not-contact.md` **and** remove them from every sequence
in the tool.

## The rules (legal and platform)

All the rules in `cold-email.md` apply to every email step, and all the
rules in `cold-calling.md` apply to every call step. In short:

- **US, CAN-SPAM:** no B2B exemption; honest headers and subject; postal
  address; working opt-out; opt-outs honoured within 10 business days.
  https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- **UK, PECR plus UK GDPR:** corporate subscribers may be emailed without
  prior consent; sole traders need consent; named people's data is
  covered by UK GDPR.
  https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/
- **EU:** varies by country (ePrivacy Directive Article 13(5)); **Germany
  requires prior express consent for email advertising** (UWG section
  7(2) no. 2): https://www.gesetze-im-internet.de/englisch_uwg/englisch_uwg.html
- **Canada, CASL:** consent required; unsubscribe within 10 business days.
  https://ised-isde.canada.ca/site/canada-anti-spam-legislation/en/getting-consent-send-email
- **Inbox providers:** keep spam complaints below 0.3% (Google recommends
  below 0.1%); bulk senders need one-click unsubscribe.
  https://support.google.com/a/answer/81126 and
  https://senders.yahooinc.com/best-practices/
- **Call steps:** no AI-voice or prerecorded calls without prior express
  written consent (FCC, Feb 2024: AI voices are "artificial" under the
  TCPA). https://docs.fcc.gov/public/attachments/DOC-400393A1.txt
- **LinkedIn steps:** many tools offer "LinkedIn automation". **Never
  use it.** LinkedIn's User Agreement section 8.2 bans bots that "add or
  download contacts, send or redirect messages".
  https://www.linkedin.com/legal/user-agreement . Any LinkedIn step must
  be a reminder for the user to act by hand (`linkedin.md`).

## What the assistant must never do on this channel

- Never send, schedule, enrol or activate anything without the user's
  approval of that exact message and that exact recipient list.
- Never put an unapproved message into a sequence, and never change an
  approved message after approval without a new approval.
- Never set up LinkedIn automation, auto-connect, auto-message or
  auto-visit features.
- Never add AI-voice or ringless-voicemail steps for people who haven't
  consented.
- Never plan more than four touches, or keep following up after a "no".
- Never import a bought list into a sequence.

## How to measure it

| Measure | Healthy | Stop and fix |
|---|---|---|
| Reply rate across the whole sequence | 8–15% | under 3% |
| Share of replies that come from step 2 or 3 | about a third | almost none: drop those steps |
| Bounce rate | under 3% | over 5% |
| Spam complaints | near zero | approaching 0.1% |
| People contacted after saying no | 0 | any: pause everything and fix |

Each week, write in `my-company/lessons.md` which step got the replies
and which first lines worked.
