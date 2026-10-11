# Channel: news, press releases and funding announcements

> **For the assistant:** this is a **timing** channel. News tells you
> *when* a company that fits is likely to buy. Every lead from here
> carries the article or announcement URL, its date, and the exact
> sentence that matters. Never invent or paraphrase a quote as if it
> were exact.
>
> *Practical guidance, not legal advice. Sources checked 11 October 2026.*

---

## What it is and when it works best

Companies announce things in public: new funding, new leaders, new
products, new offices, mergers, big customer wins, new regulations they
must meet. Each is a moment when budgets, priorities and suppliers
change.

**Works best when:**
- The user sells to companies that make news: startups and scale-ups,
  mid-sized and large firms, public companies, regulated industries.
- The product helps with something a newly funded or newly led company
  needs soon (hiring, scaling, compliance, new markets, new tooling).
- The user can act within days or weeks of the news.

**Skip it or use it lightly when:**
- The buyers are small local businesses that rarely issue press releases
  (try `websites.md`, `communities.md` or `events.md`).
- The user can't act quickly; news goes stale.

*For example:* a voice-AI company like Deepgram might watch for
contact-centre software companies announcing a Series B, or for a new
Chief Product Officer at a company building meeting-notes software.

## What to ask the user first

1. "Which kinds of news usually come just before a customer buys from
   you? New funding, a new leader, an expansion, a regulation?"
2. "How big are your customers? (Seed-stage startups and listed
   companies need different searches.)"
3. "Which job title is the new leader you'd most like to hear about?"
4. "Which countries or regions?"
5. "Are there trade publications or newsletters your customers read?"
6. "How soon after the news can you reach out: same week?"

## How to find leads here

Use the assistant's web search tool. Replace the parts in
`<angle brackets>`; add the month and year to keep results fresh.

**Funding:**
- `"<industry>" "raises" OR "secures" OR "closes" "Series A" OR "seed"
  <month year>`
- `"<industry>" "funding round" "<country>" <month year>`
- `"led by" "<investor known for your space>" "<industry>"`

**New leaders:**
- `"<industry>" "appoints" OR "names" OR "hires" "<buyer title>"`
- `"joins <company type> as" "<buyer title>"`

**Launches, expansion, change:**
- `"<industry>" "launches" "<feature related to your product>"`
- `"<industry>" "opens" "new office" OR "expands into" "<region>"`
- `"<industry>" "acquires" OR "acquired by" <month year>`
- `"<new regulation or standard>" "<industry>" "deadline"`

**Where to look:** company newsrooms (`site:<company domain> press`),
press-release wires (search `"<industry>" press release <month year>`),
trade publications, local business journals.

**Public filings (US):** companies raising money under Regulation D file
a **Form D** with the SEC (the US securities regulator) within 15 days of
the first sale, and it's public on EDGAR, the SEC's filing database.
https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/what-form-d
Use it to confirm a raise, not as a contact source: Form D lists names
and addresses of executives, and **some of those may be personal
addresses. Never copy them.** Use the company's own website for contact
details.

**Funding databases** (Crunchbase, PitchBook, Dealroom and others) can be
useful if the user has an account, but the user reads them; check each
one's terms before exporting anything. **Unverified:** I did not check
each database's terms in this session.

**Strong signal:**
- Funding announced in the last 1–6 months, by a company that fits.
- A new leader in the buying seat in the last 90 days.
- A launch or expansion that clearly creates the need you solve.
- A regulation with a deadline that forces action.

**Weak signal:**
- News older than six months (unless it's a deadline still ahead).
- Funding for a company outside the user's fit.
- Award lists, "top 50" lists and sponsored articles: little timing.
- Rumours and unconfirmed reports.

## How to reach them

News opens the door; reach out through `cold-email.md`,
`cold-calling.md` or `linkedin.md`. Mention the news plainly and don't
over-congratulate:

> Hi <first name>, congratulations on <the news, e.g. the Series A
> announced on <date>>. Companies at that stage often run into
> <specific problem>, especially when <their stated plan, e.g. "doubling
> the support team">. We help with <specific outcome>. Is that on your
> list for the next few months, or not a priority?

For a new leader:
> Hi <first name>, I saw you joined <company> as <title> on <date>. When
> people step into that role they often review <area>. If that's on your
> list, we help <type of company> with <specific problem>. Worth a short
> call later this quarter?

## Step by step for the user

You don't need any tools; the assistant searches the news for you. To
get your own alerts as well (free):

**Google Alerts:**
1. Go to https://www.google.com/alerts
2. Type a search, for example `"<industry>" "raises"`.
3. Click **Show options**. Set **How often** to **At most once a day**,
   **Sources** to **News**, and choose your **Region**.
4. Click **Create Alert**. Repeat for each search the assistant gives
   you.
5. When an alert looks promising, paste the link into the chat. The
   assistant reads the article and checks the fit.

**Checking a lead yourself:** open the article link in
`my-company/leads.md`, confirm the date and the quoted sentence, and
tell the assistant if anything is wrong.

## The rules (legal and platform)

- **Reading news and press releases is fine.** They're published so
  people will read them. Quote only short phrases, with the link; don't
  copy whole articles (copyright).
- **Respect paywalls and terms.** Don't use tools to get around a
  paywall or to bulk-download a news site or database.
- **Contacting the people named** follows the rules of the channel you
  use: `cold-email.md` (CAN-SPAM, PECR/UK GDPR, EU and German rules,
  CASL) or `cold-calling.md` (DNC registers, TCPA). Being in the news
  does not make someone's personal contact details fair game.
- **Personal data.** Under UK and EU GDPR, a named executive's details
  are personal data even when published. Keep only what you need:
  https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/
  (verified through search excerpts).

## What the assistant must never do on this channel

- Never invent a funding round, a date, an amount, a new hire or a
  quote. If you can't find the source, it isn't a lead.
- Never state an amount or date without the link that shows it.
- Never copy personal addresses from filings or articles.
- Never get around a paywall or bulk-download a database.
- Never write outreach that implies insider knowledge ("I heard you're
  about to…").

## How to measure it

| Measure | What "working" looks like |
|---|---|
| Fresh, fitting news items found per week | 5–15, depending on the market |
| Share of leads under 90 days old when contacted | 90% or more |
| Reply rate on news-triggered outreach | higher than untriggered outreach (compare in `cold-email.md` numbers) |
| Which news type produces replies | note it; double down on that type |

Write which news type works best (funding, new leader, launch) into
`my-company/lessons.md` every two weeks.
