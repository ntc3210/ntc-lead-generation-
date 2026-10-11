/**
 * WEB SEARCH, through Brave Search's official API.
 *
 * Why an API and not scraping a search engine: Google and Bing forbid
 * automated scraping of their results; Brave sells this access (about $5
 * per 1,000 searches, with $5 of free credit a month: check
 * https://brave.com/search/api/ for today's price).
 *
 * LinkedIn, Reddit, Google Maps, Yelp, Facebook and other sites the finder
 * may not open are found HERE, as search results (title, link, snippet).
 * The finder never opens those sites (fetch-guard.ts refuses them); the
 * snippet is all it uses.
 *
 * Plain http:// results are kept as results (an old site is still a
 * company), but nothing is ever read over http: fetch-guard reads https
 * only.
 */
export interface SearchHit {
  title: string; url: string; snippet: string;
  /** The page's date as the search engine knows it (ISO), when it gives one. */
  age?: string;
}

/** How recent results must be: past day, week, month or year. A buying
 * signal goes stale (guide/lead-signals.md), so recent is usually better. */
export type Freshness = "pd" | "pw" | "pm" | "py";
export const FRESHNESS: Freshness[] = ["pd", "pw", "pm", "py"];

export interface SearchDeps {
  apiKey: string;
  /** Test hook in place of the network. */
  fetchImpl?: typeof fetch;
}

export async function braveSearch(query: string, deps: SearchDeps, count = 10, freshness?: Freshness): Promise<SearchHit[]> {
  if (!deps.apiKey) throw new Error("No Brave Search key is set (engine.json \"braveApiKey\").");
  const q = query.trim().slice(0, 300);
  if (!q) return [];
  const url = "https://api.search.brave.com/res/v1/web/search?count=" + Math.min(20, Math.max(1, count))
    + "&q=" + encodeURIComponent(q)
    + (freshness && FRESHNESS.includes(freshness) ? "&freshness=" + freshness : "");
  const doFetch = deps.fetchImpl ?? fetch;
  const res = await doFetch(url, {
    headers: { Accept: "application/json", "X-Subscription-Token": deps.apiKey },
  });
  if (!res.ok) throw new Error(`Search failed (${res.status}).`);
  const data = (await res.json()) as { web?: { results?: { title?: string; url?: string; description?: string; page_age?: string }[] } };
  return (data.web?.results ?? []).map((r) => ({
    title: stripTags(r.title ?? ""),
    url: r.url ?? "",
    snippet: stripTags(r.description ?? ""),
    ...(r.page_age && /^\d{4}-\d{2}-\d{2}/.test(r.page_age) ? { age: r.page_age.slice(0, 10) } : {}),
  })).filter((h) => h.url.startsWith("https://") || h.url.startsWith("http://"));
}

function stripTags(s: string): string {
  // Brave sends apostrophes as &#x27; too; a quote copied from a snippet
  // must read as the words did.
  return s.replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").trim();
}
