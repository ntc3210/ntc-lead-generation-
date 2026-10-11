# Channel: cold calling (a human dials)

> **For the assistant:** this is a fixed product rule, decided by the
> owner. **Humans dial. You never place a call.** You may build call
> lists, check numbers against Do-Not-Call registers, and write call
> scripts and objection answers. You must never help set up AI-voice or
> prerecorded calls to anyone who hasn't given prior express consent.
>
> *Practical guidance, not legal advice. Sources checked 11 October 2026.*

---

## What it is and when it works best

The user phones a business, usually the main line or a published direct
line, to start a conversation. A good cold call is short, polite, and
asks permission to continue.

**Works best when:**
- The buyer is reachable by phone at work: operations leaders,
  owners of small and mid-sized businesses, practice managers, facility
  or procurement heads.
- The deal is big enough to justify a conversation, and the problem is
  easy to explain in one sentence.
- The user is comfortable on the phone (ask; some people hate it, and
  that shows).

**Skip it when:**
- The buyer is a developer or engineer who never answers unknown numbers
  (often true for technical products; for example, a voice-AI API such
  as Deepgram usually reaches developers better through `inbound.md` or
  `communities.md`, though it might phone a contact-centre operator).
- The only numbers you can find are personal mobiles. Don't use them.
- The country requires consent for calls to businesses that you don't
  have (check "The rules").

## What to ask the user first

1. "Which countries will you call? I'll check the right Do-Not-Call
   register for each."
2. "Who answers the phone at a typical customer: a receptionist, the
   owner, a call queue? Who do you need to reach?"
3. "What's the one-sentence problem you solve, said the way a customer
   would say it?"
4. "What are the three objections you hear most?" (The assistant writes
   answers to these.)
5. "How many calls can you make in a session, and what times of day suit
   your buyers?"
6. "Has your company registered to access the US National Do Not Call
   Registry, or does it use a UK TPS/CTPS screening service?"

## How to find leads here

Find the company and evidence first (`websites.md`, `job-posts.md`,
`news-and-funding.md`), then a **business** number:
- The company's Contact page or footer: main switchboard or sales line.
- A press release naming a media or sales contact number.
- `site:<company domain> "call us" OR "tel" OR "phone"`

**Strong:** a direct line the company publishes for the department you
want; a fresh buying signal you can mention in the first ten seconds.
**Weak:** a switchboard with no name to ask for; no reason to call now.

Build the call list in `my-company/leads.md` with: company, number,
where the number was found (URL), who to ask for, the reason to call
(the evidence quote), the DNC check result and date, and the outcome.

## How to reach them (call script)

> "Hi, it's <your name> from <company>. This is a sales call. Have you
> got thirty seconds, and I'll tell you why I rang? ... I saw
> <evidence, e.g. that you're opening a second site>. We help <type of
> business> <solve the problem>. Is that something on your plate this
> year, or is the timing wrong?"

Always: say your name and company first; say honestly that it's a sales
call; ask permission; if they say "don't call again", agree, thank them,
and add the number to `my-company/do-not-contact.md` that day.

**Objection answers** the assistant writes for the user (examples):
- "Send me an email." → "Happy to. What's the one thing it should cover
  so it's worth your time?" (Then the email still follows
  `cold-email.md`.)
- "We already use <competitor>." → "That makes sense. Is there anything
  about it you'd change?" Never criticise the competitor.
- "Not interested." → "Understood, thank you. Shall I take your number
  off my list?" (Then do it.)

## Step by step for the user

**US: get access to the National Do Not Call Registry**
1. Go to https://telemarketing.donotcall.gov
2. Click **create an account** (new users) or **log in**.
3. Follow the steps to register your company and choose the area codes
   you'll call. The first five area codes are free; each extra one costs
   $85 for fiscal year 2027, which runs from 1 Oct 2026 (FTC figure; see "The rules").
4. Download the numbers for your area codes, and give the file to the
   assistant. It will mark any match on your list as **Do not call**.
5. Repeat at least every 31 days.

**UK: screen against TPS and CTPS**
1. Go to https://www.tpsonline.org.uk and find the section for
   businesses that make marketing calls, or use a licensed screening
   service (paid). TPS covers individuals and sole traders; CTPS covers
   companies. Screen against **both**.
2. Export your call list as a spreadsheet with one number per row.
3. Upload it to the screening service; download the result.
4. Give the result to the assistant; it removes matches from the list.
5. Screen again shortly before each calling session (registrations take
   effect up to 28 days after someone signs up).

**Every country:** keep `my-company/do-not-contact.md` up to date during
the session, not afterwards.

## The rules (legal and platform)

**AI and prerecorded voices (US).** On 8 February 2024 the FCC announced
a Declaratory Ruling (FCC 24-17) that calls made with AI-generated voices
are "artificial" under the Telephone Consumer Protection Act (TCPA, the
US law on phone marketing), so the existing consent rules apply. The FCC
news release: https://docs.fcc.gov/public/attachments/DOC-400393A1.txt ;
the ruling: https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf
(the ruling's PDF would not render for me; the release was read).
- Telemarketing calls with an artificial or prerecorded voice to mobiles
  or homes need **prior express written consent** (47 CFR 64.1200(a)(2)
  and (a)(3)).
- Such a message must identify the business at the start, give a call-back
  number, and for telemarketing offer an automated opt-out "within two
  (2) seconds" of the identification (47 CFR 64.1200(b)).
  https://www.law.cornell.edu/cfr/text/47/64.1200
- **What is allowed:** AI-voice or prerecorded sales calls only to people
  who gave **prior express written consent** (a signed agreement, often an
  e-signature, that specifically covers AI or prerecorded calls from this
  business), with the disclosure and opt-out above. A plain "call me"
  form usually does **not** qualify. Ask a lawyer before running any
  AI-voice calls.
  **What is never allowed here:** AI or prerecorded calls to anyone
  without that consent.

**US Do-Not-Call.** Under the FTC's Telemarketing Sales Rule, most
business-to-business calls are exempt, but calls to employees to sell
them things for personal use are not. Sellers must sync with the
registry "every 31 days" and keep their own do-not-call list. Fees: first
five area codes free, $85 per extra area code (fiscal year 2027, from 1 Oct 2026;
it was $82 in FY2026). Fees change every year, so check the site.
https://www.ftc.gov/business-guidance/resources/complying-telemarketing-sales-rule
The FCC's rule adds: honour a do-not-call request within 10 business
days and for **5 years** (47 CFR 64.1200(d), link above). **Product rule:
screen every US number anyway**, because many "business" numbers are
mobiles registered by individuals.
**Unverified:** state laws (several states have their own call rules and
calling-hour limits). Ask a lawyer before calling at volume into a state.

**UK.** Live B2B calls follow the same rules as calls to individuals:
you may call a number not on TPS or CTPS unless that business objected
before. Screen against both, plus your own list; say who is calling;
show your number. Automated calls need consent specifically for automated
calls. https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/telephone-marketing/
The "up to 28 days" registration delay comes from Ofcom
(https://www.ofcom.org.uk/__data/assets/pdf_file/0016/19240/nuisance-summary.pdf,
via search excerpt).

**Germany.** Calls to businesses need at least "presumed consent": a
concrete reason to think this business wants this call (UWG section
7(2) no. 1). Calls to consumers need prior express consent.
https://www.gesetze-im-internet.de/englisch_uwg/englisch_uwg.html

## What the assistant must never do on this channel

- **Never place, dial, schedule or connect a call.** Not through any
  tool, app or service.
- Never set up, script or configure AI-voice, voice-cloning or
  prerecorded calls to anyone without prior express consent.
- Never put a number on a call list without a DNC check result and date
  (US, UK) or a note of why no register applies.
- Never collect personal mobile or home numbers.
- Never write a script that hides that it's a sales call or pretends to
  know the person.

## How to measure it

| Measure | Healthy (rough guide) |
|---|---|
| Connect rate (a person answers) | 10–20% of dials |
| Conversations that reach the reason for calling | half of connects |
| Meetings booked | 1 per 30–60 dials for a well-targeted list |
| DNC checks done before calling | 100% |
| "Don't call" requests logged the same day | 100% |

Log each session's numbers and the objection that came up most in
`my-company/lessons.md`. If meetings are rare after 100 dials, change the
list (wrong buyers) before changing the script.
