/**
 * THE ONLY DOOR TO THE WEB: forbidden site families, https only, no
 * private addresses, no xn-- names, robots.txt obeyed, polite, bounded.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  checkUrl, FetchRefused, isForbiddenSite, isPrivateAddress,
  parseRobots, robotsAllows, safeFetch, _resetFetchState, htmlToText,
} from "../../leads/fetch-guard.js";

describe("sites whose terms forbid automated reading are refused, as whole families", () => {
  it.each([
    // LinkedIn, Reddit, X and other social networks.
    "linkedin.com", "www.linkedin.com", "uk.linkedin.com", "lnkd.in", "linkedin.cn",
    "reddit.com", "www.reddit.com", "old.reddit.com", "redd.it",
    "twitter.com", "x.com", "t.co", "tiktok.com", "pinterest.com", "www.pinterest.co.uk", "pin.it",
    "youtube.com", "youtu.be", "snapchat.com", "upwork.com", "fiverr.com",
    // Meta.
    "facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "fb.me", "l.facebook.com", "instagram.com",
    "www.instagram.com", "threads.net", "www.threads.com", "m.me", "wa.me", "fb.watch", "ig.me",
    // Google Maps and Business Profiles, every country, and its short links.
    "maps.google.com", "www.google.com", "google.com", "google.co.uk", "maps.google.co.uk", "www.google.com.au",
    "business.google.com", "goo.gl", "maps.app.goo.gl", "g.page", "g.co", "goo.gle", "share.google",
    "acme.business.site", "maps.googleapis.com",
    // Yelp, every country.
    "yelp.com", "www.yelp.com", "m.yelp.com", "yelp.co.uk", "www.yelp.ca", "yelp.com.au", "yelp.to",
    // Review sites and directories.
    "nextdoor.com", "tripadvisor.com", "www.tripadvisor.co.uk", "thumbtack.com", "angi.com", "homeadvisor.com",
    "yellowpages.com", "yp.com", "bbb.org", "superpages.com", "dexknows.com",
    // Amazon's shopping sites.
    "amazon.com", "www.amazon.co.uk", "amazon.de", "amzn.to", "a.co", "m.media-amazon.com",
  ])("%s is refused", (host) => {
    expect(isForbiddenSite(host)).toBe(true);
    expect(() => checkUrl(`https://${host}/anything`)).toThrow(FetchRefused);
  });
  it.each(["yelpreviews-example.com", "googleish.example.com", "facebookless.example.com", "bbbarber.com",
    "redditbrand.com", "mylinkedinguide.example.com", "acme.com"])("%s (only a lookalike) is not refused", (host) => {
    expect(isForbiddenSite(host)).toBe(false);
  });
  it("Google's map pages are refused by path too", () => {
    expect(() => checkUrl("https://www.google.com/maps/place/Acme")).toThrow(/does not allow/);
  });
  it("a redirect from a company's site to LinkedIn is refused at the redirect", async () => {
    _resetFetchState();
    const transport = async (url: URL) => url.pathname === "/robots.txt"
      ? { status: 404, headers: {}, body: "" }
      : { status: 302, headers: { location: "https://www.linkedin.com/company/acme" }, body: "" };
    await expect(safeFetch("https://acme.example.com/", { userAgent: "T/1", transport, sleep: async () => {} }))
      .rejects.toThrow(/does not allow/);
  });
});

it("internationalised (xn--) names are refused", () => {
  expect(() => checkUrl("https://xn--lnkedin-3ve.com/")).toThrow(FetchRefused);
  expect(() => checkUrl("https://www.xn--80ak6aa92e.com/")).toThrow(/Internationalised/);
});

describe("other refusals", () => {
  it("http, odd ports, logins, IPs and local names", () => {
    for (const u of ["http://acme.com/", "https://acme.com:8443/", "https://u:p@acme.com/",
      "https://127.0.0.1/", "https://10.0.0.5/", "https://[::1]/", "https://localhost/", "https://intranet/", "ftp://acme.com/"]) {
      expect(() => checkUrl(u), u).toThrow(FetchRefused);
    }
    expect(checkUrl("https://acme.com/contact").hostname).toBe("acme.com");
  });
  it("private addresses, IPv4 and IPv6 (including IPv4 hidden in IPv6)", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0",
      "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1", "::ffff:7f00:1", "fec0::1", "64:ff9b::a9fe:a9fe", "::127.0.0.1", "::"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ["8.8.8.8", "93.184.216.34", "2606:4700::1111"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });
  it("a page bigger than the limit is cut off and says so", async () => {
    _resetFetchState();
    const transport = async (url: URL) => url.pathname === "/robots.txt"
      ? { status: 404, headers: {}, body: "" } : { status: 200, headers: { "content-type": "text/html" }, body: "x", truncated: true };
    const r = await safeFetch("https://big.example.com/", { userAgent: "T/1", transport, sleep: async () => {} });
    expect(r.truncated).toBe(true);
  });
  it("more than three redirects are refused", async () => {
    _resetFetchState();
    let n = 0;
    const transport = async (url: URL) => url.pathname === "/robots.txt"
      ? { status: 404, headers: {}, body: "" } : { status: 302, headers: { location: `https://loop.example.com/${++n}` }, body: "" };
    await expect(safeFetch("https://loop.example.com/", { userAgent: "T/1", transport, sleep: async () => {} }))
      .rejects.toThrow(/Too many redirects/);
  });
});

describe("robots.txt", () => {
  beforeEach(() => _resetFetchState());
  it("is parsed and obeyed", () => {
    const rules = parseRobots("User-agent: *\nDisallow: /private\nAllow: /private/ok\n\nUser-agent: OtherBot\nDisallow: /", "LeadScout");
    expect(robotsAllows(rules, "/contact")).toBe(true);
    expect(robotsAllows(rules, "/private/x")).toBe(false);
    expect(robotsAllows(rules, "/private/ok")).toBe(true);
  });
  it("a group for our own robot name wins over *", () => {
    const rules = parseRobots("User-agent: LeadScout\nDisallow: /\n\nUser-agent: *\nAllow: /", "LeadScout");
    expect(robotsAllows(rules, "/x")).toBe(false);
  });
  it("a closed page is refused before it is requested", async () => {
    const asked: string[] = [];
    const transport = async (url: URL) => {
      asked.push(url.pathname);
      if (url.pathname === "/robots.txt") return { status: 200, headers: {}, body: "User-agent: *\nDisallow: /" };
      return { status: 200, headers: { "content-type": "text/html" }, body: "secret" };
    };
    await expect(safeFetch("https://closed.example.com/contact", { userAgent: "T/1", transport, sleep: async () => {} }))
      .rejects.toThrow(/robots/);
    expect(asked).toEqual(["/robots.txt"]);
  });
  it("a robots.txt that answers 5xx means keep out (RFC 9309)", async () => {
    const transport = async (url: URL) => url.pathname === "/robots.txt"
      ? { status: 503, headers: {}, body: "" } : { status: 200, headers: {}, body: "x" };
    await expect(safeFetch("https://busy.example.com/", { userAgent: "T/1", transport, sleep: async () => {} }))
      .rejects.toThrow(/robots/);
  });
  it("a redirected robots.txt is followed", async () => {
    const transport = async (url: URL) => {
      if (url.host === "redir.example.com" && url.pathname === "/robots.txt") return { status: 301, headers: { location: "https://www.redir.example.com/robots.txt" }, body: "" };
      if (url.pathname === "/robots.txt") return { status: 200, headers: {}, body: "User-agent: *\nDisallow: /" };
      return { status: 200, headers: {}, body: "x" };
    };
    await expect(safeFetch("https://redir.example.com/contact", { userAgent: "T/1", transport, sleep: async () => {} }))
      .rejects.toThrow(/robots/);
  });
  it("a group for another robot whose name is part of ours does not apply", () => {
    const rules = parseRobots("User-agent: lead\nAllow: /\n\nUser-agent: *\nDisallow: /", "LeadScout");
    expect(robotsAllows(rules, "/x")).toBe(false);
  });
  it("an unreachable robots.txt means keep out", async () => {
    const transport = async (url: URL) => {
      if (url.pathname === "/robots.txt") throw new Error("down");
      return { status: 200, headers: {}, body: "x" };
    };
    await expect(safeFetch("https://down.example.com/", { userAgent: "T/1", transport, sleep: async () => {} }))
      .rejects.toThrow(/robots/);
  });
  it("is polite: waits between requests to the same site", async () => {
    const waits: number[] = [];
    const transport = async (url: URL) => url.pathname === "/robots.txt"
      ? { status: 404, headers: {}, body: "" } : { status: 200, headers: {}, body: "ok" };
    await safeFetch("https://polite.example.com/a", { userAgent: "T/1", transport, sleep: async (ms) => { waits.push(ms); } });
    expect(waits.length).toBeGreaterThan(0);
    expect(Math.max(...waits)).toBeGreaterThan(2000);
  });
});

it("html becomes text and keeps mailto addresses", () => {
  const t = htmlToText('<p>Hi</p><script>evil()</script><a href="mailto:sales@acme.com">Email us</a>');
  expect(t).toContain("sales@acme.com");
  expect(t).not.toContain("evil");
});
