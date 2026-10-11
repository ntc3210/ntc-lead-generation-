# Channel: cold email (one-to-one, written and approved by a person)

> **For the assistant:** you draft; the user approves **each** message;
> only then is it sent. Nothing is ever sent without the user's yes. Ask
> Jimmy (`.claude/agents/jimmy.md`) to check every draft before you show
> it. Multi-step sequences are in `automated-outreach.md`.
>
> **How it is sent: from the user's own work mailbox, by hand.** That is
> the recommended route. With the engine set up, approving writes the
> final email (postal address and opt-out line included) to
> `my-company/outbox/`; the user pastes it into Gmail or Outlook, sends
> it, and clicks **I sent it** on the approval page. Sending through
> Amazon SES is optional and advanced: AWS's production-access form asks
> senders to confirm they "only send email to individuals who've
> explicitly requested it", which cold email may not meet
> (`../engine-setup.md`, Part 5).
>
> *Practical guidance, not legal advice. Sources checked 11 October 2026.
> For a large campaign, or any doubt about a country, the user should ask
> a lawyer.*

---

## What it is and when it works best

A cold email is a short, personal email to someone at a company who
hasn't heard from you before. It works when it is clearly relevant to
their job, short, honest, and easy to say no to.

**Works best when:**
- The buyer is a business, and the user can name a specific problem.
- There is a fresh reason to write (a buying signal: see
  `../lead-signals.md`).
- The user can send a small number of careful emails, not thousands.

**Skip it or be very careful when:**
- The recipients are in **Germany** (strict: see the rules), **Canada**
  (consent-based), or are sole traders in the UK.
- The user wants to buy a big list and blast it. That damages their
  email domain and often breaks the law.
- The buyer lives in a community and hates email (developers often do;
  try `communities.md` or `inbound.md`).

*For example:* a voice-AI API company like Deepgram might email the head
of product at a call-analytics startup that just announced a
transcription feature.

## What to ask the user first

1. "Which countries are your recipients in?" (This decides which law
   applies. Ask for each lead, not once.)
2. "Do you have a **separate domain** for sending sales email (for
   example `try<company>.com`), or only your main one?"
3. "What postal address can we put at the bottom of every email?" (US law
   needs one.)
4. "How many emails a day can you personally review and approve?"
   (That is the real cap.)
5. "Who replies when someone answers, and how fast?"
6. "Is there anyone who has already said no to you? They go on the
   do-not-contact list now."

## How to find leads here

Email is a way to reach people, not to find them. Find the company and
the evidence through `websites.md`, `news-and-funding.md`, `job-posts.md`
or `events.md`, then find a **business** address:

- The company's Contact page, or a press release that lists a media or
  sales contact.
- `site:<company domain> "@<company domain>"` (addresses published on
  their own site).
- `"<person's name>" "<company>" "email"` in a press release or
  conference speaker page.

**Strong:** an address the person or company published themselves, for
the role you're writing about (e.g. `partnerships@` for a partnership
pitch).
**Weak:** an address from a bought list, an old document, or a pattern
guess.

**Guessed addresses.** If no address is published, the assistant may
suggest a likely pattern (like `jane.doe@company.com`) **only** if it
says, every time: "This is a guess, not a found address. Check it before
sending: look for the pattern on their site or press releases, or call
the switchboard and ask." Mark it `guessed` in `my-company/leads.md`.

## How to reach them

Keep it under about 120 words. One idea. One easy question.

> **Subject:** <their specific situation, in plain words>
>
> Hi <first name>,
>
> I saw <the evidence, e.g. "your post on <date> that you're hiring three
> support leads">. We help <type of company> <do the specific thing>,
> for example <one honest proof point: a customer type or a number you
> can back up>.
>
> Would it be worth a 15-minute call about <their goal>? If not, no
> problem; just say so and I won't follow up.
>
> <Your name>, <title>, <company>
> <Postal address>
> Don't want emails like this? Reply "no thanks" or <unsubscribe link>.

Rules for the draft: the subject must match the content; no "Re:" or
"Fwd:" on a first email; no fake familiarity ("as we discussed"); no
invented proof points; one follow-up at most per sequence step, and stop
when they say no.

## Step by step for the user

Most users send from the mailbox they already have and can skip steps 1
to 3 for a handful of emails a day. They matter if you plan more volume,
or the optional SES route.

**1. Get a separate sending domain** (so a mistake can't hurt your main
company email). In your domain provider (for example GoDaddy, Namecheap,
Squarespace or Cloudflare; menu names differ slightly between them):
1. Log in, click **Domains**, then **Search** or **Buy a domain**.
2. Buy a close variant of your name, like `get<company>.com`.
3. Set it to forward visitors to your main website (look for
   **Forwarding** or **Redirect** in the domain's settings).

**2. Create the mailbox.** In Google Workspace: **Admin console** →
**Account** → **Domains** → **Manage domains** → **Add a domain**; then
**Directory** → **Users** → **Add new user**. In Microsoft 365: **Admin
center** → **Settings** → **Domains** → **Add domain**.

**3. Turn on SPF, DKIM and DMARC.** These are three short text records
that prove your emails are really from you:
- **SPF** (Sender Policy Framework): lists which servers may send for you.
- **DKIM** (DomainKeys Identified Mail): a digital signature on each email.
- **DMARC** (Domain-based Message Authentication, Reporting and
  Conformance): tells inboxes what to do if the first two fail.
In Google Workspace: **Admin console** → **Apps** → **Google Workspace**
→ **Gmail** → **Authenticate email** → **Generate new record**. Copy the
record into your domain provider under **DNS** → **Add record** →
type **TXT**. Your provider's help page will give the SPF and DMARC
lines; start DMARC at `p=none`. The assistant can write the exact records
for you if you tell it your email provider.

**4. Warm it up.** For the first 2–3 weeks, send a few real emails a day
to people who will reply (colleagues, partners). Then start cold email
slowly: **no more than about 20–30 a day per mailbox**, each one
approved by you.

**5. Keep the do-not-contact list.** Open `my-company/do-not-contact.md`.
Every "no", every unsubscribe, every bounce-back saying "left the
company" goes there **the same day**. It is permanent.

## The rules (legal and platform)

**United States: CAN-SPAM.** Applies to B2B. The FTC says "The law makes
no exception for business-to-business email." You must: not use false or
misleading header information; use a subject line that matches the
content; say the message is an ad (flexible wording allowed); include a
"valid physical postal address"; explain how to opt out; honour opt-outs
within **10 business days**; keep the opt-out working for at least 30
days after sending. Penalty: up to **$53,088 per email**.
Source: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business

**United Kingdom: PECR plus UK GDPR.**
- *Corporate subscribers* (limited companies, LLPs, Scottish
  partnerships, government bodies): PECR's consent rule doesn't apply;
  you "can email or text any corporate body."
- *Individual subscribers* (sole traders and some partnerships): you need
  their specific consent, unless the "soft opt-in" applies (they bought
  or discussed buying something similar from you and were offered an
  opt-out).
- You can't tell a sole trader from a company by the address alone; the
  ICO says if unclear, treat them as an individual.
- UK GDPR still applies to named people's work addresses. Use
  "legitimate interests" (a lawful reason where your interest is
  balanced against theirs) and write down that balancing test; tell
  people where you got their details; honour objections.
Sources: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/
and https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/
(the second verified through search excerpts).

**European Union: ePrivacy plus GDPR.** The ePrivacy Directive, Article
13, sets opt-in for natural persons and leaves each country to protect
companies "sufficiently", so the rule **varies by country**:
https://www.legislation.gov.uk/eudr/2002/58/article/13 (verified through
search excerpts). GDPR Recital 47 says direct marketing "may be regarded
as carried out for a legitimate interest", which still needs a balancing
test: https://gdpr-info.eu/recitals/no-47/

**Germany: strict.** The Unfair Competition Act (UWG), section 7(2) no.
2, treats email advertising without the addressee's "prior express
consent" as an unacceptable nuisance, and this covers businesses too. The
only exception (section 7(3)) is existing customers buying similar
products who were offered an opt-out. **Default: do not cold email German
recipients.** Use events, inbound, or partners instead.
https://www.gesetze-im-internet.de/englisch_uwg/englisch_uwg.html

**Canada: CASL (consent-based).** You need express or implied consent.
Implied consent from a published address needs the person to have
published it, no "no unsolicited messages" note, and a message relevant
to their business role. Every message must name you, give a mailing
address plus a phone, email or web contact, and an unsubscribe honoured
within 10 business days.
https://ised-isde.canada.ca/site/canada-anti-spam-legislation/en/getting-consent-send-email
and the CRTC's guidance https://crtc.gc.ca/eng/com500/guide.htm (the
second verified through search excerpts; it blocked direct reading).
Penalties reach up to $10 million per violation for a business (CASL,
section 20(4): https://laws-lois.justice.gc.ca/eng/acts/E-1.6/section-20.html).
The contact details in a CASL message must stay valid for at least 60
days after it is sent.

**Inbox providers.** Google: all senders need SPF or DKIM; senders of
more than 5,000 a day need SPF, DKIM and DMARC and one-click unsubscribe;
keep the spam rate below 0.3% and ideally below 0.1%:
https://support.google.com/a/answer/81126 . Yahoo: similar, and honour
unsubscribes within 2 days: https://senders.yahooinc.com/best-practices/

## What the assistant must never do on this channel

- Never send, schedule or queue an email the user has not approved, word
  for word. The user sends each approved email from their own mailbox;
  only if they have deliberately set up the optional SES route does the
  engine send it, and then only the exact approved text, one approval
  per email.
- Never email anyone on `my-company/do-not-contact.md`.
- Never draft cold email to German recipients, Canadian recipients
  without a consent basis, or UK sole traders without consent; say why.
- Never write a misleading subject, a fake "Re:", or invented familiarity.
- Never present a guessed address as found.
- Never use personal (home) addresses or personal webmail found on
  social profiles.
- Never recommend buying email lists.

## How to measure it

| Measure | Healthy | Stop and fix |
|---|---|---|
| Bounce rate (undeliverable) | under 3% | over 5%: addresses are bad |
| Reply rate | 5–10% or more | under 2% after 100 emails: wrong people or message |
| Positive replies (interested) | 1–3% | none after 150 emails |
| Spam complaints | near zero | anything near 0.1% |
| Unsubscribes honoured within 10 business days | 100% | any miss |

Write the numbers and the best-performing first lines into
`my-company/lessons.md` every week.
