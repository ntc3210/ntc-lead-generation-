# my-company/: your private folder

Lead Scout keeps everything it learns about **your** company here:

- `profile.md`: what you sell, who buys it, and your rules
- `leads.md`: the leads it found, each with its evidence
- `lessons.md`: what worked and what didn't, so it gets better for you
- `do-not-contact.md`: anyone who said no. They are never contacted again.
  One entry per line: an email address, a phone number, or a whole
  company's domain, with a note if you like:
  `- jane@acme.com (said no, 3 Oct)`, `- acme.com (whole company)`,
  `- +1 512 555 0142 (front desk said no)`. Every email address and phone
  number on every line counts, and a domain counts when it is the first
  word on its line. Never delete an entry.

If you set up the optional engine (`guide/engine-setup.md`), it also keeps
here: `engine.json` (its settings and your search key), `leads.db` (the
lead database), `outbox/` (each approved email, ready for you to send
from your own mailbox), and `manual-session.json` with its signing key
`manual-session.key`.

**This folder is private.** It is never sent to the toolkit's author.
Everything in it except this note is excluded from git, so pushing the
project to GitHub leaves it behind.

**But** if you zip, copy or upload the whole toolkit folder some other way
(email, Dropbox, Google Drive, GitHub's "Upload files" button), this
folder goes with it. Delete it from the copy first. To back it up, copy
it somewhere safe that only you can see.
