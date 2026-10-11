/**
 * THE APPROVAL PAGE.
 *
 *   npm run leads:approve      then open the link it prints
 *
 * A small web page on the user's own computer (127.0.0.1 only), showing
 * each waiting lead with its signal (the quote and where it was seen), its
 * scores, its fit notes (each marked MEASURED or INFERRED), the contact and
 * where it was found, and the draft email. Buttons: Approve & send,
 * Approve (no email), Reject (with a reason the finder learns from), Never
 * contact, and later Replied / Not interested.
 *
 * SAFETY:
 *   - listens on 127.0.0.1 only: nothing else on the network can reach it;
 *   - every page and every button needs the secret token in the link it
 *     prints, so another website open in the same browser cannot press a
 *     button for the user (and the Host header must be ours: DNS rebinding);
 *   - buttons are POST only; nothing changes on a GET;
 *   - a strict Content-Security-Policy: no scripts at all;
 *   - this is the only program that reads the sending settings and can send.
 */
import http from "http";
import path from "path";
import { spawn } from "child_process";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";
import type BetterSqlite3 from "better-sqlite3";
import { loadLeadConfig, countryRefusal, type LeadConfig } from "./config.js";
import { fitNotesOf, listLeads, openLeadsDb, totalScore, type Lead } from "./db.js";
import { scorecard, todayCents } from "./budget.js";
import {
  addNoContact, approveAndSend, approveOnly, draftVersion, editDraft, markNotInterested, markReplied, markSentByHand, reject, Refused,
} from "./approval.js";
import { chooseSender, loadMailConfig, type MailConfig, type Sender } from "./mailer.js";

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
/** Only http(s) links are made clickable. */
function link(url: string | null): string {
  if (!url) return "";
  return /^https?:\/\//i.test(url)
    ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>` : esc(url);
}

export interface ServerDeps {
  db: BetterSqlite3.Database;
  cfg: LeadConfig;
  mail: MailConfig | null;
  sender: Sender;
  modeNote: string;
  token: string;
}

function leadCard(deps: ServerDeps, l: Lead, t: string): string {
  const form = (action: string, label: string, extra = "", cls = "") =>
    `<form method="post" action="/${action}?t=${t}" style="display:inline"><input type="hidden" name="id" value="${l.id}">${extra}<button class="${cls}">${label}</button></form>`;
  const blocked = l.channel === "email" ? countryRefusal(deps.cfg, l) : null;
  return `
    <section class="lead">
      <h2>#${l.id} ${esc(l.company)} <small>${esc(l.signal_type)} · ${esc(l.channel)}${l.country ? ` · ${esc(l.country)}` : ""} · score ${l.score_fit}+${l.score_timing}+${l.score_reach} = ${totalScore(l)}/10</small></h2>
      <p><b>Signal:</b> “${esc(l.signal_quote)}”<br><small>seen at ${link(l.signal_url)}${l.signal_date ? ` · dated ${esc(l.signal_date)}` : " · no date shown"}</small></p>
      <ul class="notes">${fitNotesOf(l).map((n) => `<li><span class="tag ${n.basis === "measured" ? "m" : "i"}">${esc(n.basis.toUpperCase())}</span> ${esc(n.note)}${n.source_url ? ` <small>(${link(n.source_url)})</small>` : ""}</li>`).join("") || "<li><i>no fit notes</i></li>"}</ul>
      <p><b>Contact:</b> ${esc([l.contact_name, l.contact_role].filter(Boolean).join(", ")) || "<i>no named contact</i>"}${l.contact_email ? ` · ${esc(l.contact_email)}` : ""}${l.contact_phone ? ` · tel ${esc(l.contact_phone)}` : ""}${l.contact_source_url ? `<br><small>found at ${link(l.contact_source_url)}</small>` : ""}${l.website ? `<br><b>Website:</b> ${esc(l.website)}` : ""}</p>
      ${blocked ? `<p class="warn">${esc(blocked)}</p>` : ""}
      ${l.status === "drafted" && l.draft_body ? `
      <form method="post" action="/edit?t=${t}">
        <input type="hidden" name="id" value="${l.id}">
        <input type="hidden" name="version" value="${draftVersion(l.draft_subject, l.draft_body)}">
        <label>Subject <input name="subject" value="${esc(l.draft_subject)}" size="70"></label><br>
        <textarea name="body" rows="9" cols="90">${esc(l.draft_body)}</textarea><br>
        <small>Your name, business, postal address and an opt-out line are added below this text automatically.</small><br>
        <button>Save my edits</button>
        <button class="go" formaction="/send?t=${t}">${deps.sender.mode === "ses" ? "Approve &amp; SEND this email (Amazon SES)"
          : deps.sender.mode === "by_hand" ? "Approve: write it to the outbox for me to send"
          : "Approve (practice: outbox only, never sent)"}</button>
      </form>` : (l.channel === "email" ? "<p><i>No draft yet.</i></p>" : `<p><i>${esc(l.channel)} lead: you make this contact yourself.</i></p>`)}
      <p>
        ${form("approve", "Approve (no email)")}
        ${form("reject", "Reject", '<input name="note" placeholder="why (the finder learns from this)" size="40">', "no")}
        ${l.contact_email ? form("nocontact", "Never contact", `<input type="hidden" name="value" value="${esc(l.contact_email)}">`, "no") : ""}
      </p>
    </section>`;
}

function page(deps: ServerDeps, message: string): string {
  const { db, token } = deps;
  const s = scorecard(db);
  const today = todayCents(db);
  const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
  const t = esc(token);
  const waiting = [...listLeads(db, "drafted"), ...listLeads(db, "new")].map((l) => leadCard(deps, l, t)).join("")
    || "<p>No leads waiting.</p>";
  const small = (l: Lead, action: string, label: string, cls = "") =>
    `<form method="post" action="/${action}?t=${t}" style="display:inline"><input type="hidden" name="id" value="${l.id}"><button class="${cls}">${label}</button></form>`;
  const modeOf = (id: number) => (db.prepare("SELECT mode FROM sends WHERE lead_id = ?").get(id) as { mode: string } | undefined)?.mode;
  const done = listLeads(db, undefined, 200).filter((l) => ["approved", "sent", "send_failed"].includes(l.status)).map((l) => {
    const byHand = l.status === "approved" && modeOf(l.id) === "by_hand";
    return `<li>#${l.id} ${esc(l.company)} (${esc(l.channel)}) -- ${esc(byHand ? "approved: in the outbox, waiting for you to send it" : l.status)} `
      + (byHand ? small(l, "sentbyhand", "I sent it", "go") + " " : "")
      + `${small(l, "replied", "Replied, interested")} ${small(l, "notinterested", "Said no (never contact)", "no")}</li>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lead Scout approvals</title><style>
body{font:15px/1.5 system-ui,sans-serif;max-width:980px;margin:24px auto;padding:0 16px;color:#0d1320;background:#eef1f5}
.lead{background:#fff;border:1px solid #c2cbd7;border-radius:8px;padding:14px 18px;margin:14px 0}
h2{font-size:18px;margin:0 0 6px} small{color:#566377;font-weight:400}
button{margin:4px 6px 4px 0;padding:6px 12px;border-radius:6px;border:1px solid #c2cbd7;background:#fff;cursor:pointer}
button.go{background:#1f45d6;color:#fff;border-color:#1f45d6} button.no{color:#b9261b}
.banner{padding:10px 14px;background:#dde4fb;border-radius:6px} .msg{padding:10px 14px;background:#fff;border-left:3px solid #1f45d6}
.warn{padding:8px 12px;background:#fde8e6;border-radius:6px;color:#7a1d14}
textarea,input{font:14px/1.4 system-ui,sans-serif;max-width:100%}
.score{padding:8px 14px;background:#fff;border:1px solid #c2cbd7;border-radius:6px}
.notes{margin:4px 0 8px} .tag{font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px}
.tag.m{background:#dff3e4;color:#145c2a} .tag.i{background:#fdf0d5;color:#7a4b00}
</style></head><body>
<h1>Lead Scout: leads to approve</h1>
<p class="banner"><b>${esc(deps.modeNote)}</b></p>
<p class="score"><b>Budget</b> · today: allowance ${usd(today.allowanceCents)}, spent ${usd(today.spentCents)}, earned ${usd(today.earnedCents)} · balance ${usd(s.balanceCents)} (cap ${usd(deps.cfg.budget.maxBalanceCents)}) · ${s.found} found · ${s.waiting} waiting · ${s.approved} approved · ${s.rejected} rejected · ${s.replied} replied</p>
${message ? `<p class="msg">${esc(message)}</p>` : ""}
${waiting}
<h2 style="margin-top:28px">Approved and contacted</h2><ul>${done || "<li>None yet.</li>"}</ul>
<h2>Never contact</h2>
<form method="post" action="/nocontact?t=${t}"><input name="value" placeholder="name@company.com or company.com" size="40">
<input name="reason" placeholder="reason" size="30"><button class="no">Add</button></form>
</body></html>`;
}

async function readForm(req: http.IncomingMessage): Promise<URLSearchParams> {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 64_000) throw new Refused("Too much text.");
  }
  return new URLSearchParams(body);
}

export function createApprovalServer(deps: ServerDeps, port: number): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const host = req.headers.host || "";
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) { res.writeHead(403).end("Wrong host."); return; }
    if (url.searchParams.get("t") !== deps.token) { res.writeHead(403).end("Open the link the approval page printed."); return; }
    const send = (msg = "") => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store",
        "x-frame-options": "DENY", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'" });
      res.end(page(deps, msg));
    };
    if (req.method === "GET" && url.pathname === "/") { send(); return; }
    if (req.method !== "POST") { res.writeHead(405).end(); return; }
    let message = "";
    try {
      const form = await readForm(req);
      const id = Number(form.get("id"));
      switch (url.pathname) {
        case "/send": {
          // Sends EXACTLY the subject and body on screen, and only if the
          // draft the page was drawn with is still the stored one.
          if (!form.has("version")) throw new Refused("Send from the draft's own buttons, so what you read is what is sent.");
          const onScreen = { subject: form.get("subject") || "", body: (form.get("body") || "").replace(/\r\n/g, "\n"), version: form.get("version") || "" };
          const r = await approveAndSend(deps.db, deps.cfg, deps.mail, deps.sender, id, form.get("note") || "", onScreen);
          message = r.status === "sent" ? `Lead #${id}: email sent.`
            : r.status === "by_hand" ? `Lead #${id}: approved. The final email is in the outbox folder (my-company/outbox). Send it from your own mailbox, then click "I sent it" below.`
            : r.status === "practice" ? `Lead #${id}: approved; email written to the outbox (practice mode, NOT sent).`
            : `Lead #${id}: approved, but the email service refused it (${r.error}). It was not retried.`;
          break;
        }
        case "/approve": approveOnly(deps.db, deps.cfg, id, form.get("note") || ""); message = `Lead #${id} approved.`; break;
        case "/reject": reject(deps.db, id, form.get("note") || ""); message = `Lead #${id} rejected.`; break;
        case "/replied": markReplied(deps.db, deps.cfg, id); message = `Lead #${id} marked as replied.`; break;
        case "/notinterested": markNotInterested(deps.db, id); message = `Lead #${id} closed and added to the do-not-contact list.`; break;
        case "/edit": {
          // Saves only over the draft that was on screen (never a newer one unseen).
          if (!form.has("version")) throw new Refused("Edit from the draft's own form.");
          editDraft(deps.db, id, form.get("subject") || "", (form.get("body") || "").replace(/\r\n/g, "\n"), form.get("version") || "");
          message = `Draft for lead #${id} saved.`;
          break;
        }
        case "/sentbyhand": markSentByHand(deps.db, id); message = `Lead #${id} recorded as sent.`; break;
        case "/nocontact": addNoContact(deps.db, form.get("value") || "", form.get("reason") || ""); message = "Added to the do-not-contact list."; break;
        default: res.writeHead(404).end(); return;
      }
    } catch (err) {
      message = err instanceof Refused ? `Not done: ${err.message}` : `Something went wrong: ${(err as Error).message}`;
    }
    send(message);
  });
}

/** The program that opens a web address in the user's browser. */
export function openCommand(platform: NodeJS.Platform, url: string): { cmd: string; args: string[] } {
  if (platform === "win32") return { cmd: "cmd", args: ["/c", "start", "", url] };
  if (platform === "darwin") return { cmd: "open", args: [url] };
  return { cmd: "xdg-open", args: [url] };
}

/**
 * What the page prints when it starts. The secret link (with its token) is
 * printed ONLY to a person's own terminal window. When the output is not a
 * terminal (for example when Claude runs the command and reads its output),
 * the token is never printed: the page opens in the browser instead, so the
 * finder can never hold the key to the approval buttons.
 */
export function startupLines(isTTY: boolean, note: string, url: string): string[] {
  return isTTY
    ? [note, `Opening the approval page in your browser. If it does not open, paste this link into your browser: ${url}`]
    : [note, "The approval page has opened in your browser. (Its secret link is only shown when you run this in your own terminal.)"];
}

/** The command-line entry: npm run leads:approve */
export function main(port = Number(process.env.LEADS_APPROVE_PORT || 8790)): void {
  const cfg = loadLeadConfig();
  const db = openLeadsDb(cfg.dbPath);
  let loaded: MailConfig | null = null;
  try { loaded = loadMailConfig(); } catch { loaded = null; }
  const { sender, mail, note } = chooseSender(loaded);
  const token = randomBytes(18).toString("base64url");
  const url = `http://127.0.0.1:${port}/?t=${token}`;
  createApprovalServer({ db, cfg, mail, sender, modeNote: note, token }, port).listen(port, "127.0.0.1", () => {
    for (const line of startupLines(!!process.stdout.isTTY, note, url)) console.log(line);
    try {
      const { cmd, args } = openCommand(process.platform, url);
      spawn(cmd, args, { stdio: "ignore", detached: true, windowsHide: true }).on("error", () => { /* no browser: the TTY line has the link */ }).unref();
    } catch { /* as above */ }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
