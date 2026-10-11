# ntc-lead-generation (Lead Scout)

**An AI lead-generation coach for any company.** Open this folder in
Claude Code and it interviews you about your business, then helps you
find likely customers, with proof for each one. It also writes honest
outreach that you approve before anything is sent.

> Built on [Automaton](https://github.com/Conway-Research/automaton) by
> Conway Research (MIT licence). See [CREDITS.md](CREDITS.md).

---

## What it does

1. **Learns your business.** It asks simple questions, one at a time,
   and looks up what it can on your website so you don't have to type it.
2. **Picks the right channels for you:** company websites, cold email,
   phone (your team dials; it prepares), LinkedIn (by hand), Reddit and
   forums, news and funding, job posts, events, partners.
3. **Finds leads with evidence.** Each one comes with the quote or link
   that shows why it's a fit. It never makes leads up.
4. **Writes outreach that you approve.** Nothing is sent without your
   yes, and you send it yourself, from your own work email.
5. **Gets better for you.** It keeps notes on what worked, on your
   computer only.

A built-in checker, **Jimmy**, steps in on his own if something would
break a law, cost money, rest on no evidence, or if you seem stuck.

## Your data stays with you

Everything Lead Scout learns about your company is stored only in the
`my-company/` folder on your computer. It is **never sent to the
toolkit's author**, and it is excluded from git, so pushing this project
to GitHub leaves it behind.

Two things to know:
- **If you copy, zip or share the whole folder** (by email, Dropbox,
  Google Drive, or GitHub's "Upload files" button), `my-company/` goes
  with it. Delete it from the copy first.
- **Claude processes what it reads to answer you.** That includes your
  company notes and leads, and it happens on Anthropic's servers, under
  your Claude plan's privacy terms. Web searches go to the search
  service.

---

## Setup (about 15 minutes, no coding)

### What it costs
- **Claude:** you need a paid Claude plan. **Pro is $20/month** and
  includes Claude Code.
- **This toolkit:** free.
- **Optional, later:**
  - automatic searching with the Brave Search API, about $5 per 1,000
    searches with $5 of free credit a month (check
    https://brave.com/search/api/ for today's price);
  - a separate email domain for outreach, about $10–20 a year;
  - a business mailbox on it, about $7 or more per user a month.

  Lead Scout tells you before anything costs money.

### Step 1: Get a Claude plan
1. Go to **https://claude.ai** and click **Sign up** (or **Log in**).
2. Click your name (bottom left) → **Settings** → **Billing**, and choose
   **Pro**.

### Step 2: Install the Claude desktop app
1. Go to **https://claude.ai/download**.
2. Click the download for your computer (**Windows** or **Mac**), open
   the file, and follow the installer.
3. Open the app and sign in with the same account.

### Step 3 (Windows only): Install Git
The Code tab needs a free program called Git (it tracks changes to files)
to work with folders on your computer. Macs already have what they need,
so Mac users can skip this step.
1. Go to **https://git-scm.com/downloads/win** and click the download at
   the top, **"Click here to download"**.
2. Open the downloaded file. Click **Next** on every screen, keeping all
   the default settings, then **Install**, then **Finish**.
3. **Close the Claude app completely and open it again.**

### Step 4: Download this toolkit
You don't need a GitHub account to download it.
1. Go to **https://github.com/ntc3210/ntc-lead-generation-**.
2. Click the green **Code** button → **Download ZIP**.
3. Find the ZIP in your **Downloads** folder. **Right-click** it →
   **Extract All…** → **Extract** (Windows), or double-click it (Mac).
4. The folder that comes out is called **ntc-lead-generation--main** (two hyphens). On
   Windows there is often a second folder of the same name *inside* it.
   **Open folders until you see one that contains a file called
   `CLAUDE.md`.** That's the right one.
5. Move that folder somewhere easy, such as **Documents**. You can rename
   it to **lead-scout**.

### Step 5: Open it in Claude Code
1. In the Claude desktop app, click the **Code** tab at the top.
2. Under the message box, make sure **Local** is selected, not
   **Cloud**. Local keeps the work on your computer.
3. Click **Select folder** and choose the folder that contains
   `CLAUDE.md` (from Step 4).
4. Now you'll see a message box ready for you to type.

**About the permission pop-ups:** Claude asks before it does certain
things, such as searching the web or saving a note into `my-company/`.
Read each one and click **Allow** if it matches what you asked for. If a
pop-up mentions sending, spending money, or a website you don't
recognise, click **Deny** and ask Lead Scout what it was trying to do.

### Step 6: Say hello
Type anything, for example *"Hi, I want more customers"*, and press
**Enter**. Lead Scout will answer, explain how it works, and ask which
company you work for.

**Not sure what to ask?** Type *"What can you do?"* or look at
[guide/questions-you-can-ask.md](guide/questions-you-can-ask.md).

---

## What's inside

| Folder | What it is |
|---|---|
| `CLAUDE.md` | The instructions Claude reads automatically |
| `guide/` | The interview questions, buying signals, Jimmy's rules, and one playbook per channel |
| `templates/` | Company profile, channel plan, lead scoring, and the engine's settings example |
| `examples/deepgram/` | A worked example from public information (not affiliated) |
| `my-company/` | **Your** private notes (and, if you set the engine up, its settings, lead database and outbox). Never uploaded |
| `src/leads/` | The optional lead engine: saves leads only with proof, a local approval page, and an outbox of approved emails for you to send from your own mailbox. Set up with [guide/engine-setup.md](guide/engine-setup.md) |
| `src/__tests__/leads/` | The engine's tests (no paid calls) |
| `docs/automaton/` | Automaton's original documentation, kept for credit |
| `THIRD_PARTY_NOTICES.md` | The open-source packages the engine uses, and their licences |

## Rules it follows

- Your team makes the phone calls. No AI-voice cold calls (US FCC ruling,
  Feb 2024).
- You send every email yourself, from your own mailbox, after approving
  it. Every email carries your postal address and an opt-out line.
  (Automatic sending through Amazon SES exists as an optional, advanced
  route; see `guide/engine-setup.md`.)
- It never scrapes sites that forbid it (LinkedIn, Facebook, Google Maps,
  Reddit and others).
- It collects business contact details only.

## Licence and credits

MIT licence. See [LICENSE](LICENSE). Built on
[Automaton](https://github.com/Conway-Research/automaton) by Conway
Research; full credits are in [CREDITS.md](CREDITS.md).
