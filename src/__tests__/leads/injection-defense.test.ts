/** Text from the web cannot pose as instructions (from Automaton, kept). */
import { expect, it } from "vitest";
import { sanitizeToolResult } from "../../leads/injection-defense.js";

/** Built from char codes so the source file holds no invisible characters. */
const ZWSP = String.fromCharCode(0x200b);
const ZWNJ = String.fromCharCode(0x200c);
const BOM = String.fromCharCode(0xfeff);
const NUL = String.fromCharCode(0);

it("prompt boundaries and chat markers are defused, and long text is cut", () => {
  const out = sanitizeToolResult(`a <system>x</system> [INST] b <<SYS>> <|im_start|> c${ZWSP}${ZWNJ}${BOM}${NUL}d`);
  expect(out).not.toMatch(/<system>|\[INST\]|<<SYS>>|<\|im_start\|>/);
  for (const c of [ZWSP, ZWNJ, BOM, NUL]) expect(out).not.toContain(c);
  expect(out).toContain("cd");
  expect(out).toContain("[system-tag-removed]");
  expect(sanitizeToolResult("x".repeat(50), 10)).toMatch(/TRUNCATED/);
  expect(sanitizeToolResult("")).toBe("");
});
