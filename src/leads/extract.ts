/**
 * FINDING EMAIL ADDRESSES AND PHONE NUMBERS IN TEXT, the same way
 * everywhere: for what the finder was shown (tools.ts SeenText) and for
 * the user's do-not-contact.md (db.ts).
 *
 * WHOLE VALUES ONLY. An address is the whole run of address characters:
 * "sales@acme.com.au" is one address, and it never "contains"
 * sales@acme.com. A phone number is compared as its digits, whole number
 * to whole number.
 */

/** An email address, as a whole token (not preceded by an address character). */
const EMAIL_IN_TEXT = /(?<![a-z0-9._%+-])[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?![a-z0-9-])/gi;

/** A search snippet cut short: "sales@acme.com…" or "sales@acme.co...". */
const ELLIPSIS_AFTER = /^(?:…|\.\.)/;

/**
 * Every whole email address in the text, lower case. With
 * `dropTruncated`, an address followed straight away by an ellipsis is
 * left out: the snippet may have cut it short, so it was not shown whole.
 */
export function emailsIn(text: string, opts: { dropTruncated?: boolean } = {}): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(EMAIL_IN_TEXT)) {
    // The match always ends in letters (a full stop after it ends the
    // sentence, not the address); an ellipsis after it means "cut off".
    const after = text.slice(m.index! + m[0].length);
    if (opts.dropTruncated && ELLIPSIS_AFTER.test(after)) continue;
    out.push(m[0].toLowerCase());
  }
  return out;
}

/** Something that looks like a phone number: 7 to 15 digits with the usual separators. */
const PHONE_IN_TEXT = /\+?\(?\d[\d\s().-]{5,}\d/g;

/** "+1 (512) 555-0142" -> "15125550142"; null if not 7-15 digits. */
export function phoneDigits(s: string): string | null {
  const d = String(s ?? "").replace(/\D/g, "");
  return d.length >= 7 && d.length <= 15 ? d : null;
}

/** Every phone-like number in the text, as digits. */
export function phonesIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(PHONE_IN_TEXT)) {
    const d = phoneDigits(m[0]);
    if (d) out.push(d);
  }
  return out;
}

/**
 * Two phone numbers are the same line when their digits match, or when
 * one is the other with a country code in front (5125550142 and
 * 15125550142). Only used to BLOCK (do-not-contact), never to accept.
 */
export function samePhone(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  return short.length >= 7 && long.length - short.length <= 3 && long.endsWith(short);
}
