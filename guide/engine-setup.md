# Setting up the engine (optional)

> **For the assistant:** walk the user through this **only when they opt
> in**. Lead Scout works without it: you can search, find leads and write
> drafts in the chat, and the user sends approved messages by hand. The
> engine adds three things: a database of leads with their evidence, a
> local **approval page** with buttons, and an **outbox** of approved
> emails that the user sends from their own mailbox. Go one part at a time. Say what each part
> costs before they start it. Run the commands for them when they say so,
> and explain what each one did.
>
> Anything marked *(unverified)* is a button name or step we could not
> check against the live site on 11 October 2026. Tell the user it may
> look slightly different.

**What you'll end up with:**
- Parts 1–4 (about 20 minutes, free to $5/month): the engine on its
  recommended route, **by hand**. It searches, saves leads with proof, and
  when you approve an email it writes the final version (with your postal
  address and opt-out line) to a folder. You paste it into your own work
  email (Gmail, Outlook ...), press send there, and click **I sent it**.
- Part 5 (optional and advanced, 1–2 hours over a few days, about $10–20
  a year plus pennies per email): the engine sends through Amazon SES
  itself. Read the warning there first; most users never need it.

---

## Part 1: Install Node.js (free)

Node.js is the free program that runs the engine's code.

**Windows**
1. Go to **https://nodejs.org/en/download**.
2. Make sure the page says **Windows** and **LTS** (long-term support:
   the steady version). On 11 October 2026 that was version 24.
3. Click the **Windows Installer (.msi)** button *(button name
   unverified)*.
4. Open the downloaded file. Click **Next** on each screen, keep the
   default settings, then **Install**, then **Finish**.
5. Close the Claude app completely and open it again, so it notices Node.

**Mac**
1. Go to **https://nodejs.org/en/download**.
2. Make sure the page says **macOS** and **LTS**.
3. Click the **macOS Installer (.pkg)** button *(button name unverified)*.
4. Open the downloaded file and click **Continue**, **Agree**,
   **Install**, entering your Mac password when asked, then **Close**.
5. Quit Claude completely (**Claude** menu → **Quit**) and open it again.

**Check it worked:** ask Lead Scout *"Check that Node is installed."* It
runs `node --version` and should see `v24` or higher (`v22.12` is the
lowest that works).

## Part 2: Running commands

You don't have to type commands. The easiest way: **ask Lead Scout to run
them for you.** It will show you the command and ask permission each
time; click **Allow** when it matches what you asked for.

**One command you always run yourself: the approval page.** It has a
secret link that lets whoever holds it press the Approve buttons, so it is
never shown to Lead Scout. To open your own terminal (a text window for
commands) in the right folder:

**Windows**
1. Open **File Explorer** and go to the Lead Scout folder (the one with
   `CLAUDE.md`).
2. Click in the **address bar** at the top, type `cmd`, and press
   **Enter**. A black window opens, already in that folder.

**Mac**
1. Open **Finder** and find the Lead Scout folder.
2. **Right-click** (or Control-click) the folder → **Services** → **New
   Terminal at Folder** *(if you don't see it: **System Settings** →
   **Keyboard** → **Keyboard Shortcuts** → **Services** → **Files and
   Folders** → tick **New Terminal at Folder**; menu names unverified)*.

The Claude app's Code tab may also have its own terminal panel *(location
unverified)*; that works too, as long as you type the command yourself.

## Part 3: Install the engine (free)

Ask Lead Scout to run, or type:

```
npm install
```

This downloads the free open-source parts the engine uses (listed in
`THIRD_PARTY_NOTICES.md`) into a `node_modules` folder. It takes a minute
or two. Warnings in yellow are normal; red **ERR!** lines are not: ask
Lead Scout to explain them.

Then check everything works:

```
npm run test:leads
```

You should see a line ending in **passed** and no **failed**. These tests
make no paid calls.

## Part 4: Settings, a search key, and sending by hand

### 4a. Create your settings file (free)
Ask Lead Scout to *"create my engine settings from the example"*. It
copies `templates/engine.example.json` to `my-company/engine.json`. That
file stays on your computer: `my-company/` is never uploaded or shared.

### 4b. Get a Brave Search API key ($5 per 1,000 searches; $5 free each month)
The engine searches the web through Brave's official search service,
because Google and Bing forbid automated searching of their results.

**Cost (checked on https://brave.com/search/api/, 11 October 2026):** the
**Search** plan is **$5 per 1,000 searches**, with **$5 of free credit
every month**, so up to about 1,000 searches a month cost nothing. Brave
asks for a credit card even for free use, to confirm who you are. A
typical session uses 20–60 searches. Lead Scout tells you before any
search that would cost money beyond the free credit.

1. Go to **https://brave.com/search/api/** and click **Get started**
   *(unverified)*.
2. Create an account with your email, and confirm it from the email Brave
   sends.
3. In the dashboard, choose the **Search** plan *(plan picker
   unverified)* and add a card when asked.
4. Open **API Keys** in the left menu and click **Add API key**
   *(unverified)*. Name it `lead-scout`.
5. Copy the key. **Don't paste it into the chat.** Instead, open
   `my-company/engine.json` in a text editor (Notepad on Windows,
   TextEdit on Mac), replace `<your Brave Search API key: ...>` with
   your key, keeping the quote marks, and save.
6. Tip: in Brave's dashboard, set a monthly spending limit if it offers one
   *(unverified)*.

### 4c. Your email footer (free; needed before any email is approved)
Open `my-company/engine.json` in a text editor and fill in the
`"sending"` part yourself (Lead Scout may tell you what goes where, but it
does not edit this part):
- `"senderName"`: your name;
- `"businessName"`: your company's name;
- `"postalAddress"`: your company's **real postal address**, with the
  street or box number and the postcode. US law (CAN-SPAM) requires one in
  every commercial email; see `guide/channels/cold-email.md`;
- `"replyTo"` (optional): where "no thanks" replies go; delete the line if
  you don't need it.
Leave `"route": "by_hand"`. Until every one of these is filled in (no
`<...>` left), the approval page says **NOT READY** and no email can be
approved. The SES-only lines can stay as they are.

**Germany and Canada:** the engine refuses cold email to leads marked
`DE`, or with a `.de` email or website. For Canada (`CA`, `.ca`) it needs
the lead to record a **consent basis** first (Canada's CASL). Don't change
`"noColdEmailCountries"` or `"consentRequiredCountries"` without a
lawyer's advice.

### 4d. Find, approve, send by hand (free)
1. Ask Lead Scout to find leads. It runs `npm run leads:manual -- search
   ...` and saves only leads with proof it was shown.
2. Open the approval page **yourself**: in your own terminal (Part 2),
   type `npm run leads:approve` and press **Enter**. Your browser opens
   the page; if it doesn't, copy the link the window shows into your
   browser. The page only works on your own computer. Keep the window
   open while you use the page; close it when you're done.
3. Read each lead and its draft. Edit the text if you like, then click
   **Approve: write it to the outbox for me to send**.
4. Open `my-company/outbox/`. The newest file holds the email: the
   subject, then the full text with your footer.
5. In Gmail or Outlook, click **Compose** (Gmail) or **New mail**
   (Outlook), paste the address, subject and text exactly, and click
   **Send**.
6. Back on the approval page, under **Approved and contacted**, click **I
   sent it** for that lead.
7. When someone replies, click **Replied, interested**, or **Said no
   (never contact)**, which adds them to your do-not-contact list for
   good.

*(Optional: `"route": "practice"` lets you try the buttons with an
unfinished footer. Practice files are stamped PRACTICE ONLY and NOT READY
TO SEND, and are never marked sent.)*

*(Optional, not needed for most users: `npm run leads:run` lets the engine
search on its own with Anthropic's API. It needs an API key from
https://console.anthropic.com with a spending limit you set, and costs a
few cents to a dollar or two per run, within the daily cap in
`engine.json`. Manual mode, where Lead Scout does the searching in this
chat, uses no API key at all.)*

---

## Part 5 (optional, advanced): sending through Amazon SES

> **For the assistant (Jimmy):** before starting this part, tell the user
> plainly, and get their answer:
> 1. **AWS's own rules may not allow cold email.** When you ask Amazon
>    SES for production access, its form asks you to confirm that you
>    *"only send email to individuals who've explicitly requested it"*
>    (AWS documentation, "Request production access", checked 11 October
>    2026). One-to-one B2B cold email may not meet that. **We could not
>    confirm that AWS allows it.** The engine will not use SES until the
>    user has read that requirement, decided their use fits it, and set
>    `"sesAwsRequirementConfirmed": true` themselves.
> 2. Sending by hand (Part 4d) needs none of this and is the recommended
>    route.
> 3. SES is for small numbers of approved, one-to-one emails, never bulk.
> Never set `sesAwsRequirementConfirmed` or `"route"` for the user.

### 5a. A separate sending domain (about $10–20 a year)
So a mistake can never hurt your main company email. Follow **step 1** in
`guide/channels/cold-email.md` ("Get a separate sending domain"), for
example `get<company>.com`.

### 5b. An AWS account (free to create)
1. Go to **https://aws.amazon.com** and click **Create an AWS account**.
2. Follow the steps (email, password, card, phone check). Choose the
   **Basic support – Free** plan.
3. Sign in to the **AWS Management Console**.

**Cost:** SES charges **$0.10 per 1,000 emails** (checked on
https://aws.amazon.com/ses/pricing/, 11 October 2026). New AWS customers
may get free-tier credits. Sending 30 emails a day costs about $0.09 a
month.

### 5c. Verify your sending domain in SES, with SPF, DKIM and DMARC (free)
These are short text records that prove your emails really come from you
(explained in `guide/channels/cold-email.md`, step 3).
1. In the AWS console's top search bar, type **SES** and open **Amazon
   Simple Email Service**.
2. Top right, pick the **region** (for example **US East (N. Virginia)**,
   which is `us-east-1`). Write the code down: it goes in `awsRegion`.
3. In the left menu, click **Identities**, then **Create identity**.
4. Choose **Domain**, type your sending domain, leave **Easy DKIM** on,
   and click **Create identity**.
5. SES shows three **CNAME** records. In your domain provider, open
   **DNS** and add each one exactly *(menu names differ by provider)*.
6. Also add SPF and a DMARC record starting at `p=none`. Lead Scout can
   write the exact records if you tell it your domain provider.
7. Wait until the identity shows **Verified** (minutes to a few hours).

### 5d. Sandbox, then production access (free; about a day)
New SES accounts start in the **sandbox** (a test mode): you can send only
**to addresses you have verified**, at most **200 emails a day** and **1 a
second**. Use it to send yourself a test.

To leave the sandbox (read the warning at the top of Part 5 first):
1. In SES, click **Account dashboard** in the left menu.
2. In the box saying your account is in the sandbox, click **View Get set
   up page**, then **Request production access**.
3. Pick **Marketing** or **Transactional**, enter your **Website URL**,
   and add a contact email.
4. Read the **Acknowledgement** carefully. Only tick it if it is true for
   you. Then click **Submit request**.
5. AWS replies within about 24 hours.

### 5e. A send-only AWS user and CLI profile (free)
The engine signs in to SES with a named **profile**: a saved key pair on
your computer that can do one thing only, send email from your domain.
1. Install the AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
   (download the Windows or macOS installer and click through it).
2. In the AWS console, search **IAM** → **Users** → **Create user**. Name
   it `lead-scout-sender`. Click **Next**, then **Next** again without
   attaching anything, then **Create user**.
3. Open the new user → **Permissions** tab → **Add permissions** →
   **Create inline policy** → the **JSON** tab. Replace the text with this
   (put your region, your 12-digit AWS account number, shown top right,
   and your domain in place of the three capitalised words):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "SendFromOneDomainOnly",
         "Effect": "Allow",
         "Action": ["ses:SendEmail", "ses:SendRawEmail"],
         "Resource": "arn:aws:ses:REGION:ACCOUNTNUMBER:identity/YOURDOMAIN.com"
       }
     ]
   }
   ```
   Click **Next**, name it `send-only`, click **Create policy**. *(If AWS
   refuses a send with an "AccessDenied" mentioning a "configuration-set",
   ask Lead Scout to add that resource to the policy.)*
4. Still on the user: **Security credentials** → **Create access key** →
   **Command Line Interface (CLI)** → tick the confirmation → **Next** →
   **Create access key**. Keep this page open.
5. In your own terminal (Part 2), type `aws configure --profile
   lead-scout` and press **Enter**. Paste the **Access key ID**, then the
   **Secret access key**, then your region, pressing **Enter** after each.
   **Never paste the secret key into the chat.**

### 5f. Turn SES on (you do this yourself)
1. In `my-company/engine.json`, in the `"sending"` part, fill in
   `"fromAddress"` (on your verified domain), `"awsRegion"` and
   `"awsProfile": "lead-scout"`.
2. Read AWS's requirement once more: *"only send email to individuals
   who've explicitly requested it"*. Only if your use fits it, set
   `"sesAwsRequirementConfirmed": true` and `"route": "ses"`, and save.
3. Restart the approval page (close its window, run `npm run leads:approve`
   again). Its banner must say **LIVE (Amazon SES)**. If it says **BY
   HAND**, the banner says what is missing.
4. Each email goes out only when you press **Approve & SEND this email**
   on that exact text, once.

## What each part costs (summary)

| Part | Cost |
|---|---|
| Node.js, the engine, sending by hand | Free |
| Brave Search | $5 per 1,000 searches, with $5 free each month |
| Anthropic API (only for `leads:run`) | Pay as you go; set your own limit |
| Sending domain | About $10–20 a year |
| Amazon SES (optional) | $0.10 per 1,000 emails |
| Business mailbox for replies (if you don't have one) | About $7+ per user a month |
