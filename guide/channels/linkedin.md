# Channel: LinkedIn (by hand only)

> **For the assistant:** LinkedIn is **manual only**. The user searches,
> reads, connects and messages by hand, in their own account. You help
> them decide whom to look for, write the search terms, and draft notes
> and messages for them to approve and send themselves. You never open,
> read, scrape or automate LinkedIn, and you never suggest a tool or
> browser extension that does.
>
> *Practical guidance, not legal advice. Sources checked 11 October 2026.*

---

## What it is and when it works best

LinkedIn is the professional network where people list their job,
company and work history. For many B2B buyers it is where they're most
reachable and most willing to hear about work topics.

**Works best when:**
- The buyer has a clear job title (Head of Operations, VP Engineering,
  Practice Manager) and keeps their profile up to date.
- The user has, or is willing to build, a decent profile of their own:
  photo, clear headline, what they help with.
- The deal is valuable enough that 10–20 careful contacts a day is
  worth the user's time.

**Skip it or use it lightly when:**
- Buyers are trades, local shops or consumers who rarely use LinkedIn.
- The user wants hundreds of contacts a week. Doing that by hand is
  slow; doing it by machine breaks LinkedIn's rules and gets accounts
  restricted.

*For example:* someone selling a voice-AI API such as Deepgram might
look for "Director of Product" at companies that build meeting-notes
or call-recording software, then comment on a post they wrote before
sending a short note.

## What to ask the user first

1. "Is your LinkedIn profile up to date? What does your headline say?"
   (People check it before accepting.)
2. "Which two or three job titles buy from you, and which titles only
   influence the decision?"
3. "Do you pay for LinkedIn Premium or Sales Navigator (LinkedIn's paid
   sales search tool)?" Don't recommend buying it until free search has
   been tried for two weeks.
4. "Do you post on LinkedIn, or would you be willing to post once a
   week?" (See `inbound.md`.)
5. "How many connection requests can you send by hand each day without
   rushing?" (Start with 10–15.)
6. "Are there people you already know at target companies? A warm
   introduction beats any cold note."

## How to find leads here

The **user** does the searching inside LinkedIn. The assistant writes
the search words. Typical searches to type into LinkedIn's search bar:

- `"<job title>" <industry>` then filter to **People**
- `"<job title>" "<company name>"`
- `<topic your buyer posts about>` then filter to **Posts** (people
  talking about the problem in their own words)
- `"we're hiring" "<role your product supports>"` filtered to **Posts**

The assistant may also use ordinary web search (not LinkedIn itself) to
find the **company** and its evidence first: `websites.md`,
`news-and-funding.md`, `job-posts.md`.

**Strong signal:** a recent post (last 30–60 days) where the person
describes the problem you solve, announces a new role, or asks for
recommendations. A new job in the buying seat in the last 90 days.
**Weak signal:** a matching title with no recent activity; profiles that
look abandoned; anyone who lists themselves as "open to work" (they may
be leaving).

**What to record** in `my-company/leads.md`: company, role, the URL of
the public post or company page that is the evidence, and the user's
own one-line summary. Don't copy whole profiles into files, and never
record personal phone numbers, home addresses or personal email.

## How to reach them

**Connection note** (LinkedIn limits the length; keep it to two
sentences):
> Hi <first name>, I read your post about <topic> and agreed with
> <specific point>. I work on <problem> for <type of company> and would
> like to follow your updates.

**After they accept** (wait a day; don't pitch in the thank-you):
> Thanks for connecting, <first name>. You mentioned <their words>. We
> help <type of company> with exactly that, e.g. <one honest proof>.
> Would a short call be useful, or is it not a priority right now?

No "I came across your impressive profile." No pretending to know them.
If they don't reply, one follow-up at most, then stop.

## Step by step for the user

**Search for people:**
1. Open LinkedIn and click the **Search** bar at the top.
2. Type the search the assistant gave you and press **Enter**.
3. Click **People** in the row of filters under the search bar.
4. Click **All filters** to narrow by **Locations**, **Current
   companies** or **Industry**. Click **Show results**.
5. Open a profile. Look for recent posts under **Activity**.

**Send a connection request with a note:**
1. On their profile, click **Connect** (or **More** → **Connect** if
   **Connect** is hidden).
2. Click **Add a note**.
3. Paste the note the assistant drafted and you approved.
4. Click **Send**.

**Keep it safe:** 10–20 requests a day is plenty. If many go
unaccepted, stop and rework the note. When someone says "not
interested", tell the assistant so it goes on
`my-company/do-not-contact.md`.

**If you want help replying to a specific post:** copy the text of that
one post and paste it into the chat. The assistant drafts a comment or
message for you to edit. Don't paste in lists of profiles.

## The rules (legal and platform)

- **No automation tools.** LinkedIn's User Agreement, section 8.2,
  forbids using "software, devices, scripts, robots" including "browser
  plugins and add-ons" "to scrape or copy the Services, including
  profiles and other data", and forbids "bots or other unauthorized
  automated methods to access the Services, add or download contacts,
  send or redirect messages".
  https://www.linkedin.com/legal/user-agreement
- **LinkedIn's help page on prohibited software** says it doesn't permit
  third-party software, including crawlers, bots, browser plug-ins or
  extensions, that scrapes or automates activity; accounts that use them
  may be restricted or shut down.
  https://www.linkedin.com/help/linkedin/answer/a1341387
- **Messages sent on LinkedIn are still marketing.** UK GDPR and EU GDPR
  apply to information about named people, even at work: keep only what
  you need and honour objections.
  https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/
  (verified through search excerpts).
- **Unverified:** LinkedIn's exact weekly limit on connection requests.
  It isn't published as a fixed number; stay well below heavy use.

## What the assistant must never do on this channel

- Never visit, read, crawl or scrape LinkedIn pages, through any tool or
  browser.
- Never recommend, install, configure or explain how to use any tool or
  extension that auto-connects, auto-messages, auto-visits, auto-endorses
  or exports contacts from LinkedIn, even "safe" or "cloud-based" ones.
- Never send or schedule a LinkedIn message; the user sends each one.
- Never copy someone's profile into a lead file, or store personal phone
  numbers, home addresses or personal email found there.
- Never write a message that pretends to a relationship that doesn't
  exist.

## How to measure it

| Measure | Healthy | Change something |
|---|---|---|
| Connection acceptance rate | 30–50% | under 20%: improve note or profile |
| Replies to the first message after connecting | 10–20% | under 5% |
| Conversations that become calls | 1 in 5 replies | none after 20 replies |
| Time spent per day | under 30 minutes | if it's eating the day, cut the target |

Write the notes that got accepted, and the posts that started real
conversations, into `my-company/lessons.md` each week.
