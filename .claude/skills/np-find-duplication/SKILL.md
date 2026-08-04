---
name: np-find-duplication
description: >-
  Scan the codebase for copy-paste duplication with jscpd, cluster the clones,
  and rank which ones are genuinely worth extracting into ONE shared abstraction
  — respecting this repo's Sheriff domain seals and type-axis. Use when asked to
  find duplicated / copy-pasted code, DRY candidates, "what should I refactor",
  or "detect refactoring opportunities". Detection + recommendation only; it does
  not apply the refactor unless asked.
---

# np-find-duplication

Find the **best refactoring-into-one-abstraction candidates**, not just raw clones.
jscpd finds *textual* duplication; the value this skill adds is the judgment jscpd
can't make: clustering pairwise clones into real groups, then deciding which are the
*same concept* (extract) vs *coincidental shape* (leave alone), and — critically —
*where* the abstraction may legally live given this repo's Sheriff domain seals and
type-axis layering.

## Step 1 — Scan

Write reports to your scratchpad (not the repo). Console output is for the human;
JSON is for the clustering step.

```bash
OUT="<scratchpad>/jscpd"   # e.g. the session scratchpad dir; never commit this
pnpm dlx jscpd \
  --min-tokens 50 \
  --reporters console,json \
  --format typescript \
  --ignore "**/*.spec.ts" \
  --output "$OUT" \
  src/app
```

**Parameter rationale** (tune, don't blindly copy):
- `--min-tokens 50` — ~5–8 lines; below this you get noise (identical imports, one-line
  guards) that isn't worth an abstraction. Raise to 70–100 to see only the fat clones.
- `--reporters console,json` — console for the summary table you show the user; JSON
  (`$OUT/jscpd-report.json`) for Step 2.
- `--format typescript` — the logic lives in `.ts`. Add `scss,html` to hunt template/style
  duplication too (shared mixins live in `src/theme/_deck.scss`; retheme via tokens, not
  per-component copies — see the project CLAUDE.md theming rules).
- `--ignore "**/*.spec.ts"` — TestBed/`provideMockStore` boilerplate is expected to look
  alike and is low-value to abstract (shared test infra already exists at
  `@shared/testing/`). Drop the ignore if the user specifically wants test duplication.
  **Do not** ignore `**/testing/**` factories — a `*.test-data.ts` duplicating its
  `*.factory.ts` is a *real* finding.
- **No `--threshold`.** Threshold only sets the exit code (CI gate); it changes nothing
  about what's listed. `--threshold 3` is the right value for a *separate* CI-gate command,
  not for this analysis run.

## Step 2 — Cluster

jscpd reports clones **pairwise**: a block in files X, Y, Z appears as three clones
(X-Y, X-Z, Y-Z). To reason about "one abstraction" you need the group and its size.
The bundled helper does this (union-find + same-file overlap merge) and ranks groups
by how many tokens a single abstraction would remove:

```bash
python3 <skill-dir>/cluster-clones.py "$OUT/jscpd-report.json"
```

It prints each group with instance count, block size, tokens-removable, and — the key
signal — whether it's **intra-domain** or **CROSS-DOMAIN**. (`<skill-dir>` is this
skill's own folder, `.claude/skills/np-find-duplication/`.)

## Step 3 — Judge each top group (this is the actual work)

Rank order from the helper is a *starting* heuristic (instances × size). For the top
~6–10 groups, **read the real code at both locations** and classify:

1. **Genuine** — same concept expressed twice → extract. Recommend it.
2. **Coincidental** — structurally similar, semantically distinct (two reducers that
   happen to share a shape but model different lists; two parsers with the same skeleton
   but different columns). Merging couples things that should evolve independently →
   **note it and leave it**. Say *why* it looked like a clone but isn't worth unifying.
3. **Acceptable duplication** — generated code, or a place where the copy is genuinely
   cheaper than the coupling. Call it out so the user isn't surprised it's excluded.

For every **genuine** candidate, propose a concrete abstraction and — respecting the
architecture in `sheriff.config.ts` and `CLAUDE.md` — **where it must live**:

- **Intra-domain group** → a helper in that domain at the right layer:
  pure logic → `<domain>/util/`, dumb rendering → `<domain>/ui/`, store wiring →
  `<domain>/data/` (behind the facade barrel).
- **CROSS-DOMAIN group** → domains are **sealed** (`domain:* → sameTag, @shared`) and
  after sheriff-tighten there are **no** cross-domain bridges. So the abstraction MUST
  land in `@shared` at the correct layer — pure logic → `@shared/util`, dumb UI →
  `@shared/ui`, genuine NgRx state → `@shared/data` (facade) — and both domains import
  it downward. Never propose one feature domain importing another.
- **Type-axis constraints** the abstraction must not violate:
  `feature → smart-ui/ui/data/util/model`, `smart-ui → ui/data/util/model` (**strict
  leaf** — a smart component never composes another smart component), `ui → util/model`,
  `data → util/model`, `util → model`. A shared *dialog* that composes store-connected
  sub-components belongs in `feature/`, not `smart-ui/`.
- **NgRx-shaped clones** (action groups, reducer `on(...)` blocks, save/list effects
  repeated per slice) are often the highest-value abstractions here: a shared action-group
  factory, a reducer helper, or a generic save/list effect in `@shared`. But check the
  `listId`-guard rule from the project CLAUDE.md — lazy effects that share an action class
  must guard on their target list, so a naive merge can change firing behavior.

## Step 4 — Report

Output a ranked markdown report:
- A short table: rank · instances · size · scope (intra/cross-domain) · verdict
  (extract / coincidental / acceptable).
- Then, for each **extract** verdict, a few lines: what the abstraction is (function /
  directive / base component / pipe / reducer helper / effect factory), its sketched
  signature, exactly where it lives (path + layer), which imports change, and effort/risk.
- Finish with **the single best candidate** — highest value for lowest architectural
  friction — as the recommended first move.

Do **not** apply the refactor unless the user asks. If they do, treat the chosen
candidate as its own task: run `pnpm exec sheriff verify`, `pnpm exec eslint`, and
`pnpm test` after, since moving code across the domain/type axes is exactly what Sheriff
guards.
