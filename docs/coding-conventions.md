# Coding conventions

Split by the only distinction that matters when you are about to write code:

- **[Part 1 — Enforced](#part-1--enforced)**: a machine rejects the violation, so you do not have to
  remember it.
- **[Part 2 — Not enforced](#part-2--not-enforced)**: held by review and habit. Every entry was
  learned the expensive way at least once; several say why they cannot be automated, which is usually
  the interesting part.

Architecture rationale is elsewhere — [project-summary.md](./project-summary.md) indexes it,
[ionic-a11y-practices.md](./ionic-a11y-practices.md) holds the a11y reasoning. This file answers
"what is the rule and who checks it".

---

## Part 1 — Enforced

CI (`.forgejo/workflows/ci.yml`) runs fourteen steps in one job, in this order, on every pull request
and every push to `main`; a `vX.Y.Z` tag runs the same fourteen and then deploys.

| #   | Gate                  | Command                                    |
| --- | --------------------- | ------------------------------------------ |
| 1   | Lint — three tools    | `pnpm run lint`                            |
| 2   | Prettier              | `pnpm run format:check`                    |
| 3   | Module boundaries     | `pnpm exec sheriff verify src/main.ts`     |
| 4   | Test-id contract      | `pnpm run verify:testids`                  |
| 5   | Icon registrations    | `pnpm run verify:icons`                    |
| 6   | Doc paths resolve     | `pnpm run verify:docs`                     |
| 7   | Export surface        | `pnpm run verify:exports`                  |
| 8   | Type-check (app)      | `pnpm exec tsc -p tsconfig.app.json --noEmit`  |
| 9   | Type-check (spec)     | `pnpm exec tsc -p tsconfig.spec.json --noEmit` |
| 10  | Type-check (e2e)      | `pnpm exec tsc -p tsconfig.e2e.json --noEmit`  |
| 11  | Unit tests + coverage | `pnpm run test:coverage`                   |
| 12  | E2E                   | `pnpm run e2e`                             |
| 13  | Production build      | `pnpm run build:pages`                     |
| 14  | Pages subpath         | `pnpm run verify:pages`                    |

**Fourteen steps are sixteen gates.** Step 1 chains three independent tools behind one exit code —
`lint:plugin-types`, `lint:eslint` and `lint:styles` (stylelint) — which is why a CI failure there
does not say *which* tool failed, and why stylelint appears as no gate name despite being fully
enforced. Locally `./scripts/verify-all.sh` runs the same work split into sixteen reported gates;
`.claude/skills/np-verify-all/SKILL.md` owns that list. **This count has drifted twice, both times
because a gate was added to the runner and not to the prose** — SKILL.md's invariant is
one-directional, so it cannot catch drift running this way. The number here is only as fresh as the
last check against `GATES=(` in the script.

**Why gates 4 through 7 are scripts, not rules.** ESLint is per-file with a per-file cache
(`cache: true` keys on a file's own bytes), and none of these is a question about one file's bytes:

- **Gate 5** holds two halves no single file contains: an `ion-icon` name is a string in a template,
  the `addIcons` registration an object literal in a sibling `.ts`. An unregistered name is the
  quietest failure this repo has — no error, no red spec, just a control the user cannot see, which
  is how the shopping list's "move to storage" action sheet stayed unreachable. It asks **two**
  questions, because presence alone is too weak: the ionicons registry is one global map filled by
  whichever component constructs first, so an icon registered *anywhere* renders — which is how `cart`
  rode from the port (`ef02e47`) to 2026-08-02 on `item-list-quick-add`, a component that renders no
  icon at all and merely happened to mount on the same page as the two that name it. Measured: with
  the registration deleted outright, the e2e suite still saw an `<svg>`, because `ng serve` resolves
  ionicons' own `svg/` from `node_modules` — **the e2e layer cannot catch this class at all**, which is
  half of why the gate has to exist. So gate 5 also asks whether the
  component rendering a **static** name registers that name **itself**, which is the half that
  survives someone deleting the sibling. Two shapes are exempt and stay on the presence check alone:
  a **bound** `[name]` (the template only interpolates a string written elsewhere — whoever wrote it
  owns it), and a **non-component module**, which has no constructor to register from. The deck
  catalog names fifteen icons for the grid and the side menu to render, and a notification preset
  names its CTA icon for the inbox; both are tables, not components, and the renderer registers.
- **Gate 6** depends on the **filesystem**, which changes without the doc changing — delete the folder
  a doc names and a cached PASS survives, exactly the moment the gate was supposed to speak. It also
  checks that an entry in its own `KNOWN_ABSENT` list has not started existing.
- **Gate 7** is a whole-repo set difference, and exists because `noUnusedLocals` cannot see an
  **exported** declaration — `export` is the one keyword that hides dead code from the compiler, so
  unexporting hands a symbol to a check already being paid for. It reports an export no other file
  references, an export nothing references at all, and a `src/` module no non-spec module imports
  (dead code with a green test in front of it, which is what `grocery.guards.ts` was). It uses the
  TypeScript **language service**, not a text scan, because the shell reaches all eleven domains only
  through dynamic `loadChildren`/`loadComponent` imports and a grep would call every route manifest
  dead. A **spec-only** reader is allowed, but only the file's own sibling; a spec in another
  directory reaching for an internal means the assertion is in the wrong file.

**Why both type-check gates exist:** `build` and `test` run on esbuild, which transpiles without
type-checking, so a broken *type-only* import passes them silently.

**Why Sheriff runs twice.** Gate 1 runs it as an eslint plugin over every linted file; gate 3 runs the
CLI from `src/main.ts`. The CLI walks the *entry graph*, so it cannot see a file nothing imports —
every `*.spec.ts`, and `e2e/`. Verified by planting a cross-domain deep import in a spec: the CLI
reports "No issues found", eslint reports both violations. Dropping the plugin would silently unguard
~180 spec files; dropping the CLI would lose the 1.1s answer to "is the entry graph sound",
independent of what the lint cache believes.

**`lefthook` pre-commit** runs prettier `--write` on staged files (re-staged via `stage_fixed`), then
eslint on staged `src/**/*.{ts,html}`, then stylelint on staged `src/**/*.{scss,css}` — prettier first
so eslint's `prettier/prettier` rule sees formatted files. **pre-push** runs `./scripts/verify-all.sh`
whole, ~90 s cold. The split is deliberate: a minute per *commit* would get routed around with
`--no-verify`, and that flag is all-or-nothing. Both hooks are skippable, so **CI is still the gate
that holds**. The runner reads the **working tree** and says so rather than blocking — verifying a
dirty tree is a weaker claim than verifying the commits being pushed, and a gate should not quietly
overstate what it checked.

### TypeScript (`tsconfig.json`)

Beyond `strict: true`:

| Option | What it buys |
|---|---|
| `noImplicitOverride` | A renamed base method surfaces |
| `noPropertyAccessFromIndexSignature` | An index read must use `obj['key']`, visibly a lookup |
| `noImplicitReturns` · `noFallthroughCasesInSwitch` | No accidental `undefined` return, no fallthrough |
| `noUnusedLocals` | A dead import is a compile error — how a deleted describe block announces itself. ESLint configures no `no-unused-vars`, so this is the only unused check there is |
| `noUncheckedIndexedAccess` | `arr[i]` is `T \| undefined`, so a missed bounds check is a compile error instead of an `undefined` reaching a reducer |
| `forceConsistentCasingInFileNames` | Import casing can't drift between macOS and the Linux runner |

`angularCompilerOptions` adds `strictTemplates`, `strictInjectionParameters`,
`strictInputAccessModifiers`.

**`noUncheckedIndexedAccess` is deliberately `false` in `tsconfig.spec.json`.** A spec indexes a
fixture it built three lines earlier; an `undefined` there is a red test with a TypeError, which is
the signal the assertion exists to produce. Paying for it would mean `?.` on ~140 assertions,
weakening the failure message for a guarantee the runner already gives.

Ambient types are opt-in per project: `types: ["dom-chromium-ai"]` (app),
`["vitest/globals", "dom-chromium-ai"]` (spec). A new ambient package must be listed or it is
invisible.

### ESLint

Five rule sources, composed in `eslint.config.js`:

- **`angular-eslint`** — `tsRecommended` on `**/*.ts`, `templateRecommended` + `templateAccessibility`
  on `**/*.html`. Local overrides: class suffix `Page`/`Dialog`/`Component`; `app`-prefixed
  kebab-case element selectors; `app`-prefixed camelCase attribute directives.
- **`@ngrx/eslint-plugin`** — `configs.all`.
- **`eslint-plugin-unicorn`** — `configs.all`, with exactly **four** documented adjustments, only one
  an opt-out: `no-null` **off** (`null` is idiomatic across Angular/NgRx/RxJS); `prevent-abbreviations`
  at `error` with an `allowList` (`utils`, `prod`) and `ignore` (`e2e`, `Ref`, `componentProps`);
  `no-useless-undefined` with `checkArguments: false`; `prefer-export-from` with
  `checkUsedVariables: false`. The bar for a fifth: a rule whose *autofix is wrong here*, not one
  that is merely inconvenient. **This list was wrong until 2026-08-01** — it claimed three rules were
  "off outright" when all three are at `error`, and carried a rationale for an opt-out that did not
  exist. Nothing failed, because the suite passes either way, which is why a config change is checked
  with `eslint --print-config` and never a green run.
- **`eslint-plugin-prettier`** — formatting is an ESLint error on `**/*.{ts,html}`.
- **`eslint-plugin-commlink`** — this project's own, below.

**Cached and parallel, and it has to be.** `angular.json` sets `concurrency: "auto"` and `cache: true`
(`.eslintcache`, git-ignored): ~34s cold, ~3s warm, against ~99s without. The cost is almost entirely
Sheriff — `TIMING=all` puts **93.6%** of a cold run in `@softarc/sheriff/encapsulation` +
`dependency-rule` (~51s each), against 2.9s for `prettier/prettier` and **22ms for every `commlink/*`
rule combined**. Reach for `TIMING=all` before optimising: the two intuitive suspects (markdown at
870ms/1%, and this project's own plugin) were both wrong.

Two cache traps. **Editing a rule's source does not invalidate it** — ESLint hashes the resolved
config object, not the plugin files behind it, so a changed rule keeps reporting the previous verdict.
Develop with `eslint --no-cache <file>`, and `rm -rf .eslintcache` before believing a full run (the
builder makes that path a *directory*, so `rm -rf`, not `rm`). And **the cache is per-file while
Sheriff is cross-file**: if A becomes invalid because B changed, A's own bytes did not change and its
cached result is reused. CI is always cold; locally, delete it for a definitive answer.

**Lint scope is the whole repo.** `lintFilePatterns` is `src/**/*.{ts,html}` · `e2e/**/*.ts` · `*.js`
· `eslint-plugin-commlink/**/*.ts` · `**/*.json` · `**/*.md`, so every block in the config is a real
gate — the JSON and markdown sets were configured but unreachable for a while. The pre-commit hook
stays `src/**/*.{ts,html}` on purpose: it lints what you are most likely to have broken, in the time
budget a commit can absorb.

#### `eslint-plugin-commlink` — the twenty local rules

TypeScript, loaded natively with no build (Node ≥ 22.18 strips types on `require`). The config sets
are self-scoping, so `eslint.config.js` names no rule. Three sets, **split by language**:
`configs.tsRecommended` and `configs.templateRecommended` (angular-eslint's own names, spread into the
`extends` of the `**/*.ts` and `**/*.html` blocks) plus `configs.all`, their union.

**The split is load-bearing.** `extends` applies the enclosing block's `files` to everything it
extends, so a template-scoped set nested under a `**/*.ts` parent intersects to nothing — measured:
all nine template rules went inert, every `.ts` file kept exactly the rules it had, and a planted
nameless `<ion-icon>` linted **green**. Two rules are genuinely bi-language and appear in both sets,
once per language: `i18n-key-ownership` and `testid-is-static`.

| Rule | Gate |
|---|---|
| `commlink/a11y-icon-is-hidden-or-named` | R1 — every `ion-icon` is `aria-hidden` or named |
| `commlink/a11y-icon-only-control-has-name` | R2 — an icon-only `ion-button`/`ion-fab-button`/`ion-item-option` has its own name |
| `commlink/a11y-form-control-has-label` | R3 — a control's name comes from itself, never a neighbouring `ion-label` |
| `commlink/a11y-overlay-has-name` | R4 — declarative overlays; `ion-modal` takes `aria-label`, and `aria-labelledby` on it is reported as inert |
| `commlink/a11y-overlay-options-have-name` | R4 — the `ModalController.create({…})` half, via `htmlAttributes` |
| `commlink/a11y-no-actionable-toast-button` | R6 — a toast button with a `handler` is not announced |
| `commlink/a11y-builtin-name-is-translated` | R7 — Ionic's hardcoded English `menu`/`back` are overridden |
| `commlink/a11y-aria-label-needs-role` | R8 — `aria-label` only where the role permits a name |
| `commlink/i18n-key-ownership` | `@shared` speaks no domain vocabulary; a domain speaks no other domain's |
| `commlink/ngrx-data-layer-only` | No `@ngrx/*` import outside the sanctioned homes |
| `commlink/testid-is-static` | A `data-testid` is a literal, never composed |
| `commlink/marker-argument-is-literal` | `marker(…)` takes a literal, so `i18n:extract --clean` sees the key rather than pruning it |
| `commlink/instant-argument-is-marker` | the other half: a key reaching `TranslateService.instant` unwrapped is invisible to the extractor |
| `commlink/action-event-keys-are-identifiers` | `createActionGroup({ events })` keys are camelCase, not `'Add Item'` |
| `commlink/no-action-type-literal` | Nothing matches on `'[Source] event'` — go through the creator (specs exempt) |
| `commlink/no-barrel-outside-data` | The only `index.ts` is a `<domain>/data/` facade barrel |
| `commlink/spec-resets-mock-selectors` | A spec calling `overrideSelector` also calls `resetSelectors` |
| `commlink/no-testid-on-component-element` | An `app-*` element is already a contract |
| `commlink/e2e-ionic-locator-traps` | The two Ionic locator traps a literal can reveal |
| `commlink/comments-header-only` | At most one comment per file — see below |

R-numbers index [ionic-a11y-practices.md](./ionic-a11y-practices.md), which defines **R1–R9**. Seven
are gated; two cannot be, permanently: **R5** (no action reachable only by swipe or drag) needs to
know whether a keyboard path to the *same* action exists elsewhere in the app, which is not a property
of a template; **R9** (the viewport never locks zoom) lives in `src/index.html`, which is not an
Angular template and so is in no template rule's file set. Nothing else in R1–R9 is ungated.

Sanctioned NgRx homes, as `ignores:` on that rule's block: `src/app/app.providers.ts`,
`src/app/**/data/**/*.ts`, `src/app/@shared/testing/**/*.ts`, `src/app/**/*.spec.ts`.

**The order to try when adding a gate:**

1. **A built-in or upstream rule**, configured — nothing to maintain, and it improves without us.
   `no-restricted-imports` does exactly this for build-output imports.
2. **A rule in `eslint-plugin-commlink`**, only when nothing upstream expresses the check. Verify,
   don't assume: angular-eslint's whole `templateAccessibility` preset runs on the same files, and
   planting the four Ionic cases fires **four `commlink/` rules and zero `@angular-eslint/` ones** —
   the preset does not know Ionic's custom elements.
3. **A script**, only for what ESLint structurally cannot see (gates 4, 5, 6 above).

What forced a rule id in the i18n and NgRx cases is narrower than "prefer a rule": flat config
**replaces** a rule's options rather than merging them, so a selector added to one block was silently
dropped wherever a later block set the same rule id — twice. That is an argument about *shared option
bags*. A single `no-restricted-imports` with no competing block is fine, and stays fine by extending
its list in place rather than adding a second block.

#### Comments — one banner per file, nothing below it

`commlink/comments-header-only` is **armed** (`configs.tsRecommended`, 2026-08-02) and the repo is at
zero. It is the one rule with no narrowing and no `ignores` at all — it resolves on every `.ts` file
`ng lint` is pointed at, 587 of them, including specs, `e2e/` and the plugin's own sources. It is in
**no** template set: a template has no first code token for a banner to sit above.

> Default: **no comments.** The code is the summary. If it does not read as one, that is a naming or
> an extraction bug, and a comment is the wrong repair for either.
>
> A file **may** carry **one** block, **above the first code token**, listing only the
> **non-obvious decisions** taken in that file. Not a summary of the file. Not a `provides` /
> exports list — the export list and `verify:exports` already own that. Not TODOs —
> [open-tasks.md](./open-tasks.md) owns those, where they can be triaged instead of read once by
> whoever next opens the file. **Not JSDoc.**
>
> **Nothing after the first code token**, except tool directives and one bounded trailing label.
>
> Rationale that generalises beyond one file is said **once**, in the compendium file that owns the
> seam, and never re-stated per file.

The shape is exact, because a shape that is nearly enforced is not enforced:

```ts
/* ─── why ─────────────────────────────────────────────────────────
 * The two tests differ by a single click, because the toggle's DEFAULT is
 * win-high: the win-low case flips it, the win-high case deliberately
 * touches nothing. A default cannot be read off a spec that always sets
 * the value, which is what the untouched case is for.
 * ───────────────────────────────────────────────────────────────── */
```

One `/* … */` block — a run of `//` lines above the imports is a violation however well it reads,
because two spellings of one thing is a shape a rule cannot key on. Opening line `/^\/\* ─{3} why ─+$/`,
closing line ` * ` + dashes + ` */`, every interior line starting ` * `, and a **bare ` *` is legal**
as a paragraph break — the same allowance Stylelint makes on the SCSS side. The dashes are U+2500 and
*not* hyphens: identical at a glance, so the first and last line each get their own message rather
than one generic shape complaint.

**An import is a code token** — the single thing a reader is most likely to get wrong. A comment
between two imports is not "at the top of the file"; it is in the body, and reports `commentInBody`.
The block goes above the first import, with nothing but a hashbang ahead of it (recognised by node
type, not position — ESLint hands the rule a `Shebang` node, and a hashbang is byte 0 by definition).
Not hypothetical: that is where 25 of the plugin's own 27 blocks sat before the hoist.

**It polices shape and placement, never presence.** No rule can tell a file whose decisions are
non-derivable from one whose code already reads as its own summary — the exact judgement the block
exists to record, and a rule that *demanded* a header would get it satisfied with prose. So the
block's **existence is the signal**: measured, **55 of 587 files** carry one (9.4%), and none in
`src/`. That only works while a header stays rare, which is why the same rule that cannot require one
still forbids every *other* comment — presence is only information against a background of absence.

**One bounded exception: a trailing label.** A `//` comment may share a line with code if it is the
only trailing comment there and its trimmed text is **at most 60 characters**. The trailing slot is
the one position that stays anchored to the token it describes; it cannot drift from its subject
without being moved. What belongs there is a label — a cross-reference the type system cannot carry, a
domain fact about an opaque literal:

```ts
type: TrackplayId; // -> GameType.id
const boundary = dayjs('2026-08-01'); // a Saturday
```

**60 is measured, not chosen.** The surviving population (2026-08-02) is **46 labels, all `//`** — 26
in `src/`, 12 in `e2e/`, 8 in the plugin — trimmed length **min 2, median 18, p90 37, max 53**. The
bound clears every existing site with seven characters of headroom while making a paragraph physically
impossible, which matters because **prettier does not wrap comments**: an unbounded slot would absorb
the own-line comments the rule bans, one long line at a time. A slot that can only hold a label cannot
hold an argument. The bound is on the comment's **text, not the whole line** — four label lines
already end past column 80, three carrying only 14–18 characters, and a whole-line bound would make
the same comment legal in one file and illegal in another purely by nesting depth.

**JSDoc went with the rest** — the second-largest class in the sweep, **557 findings**. It documents
*the code*, the one thing the code already states in a language the compiler checks; a `@param` that
drifts is worse than absent, because it reads as maintained. What survives is the part JSDoc has no
tag for: the decision.

**Tool directives are whitelisted, and only they** — `eslint-disable*`/`eslint-enable`, the `@ts-*`
family, `prettier-ignore`, `/// <reference`, a coverage `ignore`, a bundler hint. Silencing a tool is
*inherently* line-local: hoisted to a header it would cover a range nobody chose, moved to `docs/` it
would cover nothing. It is the one class of comment whose meaning **is** its position, and cheap to
hold open — **16 sites in the whole repo**.

**A directive keyword must be followed by the tool's own grammar, not by prose.** A paragraph that
merely *opened* with a directive word exempted itself, so one sentence inside
`eslint-plugin-commlink/rules/a11y-no-actionable-toast-button.ts` was skipped while every other line of
the same paragraph reported. Two lessons: **the count was only right because the matcher was wrong**
(an exemption list is measured by the thing it exempts, so a too-generous matcher reports a
reassuringly small whitelist); and where a tool honours a keyword in only *one* comment shape, that
shape is part of the grammar — `globals`/`eslint-env` and `eslint-disable` count only as block
comments (measured: as a line comment `eslint-disable` suppresses nothing), while `@ts-*` stays
keyword-only because TypeScript defines its tail as free text.

**Three areas, three treatments — one policy.** The question is always *is this prose commentary on
the code, or the documentation of the thing itself?* `src/` is the first case and was **deleted
wholesale** (7,044 comment lines → 1,107 repo-wide); `eslint-plugin-commlink/` and `e2e/` are the
second and were **hoisted** into banners, where the prose survived at 109% and 90% respectively. A
rule's rationale is the only write-up of that rule anywhere, which is why the table above gives a
one-line gate and not a description; a spec's prose is its statement of what it proves. The rule
cannot tell the two cases apart and does not try — the split is a judgement made once per area, by a
human, then held by a rule that only ever asks *where*. Per-area counts are in `0f22805`.

**No autofix, deliberately.** Deleting a comment is a decision about where its content goes: a better
name, an extracted function, the banner, or a paragraph in `docs/`. An autofix can only make a fifth
choice, deletion, which is the one that loses the content. The one mechanical case — a well-formed
banner sitting below the imports — is a follow-up, deliberately not landed with the arming, since it
would have been running over the tree it was being validated against.

**SCSS is stylelint's half of the same rule, and it has landed.**
`commlink/comments-header-only` in `stylelint/comments-header-only.mjs`, armed in
`stylelint.config.mjs`. It is hand-written for the same reason as the eslint one: nothing upstream
expresses **placement**. `comment-pattern` polices shape but applies to every comment wherever it
sits; `scss/double-slash-comment-inline` is all-or-nothing on trailing comments with no length
bound; `scss/comment-no-loud`, `comment-empty-line-before`, `comment-whitespace-inside` and
`comment-no-empty` are form or formatting only.

**The SCSS banner is a `//` run, not a `/* */` block — the inverse of the TypeScript decision.** The
layer already wrote 313 `//` against 42 loud, and `scss/comment-no-loud` is upstream's expression of
that same preference. Output is *not* the reason: the production bundle carries zero comments either
way, which was measured rather than assumed. One wrinkle follows from the choice —
`scss/comment-no-empty` stays off, because a bare `//` is the paragraph break inside a banner.

**The style layer specifies itself now.** `src/global.scss` is its composition root — the file that
imports Ionic, `@use`s the two partials that emit CSS, and holds what is app-wide — so the layer's
own contract lives in its banner, the way `app.providers.ts` holds the kernel's. `docs/theming.md`
kept only what spans TypeScript, HTML and SCSS at once: the boot splash, the user accent overrides,
and the half of "adding a third theme" the compiler does not already enforce.

**No CI step and no gate-name change.** It is the twentieth rule *inside* gate 1 — the table above
reads fourteen and sixteen both before and after arming, and the shape of that table is what invites
the mistake. A rule rather than the alternatives because nothing upstream polices *placement*
(`no-inline-comments`, `capitalized-comments`, `multiline-comment-style` and `jsdoc/*` each police a
different axis), while the verdict is decidable from one file's own bytes.

### Module boundaries (`sheriff.config.ts`)

Two-axis tagging, Hahnekamp style. Every folder under `src/app/<domain>/<type>` carries a `domain:*`
and a `type:*` tag; the shell carries only `type:shell`.

```text
shell    → routes, feature, data, util, model
routes   → feature, data, util
feature  → smart-ui, ui, data, util, model  (+ @shared/feature only)
smart-ui → ui, data, util, model            (strict leaf — no sameTag)
ui       → self, util, model
data     → self, util, model
util     → self, model
model    → self
testing  → anything, but only *.spec.ts may depend on it
```

**Domain axis** — `domain:* → sameTag, domain:@shared`. Every domain is sealed; there are no
cross-domain bridges left, and a cross-cutting need is inverted behind a `@shared` contract instead.

`enableBarrelLess: true`, with one exception per domain: `<domain>/data/index.ts` is a facade barrel.
Outside code imports the folder and sees only the public facade; a deep import into `data/<slice>/…`
is a violation. Two escape hatches, both narrow and both in the config: a spec may reach
`type:testing`, and `type:feature` may reach a `type:feature` module under `/@shared/`.

### Prettier

`.prettierrc`: single quotes, `es5` trailing commas, always-parenthesised arrow params, the `angular`
parser for `*.html`. Enforced twice — as an ESLint rule on `**/*.{ts,html}` and as the standalone
`format:check` gate over `src/**/*.{ts,html,scss,json}`, `public/i18n/*.json` and
`eslint-plugin-commlink/**/*.{ts,json}`.

**Markdown is outside every formatting gate** — `docs/` is not prettier-clean, and
`prettier --write` on one file reflows the whole thing into an unreviewable diff. Don't.

### Stylelint (`stylelint.config.mjs` + `stylelint/`)

`pnpm run lint:styles` over `src/**/*.{scss,css}`, chained onto `lint` and a pre-commit job of its
own. Unlike the eslint hook it is **not** narrowed to staged files: stylelint needs no type
information and the whole layer lints in under a second.

**Why a separate tool at all: ESLint cannot read SCSS.** `@eslint/css` is a CSS parser, so with
`tolerant: false` all seven theme partials fail outright — and `tolerant: true` hides that rather
than fixing it: a trial rule saw **47 of 52** `font-size` declarations and reported **zero** errors,
silently losing the whole of `_shadowrun.scss` to a `//` comment css-tree choked on. Hence
postcss-scss, which understands `//` by design.

`stylelint-config-standard-scss` with four groups off, each for a reason: the blank-line family
(prettier owns formatting), the colour-notation opinions (`rgba(var(--x-rgb), α)` is a deliberate
idiom here), `media-feature-range-notation` (range syntax vs the Android WebView the APK ships into),
and `scss/comment-no-empty` (a bare `//` is a paragraph break in the doc blocks).
`selector-class-pattern` is **reconfigured, not disabled**, to kebab-case BEM.

Two rules are the project's own, both plain `.mjs` rather than the eslint plugin's TS-no-build trick —
stylelint resolves plugins itself and gets no Node type-stripping. **`commlink/font-size-uses-scale`**
reads the rung names off `_shadowrun.scss`, so its message cannot drift from the scale.
**`commlink/muted-text-uses-token`** rejects an accent-at-an-alpha as a *text* colour (`color`, plus
Ionic's `--color`/`--placeholder-color` hooks) and points at `var(--sr-text-dim)`. Its scope is
deliberately narrow: the same value is right for a tinted fill or border, which carry no contrast
requirement, and a `--sr-*` property is exempt because defining what "muted" means per theme is the
theme layer's job. Exceptions in both go through `/* stylelint-disable-next-line */` at the call site
rather than a path allowlist — local, greppable, reason next to the value.

**`--fix` is not all safe here.** `property-no-vendor-prefix` autofixed `-webkit-mask` into a
duplicate bare `mask`, dropping the only thing that clips the trackplay victory beams on pre-15.4
Safari; `value-keyword-case` lowercased `Arial` to `arial` inside `--sr-sans`, where it cannot tell a
keyword from a proper noun. Both are handled now — read the `--fix` diff before staging it regardless.

### Tests and coverage

`pnpm run test:coverage` enforces a floor: **statements 88 · branches 83 · functions 80 · lines 88**,
over `.ts` only. Read those honestly — the builder instruments only what the specs pull in, so they
measure "of what is under test", not the app. A regression floor, not a coverage claim.
(`coverage.include` is the documented fix and does not compose with `@angular/build:unit-test`: an
`include` glob re-instruments the on-disk sources as a separate uncovered set and the report collapses
to 0%.)

**Templates are excluded from the denominator, and that is what the numbers are worth reading for.**
Until 2026-08-01 the floor was 70/72/68/75 with 62 `.html` files counted in — they sat at 39%
statements and **1.4% functions** against 91%/84% for the `.ts` beside them, dragging the aggregate to
76/73.6 and leaving roughly eight points of room for TypeScript to regress into before anything spoke.
Nothing here asserts rendered Ionic DOM (jsdom never upgrades a Stencil element), so a template's
statements execute only incidentally; rendered behaviour is the e2e suite's. The two i18n bundles are
excluded too — a data file imported through `resolveJsonModule` scores a free 100%. **A threshold is
only as honest as its denominator.**

### Build

`build:pages` runs on pull requests too — a prod build that no longer compiles is worth catching
before merge. The two prod builds differ only in base href: `build` uses `./` for Capacitor,
`build:pages` uses `/np-commlink/`.

| type | warning | error | against |
|---|---|---|---|
| `initial` | 1.6 mb | 1.9 mb | ~1.43 MB — `b0fa7cc`, ~12% headroom |
| `anyComponentStyle` | 7 kb | 8 kb | 6.47 kB (`commlink.page`), 6.11 kB (`game-play`) |

The component-style pair was Angular's scaffold default (6/10) until 2026-08-01, and **both halves
were wrong in opposite directions**: the two most decorated pages had been over the warning for as
long as they had been finished, so every green build printed `2 budget warning(s), non-fatal` and the
number stopped being read; while a 10 kB error was never going to fire, nothing being within 3 kB of
it. A threshold that always speaks and one that never can are the same failure. 7/8 clears both pages
and puts the ceiling one page-sized step above them.

**A warning is not a gate** — `maximumWarning` cannot fail CI, so its only function is to be read, and
`scripts/verify-all.sh` surfaces the count in the build card's footer for that reason.

**Only `build:pages` is gated**, deliberately: compiling `build` too would be a second full production
build per run for a difference of one string in `index.html`. `verify:pages` then serves what
`build:pages` wrote and requests it from the subpath, which is the half that can actually break.

`pnpm install --frozen-lockfile` is a CI gate with no local counterpart, on purpose — `verify-all.sh`
reads a working tree whose `node_modules` is already installed, and an install inside a pre-push hook
is how you get a half-deleted dependency tree mid-verify. The consequence is worth knowing: edit a
dependency without re-installing and the hook passes while CI fails on the lockfile.

### Analyzers that are not gates

Two static-analysis configs are tracked and wired into nothing. Neither is dead; both run on demand,
and this section exists because the first reviewer to grep for them proposed deleting them.

- **`sonar-project.properties`** — for a local SonarQube (a Podman `sonarqube:community` on :9000).
  Run `pnpm test --coverage --coverage-reporters lcov`, then
  `SONAR_HOST_URL=… SONAR_TOKEN=… pnpm dlx @sonar/scan`. The scanner runs natively rather than
  containerized: `sonarsource/sonar-scanner-cli` is amd64-only, and a container mount breaks coverage
  import because the v8 lcov carries absolute host paths. The two suppressed rules live in the
  properties file rather than a server-side quality profile so the reasoning travels with the code.
  Not in CI, and not to be added without deciding gate semantics first — the quality gate asserts only
  on *new* code, so a first analysis passes vacuously.
- **`qodana.yaml`** — JetBrains' generated starter profile plus one inspection. Scaffolding rather
  than a decision; nothing has consumed it.

---

## Part 2 — Not enforced

Convention. Nothing rejects a violation, so these are the ones to hold in your head.

### Comments and function shape

**Speaking code instead of comments.** Only ever comment the *why* — never the *how*. If you feel the
urge to write a comment explaining what a block does, extract that block into a well-named function
instead. The mechanical half is enforced (`commlink/comments-header-only`, which decides **where** a
comment may sit and in what shape). What follows is the half no rule will take, and it is the half
that matters — the rule is satisfied by a well-formed banner full of nothing.

- **Does this file need a banner at all?** A rule that could answer that could tell a load-bearing
  decision from a restatement, which is the judgement the block exists to record. Its **presence is
  the signal**, so adding one to a file that did not need it dilutes every other banner in the repo.
- **Is what it says non-derivable?** A banner describing the code passes the shape check exactly as
  well as one recording a decision. The test is whether a competent reader would otherwise "fix" the
  thing it defends.
- **Does it generalise beyond this file?** Then it belongs in `docs/`, said once, in the file that
  owns that seam. A rationale copied into three files has three places to go stale, and the copies are
  indistinguishable from the original.

**Skeleton → execution.** Prefer small functions with human-readable names; the top-level function
reads as the list of steps, each a named call a reader descends into only if they care. This is why
the comments convention can be as strict as it is: the block a comment would have explained becomes a
named call, so removing the comment costs nothing. Where it *does* cost something, the extraction was
the missing move.

### Naming

- **Facade file shapes — four.** `<domain>.facade.ts` is the domain's general facade.
  `<aggregate>-page.facade.ts` is reserved for implementations of a shared page contract token
  (`LIST_FACADE` / `CATEGORY_LIST_FACADE`) — **the `-page` suffix encodes a token binding, not
  page-ness**. `<aggregate>.facade.ts` is an aggregate facade binding no token.
  `<contract>.facade.base.ts` is an **abstract** base such an implementation extends — currently one,
  `BaseCategoryListPageFacade` in `@shared/data/categories/`, which two of the three
  `CATEGORY_LIST_FACADE` bindings inherit their nine bodies from. It is in `@shared/data` rather than
  `@shared/util` because it injects `Store`; the no-NgRx half, the `CategoryListPageFacade` token, is a
  layer down in `@shared/util/categories/`. Why the third binding does not extend it is in
  [decisions.md](./decisions.md). The first name token follows the *aggregate*, not the domain folder:
  `HouseholdListPageFacade` is named for the `household-list.*` engine rather than its folder, which
  `HouseholdCategoriesPageFacade` in the same domain is the proof of.
- **Action-group event keys are camelCase identifiers**, never quoted title-case: `addItem:`, not
  `'Add Item':`. The wire string and the code you write are then the same token, so an action is
  greppable by the one name it has. **Nothing may match on that string** — use the creator. Parsing
  the *source* prefix is fair game, being a slice identity rather than an event name. **Enforced** by
  `commlink/action-event-keys-are-identifiers` + `commlink/no-action-type-literal`.
- **Effect casing tells you the kind.** Hand-written effects are `@Injectable` classes
  (`TrackingEffects`); effects from the shared builders are functional objects (`tasksListEffects`) —
  because NgRx dedups same-class instances across injectors, so a shared *class* in two lazy contexts
  would double-dispatch.
- **An empty effects class is dead code, not a placeholder.**
- Types are sliced by concern, never a god file and never a barrel:
  `<domain>/model/<concern>.types.ts`. The barrel half is **enforced** by
  `commlink/no-barrel-outside-data` — Sheriff's `enableBarrelLess` governs how imports resolve, not
  whether one gets created.
- **No `I`/`T` prefix on a type.** `BaseItem`, not `IBaseItem`. The prefix encoded whether a
  declaration happened to be written as an `interface` or a `type` — not something a consumer can act
  on, and it changes under them whenever the declaration is reshaped. A generic *parameter* keeps its
  `T` (`TState`, `TForm`): there it separates a placeholder from a concrete type in one signature.
  Where a stripped name would read as nothing, the aggregate takes the prefix's place — trackplay's
  `TID` is `TrackplayId`, its `IBase` is `TrackplayEntity`.

### Never compose an identifier at the call site

The single most repeated lesson in this codebase, in three places:

- **i18n keys** — a key built from a template string is invisible to `i18n:extract --clean` and gets
  pruned. Every family that used to be composed is a `marker(...)` const; the acceptance test is that
  running the script leaves `git diff public/i18n/` clean. **Enforced** by
  `commlink/marker-argument-is-literal`.
- **`data-testid`** — `'row-' + item.id` in a template and `getByTestId('row-milk')` in a spec share
  no literal, so neither half is greppable. A repeated row carries a static `list-row`; *which* row
  comes from user-visible content (`filter({ hasText })`).
- **Deck entry ids** — never renamed, because absence means default and a rename would need a
  migration hop.

### The `data-testid` contract

Anything a spec locates that is not *already* a contract carries a `data-testid`. Ionic element names,
tag names, CSS classes, icon names and translated text all describe styling rather than identity, so a
re-theme can redden a green suite with no behaviour change.

- A component element name (`app-page-cash`) **is** already a contract — don't add a second name.
  **Enforced** by `commlink/no-testid-on-component-element`.
- Add an id only where a spec locates something *today*.
- **Never compose one** (`commlink/testid-is-static`). This is the invariant everything else rests on:
  both halves of the audit match a *static literal*, so a composed id silently drops out of the
  declared set and the dead-id check stops seeing it.
- `pnpm run verify:testids` decides the two decidable directions — an id no spec references, and a
  spec referencing an id no template declares (gate 4, 60ms). It stays a script because both are
  whole-repo set differences, the one shape a per-file linter is worst at; answering them in a rule
  needs a cached cross-file index, which with `cache: true` would go stale exactly when it matters.
  The third case — a spec that ignores the ids entirely — is not decidable from the two file sets and
  stays a review matter.

### Testing

Lean, not exhaustive. No 100% coverage target.

- **Pure logic** (`*.spec.ts`): utils, pipes, reducers, selectors via `.projector(...)`. No `TestBed`
  where a plain call suffices.
- **Component class logic**: `TestBed.createComponent(...).componentInstance` + `provideMockStore()` +
  `provideZonelessChangeDetection()`. **Whether `detectChanges()` is allowed depends on what the
  template embeds.** jsdom never upgrades a Stencil element, so an `ion-*` host is inert — but Angular
  still renders the light DOM around it. A *dumb* component may call it and assert its own output
  (**28 call sites across 8 specs**, audited 2026-08-01, zero violations), while a page whose template
  embeds Ionic-heavy children must not, because what it would assert is a shell. That is a judgement
  about the template, not a blanket ban, which is why it is here and not a lint rule — a rule on the
  blanket wording would fail all 28 correct call sites.

  **The old figure, 33 sites across 12 specs, was a grep artifact**, and it is why this entry names
  the method: four *page* specs contain the string `detectChanges()` only inside a comment saying they
  deliberately do **not** call it, so a plain grep counts a spec's stated compliance as a violation and
  inflates the total by exactly the files most careful about the rule.
- **Effects stay RxJS.** Rely on Vitest `globals: true` — do **not** `import` a *value* from
  `'vitest'`. `import type` is the exception and a necessary one: `vitest/globals` declares the globals
  but not every type, so `MockInstance` has to be imported.
- Facades are root singletons: a spec overriding a selector between two `createComponent` calls must
  `store.refreshState()`.
- Spec files share a module registry, so a `MockStore` override outlives the file that set it — always
  `afterEach(() => store.resetSelectors())`, or the leak surfaces as a spec that passes alone and fails
  in the suite. **Enforced** by `commlink/spec-resets-mock-selectors`.
- **Five Ionic locator traps** cost a red spec every time they are rediscovered — worked through, with
  the DOM facts behind each, in [testing.md](./testing.md). **Two are gated** by
  `commlink/e2e-ionic-locator-traps`; the other three depend on what the spec is *doing* rather than on
  a literal it contains, so they stay prose.

### Theming

**Do not restyle components one by one — retheme the CSS custom properties.** Component SCSS must
reference tokens (`--sr-deck-font`, `--sr-heading-transform`, `--sr-radius`, `--sr-glow`), never
hardcoded `uppercase` / `letter-spacing` / `--sr-mono`. Plain is the base `:root`; cyberpunk is the
opt-in `:root[data-theme='cyberpunk']` block, so a new surface reads plain unless it asks not to.
Never `@use 'theme/shadowrun'` from a component — it emits global CSS.

**Muted text is `var(--sr-text-dim)`, never the accent at an alpha** — **enforced** by
`commlink/muted-text-uses-token`. A literal *inside* the cyberpunk block is a different thing and is
sanctioned: `commlink.page.scss`'s three hero `letter-spacing` values sit under
`:host-context([data-theme='cyberpunk'])` precisely because the base uses the tighter
`--sr-label-tracking`. The rule is that a *theme-varying* value is either a token or inside the opt-in
block — never a bare literal in the base rule.

Adding a theme is partly compile-enforced (`THEMES`, `THEME_LABEL_KEYS`, `THEME_COLOR`,
`DEFAULT_ACCENT_SWATCHES`, per-entry `labels` and `DECK_CHROME_LABELS` are all `Record<Theme, …>`) and
partly not — the message bundles are filled in by hand, and `deck.catalog.spec.ts` catches a missing
key.

### Gate discipline

- **Verify a new gate by breaking what it should catch.** A green assertion proves nothing until it
  has been seen red for the right reason.
- **Verify a diagnostic query before scoping work off it.** A `grep -Lq` inversion once faked a
  ~70-component backlog; counting colocated `*.spec.ts` files is not coverage; grepping templates for
  `aria-live` cannot see what a web component puts in its shadow DOM.
- **A grep over source counts the prose as well as the code**, and in a codebase whose comments name
  the rules, that biases the count *toward* the careful files. One audit produced three false findings
  this way in one afternoon. Filter comments out, or match the call shape (`fixture.detectChanges`),
  and treat a suspiciously tidy number as a reason to look at the lines.
- **A shell idiom can lie about a gate.** `tsc … | tail -2 && echo clean` prints "clean" whenever
  `tail` succeeds, which is always. Check `$?`, or run the command bare.
- **One artifact, two writers is always a bug in the making.** Either one tool owns a file's bytes, or
  you force the outputs byte-identical.
- When changing `eslint.config.js`, check the result with `eslint --print-config <file>` — **never
  with a passing suite**. A dropped rule option makes a gate inert, and inert gates pass.

### Dead exports

Nothing detects them beyond gate 6's whole-repo pass. `noUnusedLocals` and ESLint both treat an
`export` as used by definition, and `knip` / `import/no-unused-modules` were considered and rejected —
a new dependency and a per-push cost for something WebStorm's *Unused global symbol* inspection
already reports live. The sweep is a manual **Analyze Code** run at release-prep time.

### Git

Trunk-based: work on `main`. If you must isolate, prefer a worktree over a branch and keep up with
main. Commit messages explain the *why* — the git log is where the decision record lives, and
[open-tasks.md](./open-tasks.md) carries what is still open.

Nothing has been pushed yet: the remote holds zero refs, so CI has never run. Web and APK ship
together, and the first push waits on an Android signing keystore.
