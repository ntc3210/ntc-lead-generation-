/** SEARCH RESULTS: Brave's answer read correctly, recent-only on request. */
import { describe, expect, it } from "vitest";
import { braveSearch } from "../../leads/search.js";

describe("braveSearch (fake network: no paid calls)", () => {
  it("refuses to run without a key", async () => {
    await expect(braveSearch("q", { apiKey: "" })).rejects.toThrow(/No Brave Search key/);
  });
  it("sends the key as a header, never in the address", async () => {
    let asked = "", headers: Record<string, string> = {};
    const fetchImpl = (async (u: string, init: { headers: Record<string, string> }) => {
      asked = u; headers = init.headers;
      return new Response(JSON.stringify({ web: { results: [] } }));
    }) as unknown as typeof fetch;
    await braveSearch("clinic scheduling", { apiKey: "SECRET", fetchImpl });
    expect(asked).not.toContain("SECRET");
    expect(headers["X-Subscription-Token"]).toBe("SECRET");
  });
  it("a snippet's &#x27; reads as an apostrophe", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ web: { results: [
      { title: "Dana&#x27;s clinic", url: "https://example.com/a", description: "it&#39;s &amp;quot; open &lt;b&gt;late" },
    ] } }))) as unknown as typeof fetch;
    const [hit] = await braveSearch("q", { apiKey: "k", fetchImpl });
    expect(hit.title).toBe("Dana's clinic");
    expect(hit.snippet).toBe("it's &quot; open <b>late");
  });
  it("can ask for recent results only, and keeps the page date", async () => {
    let asked = "";
    const fetchImpl = (async (u: string) => { asked = u; return new Response(JSON.stringify({ web: { results: [
      { title: "t", url: "https://acme.example.com/", description: "d", page_age: "2026-10-02T10:00:00" },
    ] } })); }) as unknown as typeof fetch;
    const [hit] = await braveSearch("q", { apiKey: "k", fetchImpl }, 10, "pm");
    expect(asked).toContain("&freshness=pm");
    expect(hit.age).toBe("2026-10-02");
    await braveSearch("q", { apiKey: "k", fetchImpl }, 10, "bogus" as never);
    expect(asked).not.toContain("freshness");
  });
  it("keeps http and https results, drops anything else", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ web: { results: [
      { title: "old", url: "http://old.example.com/", description: "d" },
      { title: "ftp", url: "ftp://x.example.com/", description: "d" },
      { title: "js", url: "javascript:alert(1)", description: "d" },
    ] } }))) as unknown as typeof fetch;
    expect((await braveSearch("q", { apiKey: "k", fetchImpl })).map((h) => h.url)).toEqual(["http://old.example.com/"]);
  });
});
