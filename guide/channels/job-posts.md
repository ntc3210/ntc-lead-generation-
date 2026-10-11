# Channel: job posts as buying signals

> **For the assistant:** a job post is a company telling the world, in
> writing, what problem it has and that it has budget for it. Use job
> posts to find **companies** and **timing**, not to collect people's
> details. Every lead carries the job post URL, its date, and the exact
> line that matters. Job posts disappear: save the quote when you find it.
>
> *Practical guidance, not legal advice. Sources checked 11 October 2026.*

---

## What it is and when it works best

When a company advertises a job, the post often says what tools they
use, what they're building, what's broken, and how fast they're growing.
That makes job posts one of the strongest signals there is.

**Three ways a job post signals a sale:**
1. **They're hiring for the job your product helps with.** (A company
   hiring five support agents may want software that makes support
   faster.)
2. **They're hiring for the job your product partly replaces or
   supports.** (Be tactful here; don't pitch "replace your new hire".)
3. **The post names a tool or project that pairs with yours.** ("You'll
   migrate us to <platform>", "experience with <tool> required".)

**Works best when:**
- The user sells to companies with real hiring activity: growing
  startups, mid-sized firms, enterprises.
- The product relates to a team that hires (engineering, support, sales,
  operations, finance, compliance, marketing).

**Skip it or use it lightly when:**
- The buyers are tiny businesses that hire by word of mouth.
- The user sells to consumers.

*For example:* a voice-AI API company like Deepgram might look for posts
mentioning "speech-to-text", "transcription" or "voice agent" in
engineering roles, which suggest a company is building voice features
now.

## What to ask the user first

1. "When a company is about to need you, which roles is it usually
   hiring?"
2. "Which tools, skills or project words in a job post would tell you
   it's a fit?"
3. "Which words would rule a company out (for example, 'we built our own
   <thing>')?"
4. "Is your product sensitive to the 'replacing people' angle? How do
   you want to talk about it?"
5. "Which countries or cities?"
6. "Which job title at the company should we contact: the hiring
   manager, or someone else?"

## How to find leads here

Use the assistant's web search tool. Company careers pages and public
job boards hosted by recruiting software are ordinary web pages the
assistant may read one at a time. Replace the parts in `<angle brackets>`:

- `"<job title>" "<tool or skill>" careers`
- `"<job title>" "<industry>" hiring <month year>`
- `site:boards.greenhouse.io "<tool or skill>"`
- `site:jobs.lever.co "<tool or skill>"`
- `site:jobs.ashbyhq.com "<tool or skill>"`
- `"we're hiring" "<role>" "<pain phrase>"`
- `site:<company domain> careers "<role>"` (check a single company)

Big job boards (Indeed, LinkedIn Jobs, Glassdoor and others) may appear
in search results. The assistant may use the title and snippet, but
must **not** crawl or bulk-copy those boards (see "The rules"). Open the
company's own careers page to confirm instead.

**Strong signal:**
- Posted in the last 30 days.
- The post describes the problem you solve, or names a tool that pairs
  with yours.
- Several related roles at once (a team is being built).
- Words like "first", "founding", "build out", "scale", "migrate".

**Weak signal:**
- Older than 60 days, or no date at all.
- "Evergreen" posts that some companies leave up permanently.
- A posting by a recruitment agency that doesn't name the company.
- One junior role with no detail.

**What to record** in `my-company/leads.md`: company, job title, URL,
date posted (or date found), the exact sentence that shows the fit, and
a note "measured" (the post says it) or "inferred" (you reasoned it).

**Who to contact:** the post may name the hiring manager; otherwise use
`websites.md` to find the head of that team. Don't contact the
recruiter to sell to them, and never contact job applicants.

## How to reach them

Reach out through `cold-email.md`, `cold-calling.md` or `linkedin.md`.
Refer to the post honestly, and don't suggest the new hire is
unnecessary:

> Hi <first name>, I saw you're hiring a <role> to <task from the
> post>. Teams at that stage often find <specific problem> takes up a lot
> of the new person's first months. We help <type of company> with
> <outcome>, so your new hire can focus on <higher-value work>. Would a
> short call be useful?

## Step by step for the user

You don't need any tools; the assistant searches for you. To set up your
own alerts as well:

**Google Alerts (free):**
1. Go to https://www.google.com/alerts
2. Type a search the assistant gives you, e.g. `"<job title>" "<tool>"`.
3. Click **Show options**; set **How often** to **At most once a day**.
4. Click **Create Alert**.

**Job board alerts (free, using your own account):**
1. On a job site you already use, search for the role and location.
2. Look for **Create alert**, **Save search** or **Get job alerts** near
   the results, and click it.
3. When an alert arrives, paste the link into the chat. The assistant
   checks the fit and saves the evidence.

## The rules (legal and platform)

- **Indeed** prohibits automated access and scraping in its Site Rules
  (section D.21): no "automated system (bots, scrapers, spiders, AI or
  Agentic AI)" to access or data-mine, and "You may not crawl, scrape,
  extract data from" the site (crawling is allowed only as its
  robots.txt file says). https://www.indeed.com/legal
- **LinkedIn Jobs** is part of LinkedIn: no scraping or automation
  (User Agreement section 8.2):
  https://www.linkedin.com/legal/user-agreement
- **Other boards:** treat them the same way unless their terms clearly
  allow it. **Unverified:** I didn't check Glassdoor, Greenhouse, Lever
  or Ashby terms in this session; reading single public pages is
  ordinary browsing, bulk collection is not.
- **Contacting the company** follows the rules of the outreach channel
  (`cold-email.md`, `cold-calling.md`, `linkedin.md`).

## What the assistant must never do on this channel

- Never crawl, scrape or bulk-copy job boards, especially Indeed,
  LinkedIn and Glassdoor.
- Never contact, or collect details of, job applicants or recruiters'
  candidates.
- Never pretend to be a job seeker, recruiter or applicant to get
  information.
- Never invent a job post, or claim one is current without checking its
  date.
- Never write outreach that says or implies "you don't need to hire".

## How to measure it

| Measure | What "working" looks like |
|---|---|
| Fitting job posts found per week | 10 or more in an active market |
| Share still live when the user checks | 80% or more |
| Reply rate on job-post-triggered outreach | at or above your best cold email rate |
| Which roles and keywords produce replies | note them; refine searches |

Each fortnight, write in `my-company/lessons.md` which job titles and
tool names led to real conversations.
