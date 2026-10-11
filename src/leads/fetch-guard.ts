/**
 * THE ONLY DOOR TO THE WEB.
 *
 * Every page the finder reads goes through safeFetch(). Each rule is
 * enforced here, in code, before a single byte is requested:
 *
 *  1. NOT SITES WHOSE TERMS FORBID AUTOMATED READING, each as a whole family
 *     of the company's domains: LinkedIn, Facebook, Instagram, Threads and
 *     the rest of Meta; X/Twitter; Reddit; Google (Maps, Business Profiles,
 *     its short links, every google.<country>); Yelp in every country;
 *     TikTok, Pinterest, YouTube, Snapchat; Upwork and Fiverr; Nextdoor,
 *     TripAdvisor, Thumbtack, Angi/HomeAdvisor, Yellow Pages and the BBB;
 *     and Amazon's shopping sites. What a SEARCH RESULT already shows about
 *     them (its title and snippet) may be used; opening them may not.
 *  2. HTTPS ONLY, standard port only, no logins in the address.
 *  3. NO PRIVATE OR INTERNAL ADDRESSES (server-side request forgery, IPv4
 *     and IPv6): the host's address is checked as it is connected to, not
 *     just looked up first, so a site cannot switch to an internal address
 *     in between.
 *  4. NO INTERNATIONALISED ("xn--") HOST NAMES: they can spell a familiar
 *     name in look-alike letters.
 *  5. ROBOTS.TXT is read and obeyed for every site, for our user agent
 *     (RFC 9309).
 *  6. POLITE AND BOUNDED: at least 3 seconds between requests to the same
 *     site, at most 3 redirects (each one checked again from rule 1), 15
 *     seconds, 1.5 MB.
 *
 * What comes back is DATA, never instructions: the caller marks it as such
 * before the model sees it.
 */
import https from "https";
import dns from "dns";
import net from "net";
import { URL } from "url";

/**
 * A refusal or a failure to read. `reason` says WHY in a fixed word, so the
 * caller can explain a failure plainly instead of guessing from the message:
 *   FORBIDDEN, NOT_HTTPS, BAD_ADDRESS   refused by our own rules
 *   ROBOTS                              the site's robots.txt says no
 *   PRIVATE                             it points at a private address
 *   TLS        a VERIFIED certificate problem a browser would also show:
 *              expired, not yet valid, self-signed, wrong name, revoked
 *   TLS_OTHER  any other failure to open the secure connection (EPROTO,
 *              a protocol mismatch, an incomplete certificate chain that
 *              browsers often repair themselves ...): it may be our side,
 *              so it is never called a browser warning
 *   NO_DNS     the name does not exist (often an expired domain)
 *   REFUSED    nothing answers on the https port
 *   TIMEOUT    no answer in time
 *   REDIRECTS  too many redirects
 *   OTHER      anything else
 */
export type RefusalReason = "FORBIDDEN" | "NOT_HTTPS" | "BAD_ADDRESS" | "ROBOTS" | "PRIVATE"
  | "TLS" | "TLS_OTHER" | "NO_DNS" | "REFUSED" | "TIMEOUT" | "REDIRECTS" | "OTHER";
export class FetchRefused extends Error {
  constructor(message: string, readonly reason: RefusalReason = "OTHER", readonly detail = "") { super(message); }
}

/**
 * Certificate errors a visitor's browser would show as a warning too.
 * NOT here, on purpose: UNABLE_TO_VERIFY_LEAF_SIGNATURE and
 * UNABLE_TO_GET_ISSUER_CERT(_LOCALLY) usually mean the site left out an
 * intermediate certificate, which browsers fetch for themselves and then
 * show the site normally; our reader does not, so it cannot tell.
 */
const VERIFIED_CERT_ERRORS = new Set([
  "CERT_HAS_EXPIRED", "CERT_NOT_YET_VALID", "DEPTH_ZERO_SELF_SIGNED_CERT", "SELF_SIGNED_CERT_IN_CHAIN",
  "ERR_TLS_CERT_ALTNAME_INVALID", "HOSTNAME_MISMATCH", "CERT_REVOKED", "CERT_UNTRUSTED", "CERT_REJECTED",
]);

/** Node's network error codes, sorted into the reasons above. */
export function reasonForError(err: unknown): { reason: RefusalReason; code: string } {
  const code = String((err as { code?: string })?.code ?? "");
  const msg = String((err as Error)?.message ?? "");
  if (code === "EPRIVATE") return { reason: "PRIVATE", code };
  if (VERIFIED_CERT_ERRORS.has(code)) return { reason: "TLS", code };
  if (/CERT|SELF_SIGNED|UNABLE_TO_VERIFY|UNABLE_TO_GET_ISSUER|ERR_TLS|ERR_SSL|EPROTO|ECONNRESET/i.test(code)) return { reason: "TLS_OTHER", code };
  if (code === "ENOTFOUND") return { reason: "NO_DNS", code };
  if (code === "ECONNREFUSED") return { reason: "REFUSED", code };
  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT" || /timed out/i.test(msg)) return { reason: "TIMEOUT", code: code || "TIMEOUT" };
  return { reason: "OTHER", code };
}

/** Whole domains (and every subdomain of them) that are never read. */
const FORBIDDEN_SITES = [
  // Forums, job boards and social networks.
  "reddit.com", "redd.it", "linkedin.com", "lnkd.in", "upwork.com", "fiverr.com",
  "twitter.com", "x.com", "t.co", "tiktok.com", "pinterest.com", "pin.it", "snapchat.com",
  "youtube.com", "youtu.be", "youtube-nocookie.com", "pinimg.com",
  // Their content and image servers.
  "licdn.com", "redditmedia.com", "redditstatic.com", "twimg.com", "cdninstagram.com",
  // Meta's family: Facebook, Instagram, Threads, Messenger, WhatsApp.
  "facebook.com", "fb.com", "fb.me", "facebook.net", "fbcdn.net", "messenger.com", "m.me", "fb.watch",
  "instagram.com", "instagr.am", "threads.net", "threads.com", "whatsapp.com", "wa.me", "ig.me",
  // Google's map, Business Profile and short-link addresses. Every google.<tld>
  // (maps.google.com, business.google.com, google.co.uk/maps ...) is caught
  // by FORBIDDEN_LABELS below; these do not contain that label.
  "goo.gl", "goo.gle", "g.page", "g.co", "share.google", "business.site", "googleapis.com", "googleusercontent.com",
  // Review sites and directories.
  "yelp.to", "yelpcdn.com", "nextdoor.com", "thumbtack.com", "angi.com", "angieslist.com", "homeadvisor.com",
  "yellowpages.com", "yp.com", "bbb.org", "superpages.com", "dexknows.com", "thryv.com",
  // Amazon's shopping sites, short links and image hosts (its conditions of
  // use forbid robots and data mining). Every amazon.<tld> is caught by
  // FORBIDDEN_LABELS below.
  "amzn.to", "amzn.com", "amzn.eu", "amzn.asia", "a.co", "amzn.in", "amzn.ae", "media-amazon.com", "ssl-images-amazon.com",
];

/**
 * Companies with a domain in many countries (yelp.com, yelp.co.uk, yelp.ca,
 * google.com.au, tripadvisor.fr, amazon.de ...). A host with any LABEL (a
 * part between dots) equal to one of these names is refused, whatever the
 * country ending. Whole labels only: "yelpreviews-example.com" is not Yelp.
 */
const FORBIDDEN_LABELS = ["google", "yelp", "tripadvisor", "nextdoor", "yellowpages", "facebook", "instagram", "pinterest",
  "superpages", "dexknows", "linkedin", "reddit", "amazon"];

/** True for any host in a forbidden family (rule 1). */
export function isForbiddenSite(host: string): boolean {
  const h = host.toLowerCase().replace(/\.+$/, "");
  if (FORBIDDEN_SITES.some((site) => h === site || h.endsWith("." + site))) return true;
  return h.split(".").some((label) => FORBIDDEN_LABELS.includes(label));
}

/** Expand an IPv6 address to eight 16-bit numbers (an embedded IPv4
 * tail like ::ffff:1.2.3.4 becomes the last two). Null if unreadable. */
function ipv6Words(ip: string): number[] | null {
  let s = ip.toLowerCase();
  const tail = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (tail) {
    const p = tail[1].split(".").map(Number);
    s = s.slice(0, -tail[1].length) + ((p[0] << 8) | p[1]).toString(16) + ":" + ((p[2] << 8) | p[3]).toString(16);
  }
  const [head, rest] = s.split("::");
  const a = head ? head.split(":") : [];
  const b = rest !== undefined && rest !== "" ? rest.split(":") : [];
  const fill = s.includes("::") ? 8 - a.length - b.length : 0;
  const words = [...a, ...Array(fill).fill("0"), ...b].map((w) => parseInt(w || "0", 16));
  return words.length === 8 && words.every((w) => Number.isInteger(w) && w >= 0 && w <= 0xffff) ? words : null;
}

/** Loopback, private, link-local, carrier-grade NAT, multicast, reserved --
 * for IPv4, and for IPv6 including IPv4 hidden inside it (mapped,
 * compatible, NAT64) and the old site-local range . */
export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const w = ipv6Words(ip);
    if (!w) return true;
    const v4 = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
    if (w.slice(0, 6).every((x) => x === 0)) return w[6] === 0 && w[7] <= 1 ? true : isPrivateAddress(v4(w[6], w[7]));
    if (w.slice(0, 5).every((x) => x === 0) && w[5] === 0xffff) return isPrivateAddress(v4(w[6], w[7]));
    // 64:ff9b:1::/48 is the LOCAL-use NAT64 range: refused whatever it holds.
    if (w[0] === 0x64 && w[1] === 0xff9b && w[2] === 1) return true;
    if (w[0] === 0x64 && w[1] === 0xff9b) return isPrivateAddress(v4(w[6], w[7]));
    const top = w[0];
    return (top & 0xfe00) === 0xfc00      // fc00::/7 unique local
      || (top & 0xffc0) === 0xfe80        // fe80::/10 link-local
      || (top & 0xffc0) === 0xfec0        // fec0::/10 site-local (old)
      || (top & 0xff00) === 0xff00        // multicast
      || top === 0x2001 && w[1] === 0xdb8 // documentation
      || top === 0x2001 && w[1] === 0     // 2001::/32 Teredo (tunnels to IPv4)
      || top === 0x2002                   // 2002::/16 6to4 (tunnels to IPv4)
      || top === 0x0100;                  // discard
  }
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 192 && b === 0)
      || (a === 198 && (b === 18 || b === 19));
  }
  // Not an address at all: refused, the cautious reading.
  return true;
}

/** The checks on an address before any connection. Throws FetchRefused. */
export function checkUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchRefused("Not a web address.", "BAD_ADDRESS");
  }
  if (url.protocol !== "https:") throw new FetchRefused("Only https:// addresses are read.", "NOT_HTTPS", url.protocol);
  if (url.port && url.port !== "443") throw new FetchRefused("Only the standard https port is used.", "BAD_ADDRESS");
  if (url.username || url.password) throw new FetchRefused("Addresses with a login in them are refused.", "BAD_ADDRESS");
  // "localhost." and "example.com." are the same names as without the dot.
  const host = url.hostname.toLowerCase().replace(/\.+$/, "");
  // Internationalised names could spell a forbidden name in look-alike letters: refused.
  if (host.split(".").some((l) => l.startsWith("xn--"))) throw new FetchRefused("Internationalised site names are not read.", "BAD_ADDRESS");
  if (isForbiddenSite(host)) throw new FetchRefused(`${host} does not allow this kind of reading; use search results instead.`, "FORBIDDEN", host);
  if (net.isIP(host) || host === "localhost" || !host.includes(".")) {
    throw new FetchRefused("Only public websites by name are read.", "BAD_ADDRESS");
  }
  return url;
}

/** A DNS lookup that refuses private addresses AT CONNECT TIME (pinned). */
function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
): void {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 4);
    const list = addresses as dns.LookupAddress[];
    const bad = list.find((a) => isPrivateAddress(a.address));
    if (!list.length || bad) {
      return callback(Object.assign(new Error("private address refused"), { code: "EPRIVATE" }), "", 4);
    }
    if ((options as { all?: boolean }).all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

export interface FetchResult {
  url: string; status: number; contentType: string; body: string;
  /** True when the page was bigger than the size limit and was cut off. */
  truncated?: boolean;
}

/** One request, no redirects followed (safeFetch follows them itself). */
export type Transport = (url: URL, ua: string) =>
  Promise<{ status: number; headers: Record<string, string | undefined>; body: string; truncated?: boolean }>;

export interface FetchOptions {
  userAgent: string;
  timeoutMs?: number;
  maxBytes?: number;
  /** Test hook: replaces the network call. */
  transport?: Transport;
  /** Test hook: replaces the 3-second wait. */
  sleep?: (ms: number) => Promise<void>;
  /**
   * Hosts the caller allows (the finder: only hosts its own searches found).
   * Checked on EVERY request, the first one, every redirect and every
   * robots.txt hop, so a redirect cannot carry the reader to a host of the
   * page's choosing.
   */
  allowHost?: (host: string) => boolean;
}

/** checkUrl, plus the caller's allowed-host rule. */
function checkHop(raw: string, opts: FetchOptions): URL {
  const url = checkUrl(raw);
  if (opts.allowHost && !opts.allowHost(url.hostname)) {
    throw new FetchRefused(`${url.hostname} did not come up in your searches, so it is not read (a redirect cannot change that).`, "FORBIDDEN", url.hostname);
  }
  return url;
}

const lastHit = new Map<string, number>();
const robotsCache = new Map<string, { at: number; disallow: string[]; allow: string[] }>();
const POLITE_GAP_MS = 3000;

function realTransport(timeoutMs: number, maxBytes: number) {
  return (url: URL, ua: string) =>
    new Promise<{ status: number; headers: Record<string, string>; body: string; truncated?: boolean }>((resolve, reject) => {
      const req = https.request(url, {
        method: "GET",
        headers: { "User-Agent": ua, Accept: "text/html,text/plain;q=0.9,*/*;q=0.1" },
        lookup: guardedLookup as unknown as typeof dns.lookup,
        timeout: timeoutMs,
      }, (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > maxBytes) { req.destroy(); return resolve({ status: res.statusCode || 0, headers: flat(res.headers), body: Buffer.concat(chunks).toString("utf-8"), truncated: true }); }
          chunks.push(c);
        });
        res.on("end", () => resolve({ status: res.statusCode || 0, headers: flat(res.headers), body: Buffer.concat(chunks).toString("utf-8") }));
        res.on("error", reject);
      });
      req.on("timeout", () => req.destroy(new Error("timed out")));
      req.on("error", reject);
      req.end();
    });
}

function flat(h: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) if (v !== undefined) out[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : v;
  return out;
}

/** Parse robots.txt for the groups that apply to us ("*" or our agent name). */
export function parseRobots(text: string, agentName: string): { disallow: string[]; allow: string[] } {
  const groups: { agents: string[]; disallow: string[]; allow: string[] }[] = [];
  let cur: { agents: string[]; disallow: string[]; allow: string[] } | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase(), value = m[2].trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) { cur = { agents: [], disallow: [], allow: [] }; groups.push(cur); }
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (cur) {
      lastWasAgent = false;
      if (key === "disallow" && value) cur.disallow.push(value);
      if (key === "allow" && value) cur.allow.push(value);
    }
  }
  // RFC 9309: a group applies when its user-agent IS our product token
  // (case-insensitive), not when it merely appears inside our name.
  const me = agentName.toLowerCase();
  const mine = groups.filter((g) => g.agents.some((a) => a === me));
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  return {
    disallow: chosen.flatMap((g) => g.disallow),
    allow: chosen.flatMap((g) => g.allow),
  };
}

/** Longest matching rule wins; Allow wins a tie. "*" and "$" are honoured. */
export function robotsAllows(rules: { disallow: string[]; allow: string[] }, pathAndQuery: string): boolean {
  const match = (pattern: string) => {
    const re = new RegExp("^" + pattern.replace(/[.+?^${}()|[\]\\]/g, (c) => (c === "$" ? "$" : "\\" + c)).replace(/\*/g, ".*"));
    return re.test(pathAndQuery) ? pattern.length : -1;
  };
  const d = Math.max(-1, ...rules.disallow.map(match));
  const a = Math.max(-1, ...rules.allow.map(match));
  return d < 0 || a >= d;
}

async function politeWait(host: string, sleep: (ms: number) => Promise<void>): Promise<void> {
  const last = lastHit.get(host) || 0;
  const wait = last + POLITE_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
}

async function robotsFor(url: URL, opts: Required<Pick<FetchOptions, "userAgent">> & FetchOptions,
                         transport: NonNullable<FetchOptions["transport"]>, sleep: (ms: number) => Promise<void>) {
  const key = url.host;
  const cached = robotsCache.get(key);
  if (cached && Date.now() - cached.at < 24 * 3600_000) return cached;
  await politeWait(url.host, sleep);
  let rules = { disallow: [] as string[], allow: [] as string[] };
  const KEEP_OUT = { disallow: ["/"], allow: [] as string[] };
  try {
    // RFC 9309: follow up to five redirects (each address checked like any
    // other); 4xx means no rules; 5xx or anything unreadable means keep out.
    let target = new URL("/robots.txt", url.origin);
    let res = await transport(target, opts.userAgent);
    for (let hop = 0; hop < 5 && res.status >= 300 && res.status < 400 && res.headers["location"]; hop++) {
      target = checkHop(new URL(res.headers["location"], target).toString(), opts);
      await politeWait(target.host, sleep);
      res = await transport(target, opts.userAgent);
    }
    if (res.status >= 200 && res.status < 300) {
      rules = parseRobots(res.body, opts.userAgent.split("/")[0]);
    } else if (res.status >= 400 && res.status < 500 && res.status !== 401 && res.status !== 403 && res.status !== 429) {
      rules = { disallow: [], allow: [] };
    } else {
      rules = KEEP_OUT;
    }
  } catch (err) {
    // A failure that says something about the SITE itself (an expired
    // certificate, a domain that no longer exists, a private address) is
    // reported as that, so the caller can say so. Nothing is read
    // either way, and nothing is cached, so the next try asks again.
    if (err instanceof FetchRefused) throw err;
    const { reason, code } = reasonForError(err);
    if (reason !== "OTHER") {
      throw new FetchRefused(`Could not read ${url.host}: ${(err as Error).message}`, reason, code);
    }
    // Anything else unreadable: treated as "keep out", the cautious reading.
    rules = { disallow: ["/"], allow: [] };
  }
  const entry = { at: Date.now(), ...rules };
  robotsCache.set(key, entry);
  return entry;
}

/** Read one public page, under every rule above. Throws FetchRefused. */
export async function safeFetch(raw: string, opts: FetchOptions): Promise<FetchResult> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const maxBytes = opts.maxBytes ?? 1_500_000;
  const transport = opts.transport ?? realTransport(timeoutMs, maxBytes);
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  let url = checkHop(raw, opts);
  for (let hop = 0; hop <= 3; hop++) {
    const robots = await robotsFor(url, opts, transport, sleep);
    if (!robotsAllows(robots, url.pathname + url.search)) {
      throw new FetchRefused(`${url.host} asks robots not to read ${url.pathname}.`, "ROBOTS");
    }
    await politeWait(url.host, sleep);
    let res;
    try {
      res = await transport(url, opts.userAgent);
    } catch (err) {
      const { reason, code } = reasonForError(err);
      if (reason === "PRIVATE") throw new FetchRefused("That site points at a private address.", "PRIVATE");
      throw new FetchRefused(`Could not read ${url.host}: ${(err as Error).message}`, reason, code);
    }
    if (res.status >= 300 && res.status < 400 && res.headers["location"]) {
      // Every hop is checked again: a redirect to a forbidden site is still refused.
      url = checkHop(new URL(res.headers["location"], url).toString(), opts);
      continue;
    }
    return { url: url.toString(), status: res.status, contentType: res.headers["content-type"] || "", body: res.body,
      ...(res.truncated ? { truncated: true } : {}) };
  }
  throw new FetchRefused("Too many redirects.", "REDIRECTS");
}

/** Turn HTML into plain readable text (scripts and styles dropped). Links
 * leave only their words behind; email links leave their address. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<a\b[^>]*href=["']mailto:([^"'?]+)[^>]*>/gi, " $1 ")
    .replace(/<(br|p|div|li|h[1-6]|tr)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#64;|&commat;/g, "@").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** For tests: forget the politeness clock and the robots cache. */
export function _resetFetchState(): void {
  lastHit.clear();
  robotsCache.clear();
}
