# Channel: company websites (about, team, careers, customers pages)

> **For the assistant:** read this before searching company websites for a
> user. Quote it in plain words; don't paste it. Every lead you save goes
> in `my-company/leads.md` with the URL that proves it.
>
> *This is practical guidance, not legal advice. Laws change; the sources
> below were checked on 11 October 2026.*

---

## What it is and when it works best

A company's own website is the most honest source there is. It tells you
what they do, who works there, what tools they use, who their customers
are and whether they're hiring. You read it the way a careful salesperson
would before a meeting.

**Works best when:**
- The user sells to **businesses** (B2B, business-to-business) and can
  describe the kind of company that buys.
- The buyer's fit shows on the site: their industry, size, products,
  locations, or the tools they mention.
- The user wants **fewer, better leads**, researched properly.

**Skip it or use it lightly when:**
- The user sells to consumers, not companies.
- The target companies are tiny and have no real website (try
  `communities.md` or `events.md` instead).
- The user needs volume fast. Websites are slow to read; pair this
  channel with `job-posts.md` or `news-and-funding.md`, which surface
  timing.

*For example:* a voice-AI company such as Deepgram might read a contact
centre software firm's "Product" page to see whether it already offers
call transcription, and its "Careers" page to see whether it's hiring
speech engineers.

## What to ask the user first

1. "Name two or three of your best customers. What would I see on their
   websites that tells me they're a good fit?"
2. "Which words would a good-fit company use about itself on its home
   page? And which words would rule it out?"
3. "Which job title usually signs off on buying from you? Do companies
   list that person on their team page?"
4. "Are there tools or platforms that your customers usually use, which
   they might mention on their site (for example in an 'integrations'
   page)?"
5. "Which countries or regions do you sell into?"
6. "Is there anyone you must never approach: existing customers,
   partners, competitors, or companies under an exclusive deal?"

## How to find leads here

Use the assistant's own web search tool (the search built into Claude),
then open and read the pages it returns. Replace the parts in
`<angle brackets>`.

**Finding companies that fit:**
- `"<industry>" "<what they do>" "our customers"`
- `"<product category>" "<country or city>" "about us"`
- `"powered by <tool your customers use>" "<industry>"`
- `"integrates with <tool>" "<industry>"` (finds companies on a platform
  yours pairs with)
- `"case study" "<your type of solution>" "<industry>"` (companies that
  already buy something like yours)

**Reading a candidate's own site** (open these pages if they exist):
- `/about`, `/company`, `/team`, `/leadership`: who decides
- `/careers`, `/jobs`: are they growing, and in which teams? (see
  `job-posts.md`)
- `/customers`, `/case-studies`: who they sell to; are they the right size?
- `/integrations`, `/partners`: which tools they use
- `/blog`, `/news`, `/press`: recent launches and announcements
- `site:<their domain> "<pain phrase>"` (search one site for a phrase)

**Strong signal (save it, with the URL):**
- The site states a need your product meets, in their words (e.g. "we're
  rebuilding our support experience").
- A recent page (dated in the last 3–6 months) announcing a launch,
  expansion, new market or new leader.
- A careers page hiring for a role your product supports.
- They use a tool yours plugs into.

**Weak signal (note it, but don't call it a lead on its own):**
- The industry fits but nothing shows timing.
- A team page with no dates (people may have left).
- An undated blog post, or one older than a year.
- Generic marketing words ("AI-powered", "innovative") with no detail.

**Finding the right person:** use the team or leadership page, a press
release that names them, or a conference speaker page. Record their
**business** role and the URL where you saw it. Only collect business
contact details (see "The rules").

## How to reach them

This channel is for research. Reaching out happens through another
channel: `cold-email.md`, `cold-calling.md` or `linkedin.md`. Use what
you found to make the first line true and specific:

> Hi <first name>, I saw on your <page, e.g. careers page> that you're
> hiring <role> to <task they describe>. We help <type of company> with
> <the specific problem>. Would a short call about <their goal> be useful,
> or is this not a priority right now?

No "I've been following you for years." No made-up compliments. Mention
only what the page actually says.

## Step by step for the user

You don't need any tools for this channel; the assistant searches and
reads for you. To check a lead yourself:

1. Open the link the assistant gave you (each lead in
   `my-company/leads.md` has one).
2. Read the quoted sentence on the page. Does it still say that?
3. Look for a date near it (top or bottom of the page, or the page's
   "last updated" note).
4. If the page has changed or the person has left, tell the assistant:
   "Lead <company> is out of date." It will mark it.
5. To check a company's general contact address, open their **Contact**
   page and copy the address listed there. Never use a home address.

## The rules (legal and platform)

- **Reading public web pages is fine.** Automated copying of whole sites
  (scraping, meaning a program that downloads pages in bulk) is not what
  this channel does. The assistant reads individual pages, one at a time,
  as a person would.
- **Respect sites that forbid scraping.** Many platforms ban automated
  collection in their terms. Examples (each marked where it could not be
  checked on the official page):
  - LinkedIn User Agreement, section 8.2, bans software, scripts, robots
    or "browser plugins and add-ons" used "to scrape or copy the
    Services, including profiles":
    https://www.linkedin.com/legal/user-agreement
  - Facebook Terms, section 3.2: you "may not access or collect data from
    our Products using automated means (without our prior permission)":
    https://www.facebook.com/legal/terms
  - Instagram Terms of Use: no "collecting information in an automated
    way without our express permission":
    https://help.instagram.com/581066165581870 (verified through search
    excerpts; the page would not render for me).
  - X Terms of Service: crawling or scraping "in any form, for any
    purpose without our prior written consent" is prohibited:
    https://x.com/en/tos (**unverified at source**: the page refused my
    request; wording confirmed by secondary sources such as
    https://techcrunch.com/2023/09/08/x-updates-its-terms-to-ban-crawling-and-scraping).
  - Yelp Terms of Service, section 7.2(10), bans robots, spiders and
    scrapers (this is the dated 2020 version):
    https://terms.yelp.com/tos/en_us/20200101_en_us/
  - Google Maps Platform Terms, section 3.2.3(a) "No Scraping":
    https://cloud.google.com/maps-platform/terms (**unverified**: the page
    would not load for me; the clause is reported by secondary sources.)
- **Personal data (UK and EU).** A named person's work email is still
  personal data under the UK GDPR and EU GDPR (General Data Protection
  Regulation, the law on handling information about people). The UK
  regulator says B2B marketing is covered when business details "contain
  personal data": https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/
  (verified through search excerpts of the page).
- **Canada.** Finding an address on a website does not by itself allow
  you to email it. Under CASL, "conspicuous publication" needs the person
  to have published it themselves, with no "no marketing" note, and the
  message must be relevant to their job. See `cold-email.md`.

## What the assistant must never do on this channel

- Never scrape or bulk-download a site, and never touch sites whose terms
  forbid automated collection (LinkedIn, Facebook, Instagram, X, Google
  Maps and Business Profiles, Yelp, Reddit).
- Never collect home addresses, personal phone numbers or personal social
  profiles. Business contact details only.
- Never guess an email address by pattern (like `firstname@company.com`)
  without telling the user: "This is a guess. Verify it before use: check
  their Contact page, a press release, or ask the switchboard."
- Never invent a person, a job title, a quote or a company. If a page
  doesn't say it, it doesn't go in the lead.
- Never save a lead without the URL and the exact sentence that justifies
  it.
- Never contact anyone on `my-company/do-not-contact.md`.

## How to measure it

Track in `my-company/lessons.md` each week:

| Measure | What "working" looks like |
|---|---|
| Leads found per hour of research | 5–10 well-evidenced leads |
| Share of leads the user agrees are a good fit | 70% or more |
| Share whose evidence is still true when checked | 90% or more |
| Replies to outreach built from website research | Higher than generic outreach (compare against `cold-email.md` numbers) |

If the user rejects more than a third of leads, go back to question 1 and
2 above: the fit description is wrong, not the channel.
