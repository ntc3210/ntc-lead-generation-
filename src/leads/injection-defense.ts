/**
 * PROMPT-INJECTION DEFENCE FOR TEXT FROM THE WEB.
 *
 * Copied from Automaton by Conway Research (MIT licence),
 * src/agent/injection-defense.ts at commit d8f8168: the functions
 * sanitizeToolResult, escapePromptBoundaries and stripChatMLMarkers, word
 * for word. The rest of that file (rate limits, social-message checks)
 * belonged to Automaton's agent and is not used by Lead Scout, so only
 * these three were kept. See CREDITS.md.
 *
 * What it does: text from a web page or a search result could contain
 * fake "system" markers that try to make the model treat it as
 * instructions. These are replaced with harmless placeholders, and very
 * long text is cut, before the model ever sees it. tools.ts then wraps
 * the result in an UNTRUSTED marker as well.
 */

const DEFAULT_TOOL_RESULT_MAX_LENGTH = 50_000;
const SANITIZED_PLACEHOLDER = "[SANITIZED: content removed]";

/**
 * Sanitize tool results from external sources. Strips prompt
 * boundaries and limits size.
 */
export function sanitizeToolResult(
  result: string,
  maxLength: number = DEFAULT_TOOL_RESULT_MAX_LENGTH,
): string {
  if (!result) return "";

  let cleaned = escapePromptBoundaries(result);
  cleaned = stripChatMLMarkers(cleaned);

  if (cleaned.length > maxLength) {
    cleaned =
      cleaned.slice(0, maxLength) +
      `\n[TRUNCATED: result exceeded ${maxLength} bytes]`;
  }

  return cleaned || SANITIZED_PLACEHOLDER;
}

function escapePromptBoundaries(text: string): string {
  return text
    .replace(/<\/?system>/gi, "[system-tag-removed]")
    .replace(/<\/?prompt>/gi, "[prompt-tag-removed]")
    .replace(/\[INST\]/gi, "[inst-tag-removed]")
    .replace(/\[\/INST\]/gi, "[inst-tag-removed]")
    .replace(/<<SYS>>/gi, "[sys-tag-removed]")
    .replace(/<<\/SYS>>/gi, "[sys-tag-removed]")
    .replace(/\x00/g, "")
    .replace(/\u200b/g, "")
    .replace(/\u200c/g, "")
    .replace(/\u200d/g, "")
    .replace(/\ufeff/g, "");
}

function stripChatMLMarkers(text: string): string {
  return text
    .replace(/<\|im_start\|>/gi, "[chatml-removed]")
    .replace(/<\|im_end\|>/gi, "[chatml-removed]")
    .replace(/<\|endoftext\|>/gi, "[chatml-removed]");
}
