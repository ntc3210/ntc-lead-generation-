# Credits

## Built on Automaton, by Conway Research

ntc-lead-scout began as a copy of **Automaton**, an open-source AI agent
runtime:

- **Project:** https://github.com/Conway-Research/automaton
- **By:** Conway Research (https://conway.tech). Original code written
  by Sigil Wen (first commit `d8f8168`, 26 August 2026, kept as the first
  commit of this repository's history).
- **Licence:** MIT. Its copyright notice, "Copyright (c) 2026 Conway",
  is kept word for word in [`LICENSE`](LICENSE), as the MIT licence
  requires.
- **Their original README** is kept at
  [`docs/automaton/README.md`](docs/automaton/README.md).

Thank you to Conway Research for publishing Automaton openly. It made
this toolkit possible.

### What comes from Automaton, and what is new

| Part | Origin |
|---|---|
| The project's base: TypeScript, `tsconfig.json`, `vitest` test setup, the MIT licence | **Automaton** (Conway Research), adapted |
| `src/leads/injection-defense.ts`: three functions that defuse prompt-injection markers in web text | **Automaton**, copied word for word from `src/agent/injection-defense.ts` |
| Automaton's README, architecture notes, documentation and constitution | **Automaton**, kept unchanged in [`docs/automaton/`](docs/automaton/) |
| The lead engine in `src/leads/` (search, the web guard, evidence checks, scoring, database, budget, approval page, sending) and its tests in `src/__tests__/leads/` | **New**: written for Lead Scout on Automaton's base, not part of Automaton |
| The assistant instructions: `CLAUDE.md`, `guide/`, `templates/`, `examples/`, `.claude/agents/` | **New** |
| Automaton's agent runtime, crypto wallet, self-replication, on-chain and CLI parts | **Removed** from this copy (they remain in this repository's git history, from commit `d8f8168`) |

**Automaton does not endorse this project.** Any mistakes here are ours,
not theirs.

## Third-party software

Lead Scout uses open-source packages from npm. Each keeps its own licence.
The full list, with each package's version, licence and source, is in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## The worked example

`examples/deepgram/` is built only from Deepgram's public website and
public news, as a teaching example. It is not affiliated with or endorsed
by Deepgram, Inc. Deepgram's name and products belong to Deepgram.
