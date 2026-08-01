# Coding conventions

Two sections, split by the only distinction that reliably matters when you are about to write code:

- **[Part 1 — Enforced](#part-1--enforced)**: a machine rejects the violation. You will find out
  whether you remembered or not, so you do not have to remember.
- **[Part 2 — Not enforced](#part-2--not-enforced)**: convention, held by review and by habit. Every
  entry here is a rule that was learned the expensive way at least once; several say why they cannot
  be automated, which is usually the interesting part.

Rationale lives elsewhere and is not repeated here: `docs/project-summary.md` indexes the
architecture compendium (`architecture.md`, `lifecycle-and-persistence.md`, … — one file per
section), `docs/ionic-a11y-practices.md` holds the a11y reasoning, `CLAUDE.md` the working brief.
This file answers "what is the rule and who checks it".

---

## Part 1 — Enforced

CI (`.forgejo/workflows/ci.yml`) runs thirteen steps in one job, in this order. All thirteen run on
every pull request and every push to `main`; a `vX.Y.Z` tag runs the same thirteen and then deploys.

| # | Gate | Command |
|---|---|---|
| 1 | Lint — three tools | `pnpm run lint` |
| 2 | Prettier | `pnpm run format:check` |
| 3 | Module boundaries | `pnpm exec sheriff verify src/main.ts` |
| 4 | Test-id contract | `pnpm run verify:testids` |
| 5 | Doc paths resolve | `pnpm run verify:docs` |
| 6 | Export surface | `pnpm run verify:exports` |
| 7 | Type-check (app) | `pnpm exec tsc -p tsconfig.app.json --noEmit` |
| 8 | Type-check (spec) | `pnpm exec tsc -p tsconfig.spec.json --noEmit` |
| 9 | Type-check (e2e) | `pnpm exec tsc -p tsconfig.e2e.json --noEmit` |
| 10 | Unit tests + coverage | `pnpm run test:coverage` |
| 11 | E2E | `pnpm run e2e` |
| 12 | Production build | `pnpm run build:pages` |
| 13 | Pages subpath | `pnpm run verify:pages` |

**Thirteen steps are fifteen gates.** Step 1 chains three independent tools behind one exit code —
`lint:plugin-types` (`tsc -p eslint-plugin-commlink`), `lint:eslint` (`ng lint`) and **`lint:styles`
(stylelint)** — which is why a CI failure there does not say *which* tool failed, and why stylelint
does not appear as a gate name anywhere in the workflow despite being fully enforced. Locally,
`./scripts/verify-all.sh` runs the same work split into fifteen reported gates;
`.claude/skills/np-verify-all/SKILL.md` owns that list. Neither runs anything the other does not.

**Why gate 5 is a script and not a markdown rule.** ESLint *does* read `**/*.md` here
(`@eslint/markdown`), so a rule could call `existsSync` per file — and would be wrong, for the reason
`verify:testids` is a script too: a doc's verdict depends on the **filesystem**, which changes without
the doc changing, and `cache: true` keys on the file's own bytes. Delete the folder a doc names and the
cached PASS survives, which is exactly the moment the gate was supposed to speak. It also checks a
second direction no per-file rule can: that an entry in its own `KNOWN_ABSENT` list has not started
existing (dead config is how an exemption list grows past what anyone can justify).

**Why gate 6 exists at all, and why it is also a script.** `tsconfig.json` sets `noUnusedLocals`, and
that flag cannot see an *exported* declaration — so `export` is the one keyword that hides dead code
from the compiler. Unexporting is therefore not cosmetic: it hands a symbol to a check the project
already pays for. It is a script for the same reason as gates 4 and 5 — whether `foo`'s export is
necessary is a fact about every *other* file, and eslint is per-file with a per-file cache. It reports
three things (`scripts/check-exports.mjs` states them in full): an export no other file references, an
export nothing references at all, and a `src/` module no non-spec module imports — the last being dead
code with a green test in front of it, which is what `grocery.guards.ts` was. It uses the TypeScript
**language service**, not a text scan, because the shell reaches all eleven domains only through
dynamic `loadChildren`/`loadComponent` imports and a grep would call every route manifest dead.

A **spec-only** reader is allowed, but only the file's own sibling: a white-box unit test of what it
sits next to is the seam `type:testing` exists for (`sheriff.config.ts` lets any `*.spec.ts` reach any
tag). A spec in a *different* directory reaching for an internal is a finding, and the remedy is to
move the assertion beside its subject rather than to widen the export — see `docs/testing.md`.

**This count has drifted twice, in the same direction both times** — a gate was added to the runner
and the prose that describes it was not. SKILL.md's stated invariant is one-directional ("if a guard
exists there and not in the script, the script is wrong"), so it cannot catch drift running this
way; the number here is only ever as fresh as the last person to check it against
`GATES=(` in the script.

**Why stylelint is a separate tool at all:** ESLint cannot read SCSS. `@eslint/css` is a CSS parser,
so with `tolerant: false` all seven theme partials fail outright, and `tolerant: true` hides the
failure rather than fixing it — a trial rule saw 47 of 52 `font-size` declarations and reported zero
errors, silently losing the whole of `_shadowrun.scss` to a `//` comment css-tree choked on. Hence
`stylelint.config.mjs` (`stylelint-config-standard-scss` + postcss-scss, which understands `//` by
design) plus this project's own `commlink/font-size-uses-scale` in `stylelint/`.

**Why both type-check gates exist separately:** `build` and `test` run on esbuild, which transpiles
without type-checking. A broken *type-only* import passes them silently. The two `tsc --noEmit`
passes are the only thing that catches it.

**Why Sheriff runs twice — and why that is not redundant.** Gate 1 runs it as an eslint plugin over
every linted file; gate 3 runs the CLI from `src/main.ts`. The CLI walks the *entry graph*, so it
cannot see a file nothing imports — every `*.spec.ts`, and `e2e/`. Verified by planting a
cross-domain deep import in a spec: the CLI reports "No issues found", eslint reports both
violations. Dropping the plugin to save time would silently unguard ~180 spec files. Conversely the
CLI is not redundant either: it is the 1.1s answer to "is the entry graph sound", independent of
whatever the lint cache believes.

**`lefthook` pre-commit** runs a subset locally — prettier `--write` on staged files (re-staged via
`stage_fixed`), then eslint on staged `src/**/*.{ts,html}`, then stylelint on staged
`src/**/*.{scss,css}`. Order matters: prettier formats first so eslint's `prettier/prettier` rule
sees already-formatted files.

**`lefthook` pre-push** runs the whole thing — `./scripts/verify-all.sh`, the same work CI does,
~90 s cold. The split is deliberate. A minute per _commit_ would get routed around with
`--no-verify`, and that flag is all-or-nothing: skip it once and prettier, eslint and stylelint go
with it. A push is rare enough to afford the wait; a commit is not. And Codeberg's runners are
donated capacity whose terms ask for minimal pipelines (§10.4), so not pushing a red tree is
courtesy rather than just convenience. Both hooks remain skippable, so **CI is still the gate that
actually holds** — the hook only moves the usual failure earlier.

> **Caveat the runner states in its own header:** it reads the **working tree**, on the assumption
> that nothing is uncommitted at push time. Verifying a dirty tree is a weaker claim than verifying
> the commits being pushed, so it says so rather than blocking — a gate should not quietly overstate
> what it checked.

### 1.1 TypeScript (`tsconfig.json`)

Beyond `strict: true`:

| Option | What it buys |
|---|---|
| `noImplicitOverride` | An `override` keyword is required, so a renamed base method surfaces |
| `noPropertyAccessFromIndexSignature` | An index read must use `obj['key']`, visibly a lookup |
| `noImplicitReturns` · `noFallthroughCasesInSwitch` | No accidental `undefined` return, no fallthrough |
| `noUnusedLocals` | A dead import is a compile error — it is how a deleted describe block announces itself. ESLint configures no `no-unused-vars`, so this is the only unused check there is |
| `noUncheckedIndexedAccess` | `arr[i]` is `T \| undefined`. A missed bounds check is a compile error instead of an `undefined` reaching a reducer |
| `forceConsistentCasingInFileNames` | Import casing can't drift between macOS and the Linux runner |

`angularCompilerOptions` adds `strictTemplates`, `strictInjectionParameters`,
`strictInputAccessModifiers`.

**`noUncheckedIndexedAccess` is deliberately `false` in `tsconfig.spec.json`.** A spec indexes a
fixture it built three lines earlier; an `undefined` there is not a silent fault but a red test with
a TypeError — the signal the assertion exists to produce. Paying for it would mean `?.` on ~140
assertions, weakening the failure message for a guarantee the runner already gives.

Ambient types are opt-in per project: `types: ["dom-chromium-ai"]` (app) and
`["vitest/globals", "dom-chromium-ai"]` (spec). A new ambient package must be listed or it is
invisible.

### 1.2 ESLint

`pnpm run lint` chains three scripts: `lint:plugin-types` (`tsc -p eslint-plugin-commlink`),
`lint:eslint` (`ng lint`) and `lint:styles` (stylelint, §1.5). This section is the middle one. Five
rule sources, composed in `eslint.config.js`:

- **`angular-eslint`** — `tsRecommended` on `**/*.ts`, `templateRecommended` +
  `templateAccessibility` on `**/*.html`. Local overrides: component class suffix must be one of
  `Page` / `Dialog` / `Component`; component selectors are `app`-prefixed kebab-case elements;
  directive selectors are `app`-prefixed camelCase attributes.
- **`@ngrx/eslint-plugin`** — `configs.all`.
- **`eslint-plugin-unicorn`** — `configs.all`, with exactly **four** documented adjustments and
  only one of them an opt-out: `no-null` is **off** (`null` is idiomatic across Angular/NgRx/RxJS);
  `prevent-abbreviations` is at `error` with an `allowList` (`utils`, `prod`) and an `ignore` list
  (`e2e`, `Ref`, `componentProps`); `no-useless-undefined` takes `checkArguments: false`; and
  `prefer-export-from` takes `checkUsedVariables: false`. Each carries its reason inline; add a
  fifth only with one. The bar: an adjustment is for a rule whose *autofix is wrong here*, not one
  that is merely inconvenient.

  This list was wrong until 2026-08-01, and instructively so. It claimed `prevent-abbreviations`,
  `no-keyword-prefix` and `no-manually-wrapped-comments` were "off outright" — all three are at
  `error`, the last two inherited from `configs.all` with no entry in `eslint.config.js` at all. It
  even carried a rationale for the opt-out that does not exist ("would rewrite 2154 hand-wrapped
  comment lines"). Nothing failed, because the suite passes either way, which is exactly why
  §Verifying a config change says to read `eslint --print-config` and never a green run.
- **`eslint-plugin-prettier`** — formatting is an ESLint error on `**/*.{ts,html}`.
- **`eslint-plugin-commlink`** — this project's own, below.

**It is cached and parallel, and it has to be.** `angular.json` sets `concurrency: "auto"` and
`cache: true` (`.eslintcache`, git-ignored). Cold that is ~34s, warm ~3s; without them the same run
was ~99s. The cost is almost entirely Sheriff: `TIMING=all` puts **93.6%** of a cold run in
`@softarc/sheriff/encapsulation` + `dependency-rule` (~51s each), against 2.9s for
`prettier/prettier` and **22ms for every `commlink/*` rule combined**. Reach for `TIMING=all`
before optimising anything here — the two intuitive suspects, the markdown files (870ms, 1%) and
this project's own plugin, were both wrong.

**Editing a rule's source does not invalidate the cache.** ESLint hashes the resolved config
object, not the plugin files behind it, so a changed rule keeps reporting the previous verdict on
every unchanged file. Develop rules with `eslint --no-cache <file>`, and `rm -rf .eslintcache`
before believing a full run. (The builder makes that path a *directory* — `.eslintcache/np-commlink`
— so it is `rm -rf`, not `rm`.)

**The cache invalidates per file, and Sheriff is a cross-file rule.** If A becomes invalid because
B changed — a barrel export removed, so A's import is now a deep import — A's own bytes did not
change and its cached result is reused. CI is unaffected: a fresh container has no `.eslintcache`,
so every CI run is cold. Locally, delete it when you want a definitive answer.

#### `eslint-plugin-commlink` — the nineteen local rules

TypeScript, loaded natively with no build (Node ≥ 22.18 strips types on `require`). `configs.all` is
self-scoping, so `eslint.config.js` spreads it and names no rule.

| Rule | Gate |
|---|---|
| `commlink/a11y-icon-is-hidden-or-named` | R1 — every `ion-icon` is `aria-hidden` or named |
| `commlink/a11y-icon-only-control-has-name` | R2 — an icon-only `ion-button`/`ion-fab-button`/`ion-item-option` has its own name |
| `commlink/a11y-form-control-has-label` | R3 — a control's name comes from itself, never a neighbouring `ion-label` |
| `commlink/a11y-overlay-has-name` | R4 — declarative overlays; `ion-modal` takes `aria-label`, and `aria-labelledby` on it is reported as inert |
| `commlink/a11y-overlay-options-have-name` | R4 — the `ModalController.create({…})` half, via `htmlAttributes` |
| `commlink/a11y-no-actionable-toast-button` | R6 — a toast button with a `handler` is not announced |
| `commlink/a11y-builtin-name-is-translated` | R7 — Ionic's hardcoded English `menu`/`back` are overridden with a translated name |
| `commlink/a11y-aria-label-needs-role` | R8 — `aria-label` only where the role permits a name |
| `commlink/i18n-key-ownership` | `@shared` speaks no domain vocabulary; a domain speaks no other domain's |
| `commlink/ngrx-data-layer-only` | No `@ngrx/*` import outside the sanctioned homes |
| `commlink/testid-is-static` | A `data-testid` is a literal, never composed — what keeps both sides greppable |
| `commlink/marker-argument-is-literal` | `marker(…)` takes a literal, so `i18n:extract --clean` can see the key rather than prune it |
| `commlink/instant-argument-is-marker` | the other half of that pair: a key reaching `TranslateService.instant` unwrapped is invisible to the extractor |
| `commlink/action-event-keys-are-identifiers` | `createActionGroup({ events })` keys are camelCase, not `'Add Item'` |
| `commlink/no-action-type-literal` | Nothing matches on `'[Source] event'` — go through the creator (specs exempt) |
| `commlink/no-barrel-outside-data` | The only `index.ts` is a `<domain>/data/` facade barrel |
| `commlink/spec-resets-mock-selectors` | A spec calling `overrideSelector` also calls `resetSelectors` |
| `commlink/no-testid-on-component-element` | An `app-*` element is already a contract — no second name on it |
| `commlink/e2e-ionic-locator-traps` | The two Ionic locator traps a literal can reveal: an unnarrowed `ion-toast`, and `getByRole('dialog')` |

R-numbers index `docs/ionic-a11y-practices.md`, which defines **R1–R9**. Seven are gated above; the
other two cannot be, and each says so where it is defined:

- **R5** (no action reachable only by swipe or drag) — deciding it means knowing whether a keyboard
  path to the *same* action exists elsewhere in the app, which is not a property of a template.
- **R9** (the viewport never locks zoom) — it lives in `src/index.html`, which is not an Angular
  template and so is in no template rule's file set.

Both stay review matters, permanently. Nothing else in R1–R9 is ungated.

Sanctioned NgRx homes, as `ignores:` on the rule's config block: `src/app/app.providers.ts`,
`src/app/**/data/**/*.ts`, `src/app/@shared/testing/**/*.ts`, `src/app/**/*.spec.ts`.

**These are rules, not `no-restricted-syntax` / `no-restricted-imports` options, for a structural
reason.** Flat config *replaces* a rule's options rather than merging them, so a selector added to
one block was silently dropped wherever a later block set the same rule id — which happened here,
twice. A rule **id** cannot be shadowed that way. When adding a gate, prefer a rule.

**Lint scope covers the whole repo, not just `src/`.** `angular.json`'s `lintFilePatterns` is
`src/**/*.{ts,html}` · `e2e/**/*.ts` · `*.js` · `eslint-plugin-commlink/**/*.ts` · `**/*.json` ·
`**/*.md`, so every block in `eslint.config.js` is a real gate — including the JSON and markdown
sets, which for a while were configured but unreachable. Anything added to the config from here on
runs in CI; there is no longer a quiet half.

The **pre-commit hook is still `src/**/*.{ts,html}`** on purpose: it lints what you are most likely
to have broken, in the time budget a commit can absorb. Everything else is caught by CI.

### 1.3 Module boundaries (`sheriff.config.ts`)

Two-axis tagging, Hahnekamp style. Every folder under `src/app/<domain>/<type>` carries both a
`domain:*` and a `type:*` tag; the shell carries only `type:shell`.

**Type axis** — each layer may reach only downward:

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
cross-domain bridges left. A cross-cutting need is inverted behind a `@shared` contract instead.

`enableBarrelLess: true`, with one exception per domain: `<domain>/data/index.ts` is a facade barrel.
Outside code imports the folder and sees only the public facade; a deep import into
`data/<slice>/…` is a violation.

Two escape hatches, both narrow and both in the config: a spec may reach `type:testing`, and
`type:feature` may reach a `type:feature` module under `/@shared/`.

### 1.4 Prettier

`.prettierrc`: single quotes, `es5` trailing commas, always-parenthesised arrow params, the
`angular` parser for `*.html`. Enforced twice — as an ESLint rule on `**/*.{ts,html}` and as the
standalone `format:check` gate, which covers `src/**/*.{ts,html,scss,json}`, `public/i18n/*.json` and
`eslint-plugin-commlink/**/*.{ts,json}`.

**Markdown is outside every formatting gate** — `docs/*.md` is not prettier-clean, and running
`prettier --write` on one reflows the entire file into an unreviewable diff. Don't.

### 1.5 Stylelint (`stylelint.config.mjs` + `stylelint/`)

`pnpm run lint:styles` over `src/**/*.{scss,css}` — chained onto `lint`, and a pre-commit job of its
own. Unlike the eslint hook it is **not** narrowed to staged files: stylelint needs no type
information and the whole layer lints in under a second.

`stylelint-config-standard-scss` with four groups switched off, each for a reason: the blank-line
family (prettier owns formatting), the colour-notation opinions (`rgba(var(--x-rgb), α)` is a
deliberate idiom here), `media-feature-range-notation` (range syntax vs the Android WebView the APK
ships into), and `scss/comment-no-empty` (a bare `//` is a paragraph break in the doc blocks).
`selector-class-pattern` is **reconfigured, not disabled**, to kebab-case BEM.

Two rules are the project's own, both plain `.mjs` rather than the eslint plugin's TS-no-build trick
— stylelint resolves plugins itself and gets no Node type-stripping:

- **`commlink/font-size-uses-scale`** reads the rung names off `_shadowrun.scss`, so its message
  cannot drift from the scale.
- **`commlink/muted-text-uses-token`** rejects an accent-at-an-alpha as a *text* colour
  (`color: rgba(var(--sr-amber-rgb), α)`, and Ionic's `--color`/`--placeholder-color` hooks) and points
  at `var(--sr-text-dim)`. Scope is deliberately narrow: the same value is right for a tinted fill or
  border (`background` ×5, `border-color` ×1, every `box-shadow`), which carry no contrast requirement
  of their own, and a `--sr-*` property is exempt because defining what "muted" means per theme is the
  theme layer's job — `--sr-text-dim` and `--sr-line` are themselves declared this way.

Exceptions in both go through `/* stylelint-disable-next-line */` at the call site rather than a path
allowlist: local, greppable, and carrying the reason next to the value.

**`--fix` is not all safe here.** `property-no-vendor-prefix` autofixed `-webkit-mask` into a
duplicate bare `mask`, dropping the only thing that clips the trackplay victory beams on pre-15.4
Safari; `value-keyword-case` lowercased `Arial` to `arial` inside the `--sr-sans` stack, where it
cannot tell a keyword from a proper noun. Both are configured off or disable-commented now — read
the `--fix` diff before staging it regardless.

### 1.6 Tests and coverage

`pnpm run test:coverage` enforces a floor: **statements 88 · branches 83 · functions 80 · lines 88**,
over `.ts` only.

Read those honestly: the builder instruments only what the specs pull in, so they measure "of what is
under test", not the app. They are a regression floor, not a coverage claim. (`coverage.include` is
the documented fix and does not compose with `@angular/build:unit-test` — an `include` glob
re-instruments the on-disk sources as a separate uncovered set and the report collapses to 0%.)

**Templates are excluded from the denominator, and that is what the numbers above are worth
reading for.** Until 2026-08-01 the floor was 70/72/68/75 with 62 `.html` files counted in — they sat
at 39% statements and **1.4% functions** against 91%/84% for the `.ts` beside them, which dragged the
aggregate to 76/73.6 and left roughly eight points of room for TypeScript to regress into before
anything spoke. Nothing here asserts rendered Ionic DOM (jsdom never upgrades a Stencil element), so a
template's statements execute only incidentally via the specs that happen to call `detectChanges()`;
rendered behaviour is the e2e suite's. The two i18n bundles are excluded too — a data file imported
through `resolveJsonModule` scores a free 100%. **A threshold is only as honest as its denominator.**

### 1.7 Build

`build:pages` runs on pull requests too — a prod build that no longer compiles is worth catching
before merge rather than at deploy time. The two prod builds differ only in base href: `build` uses
`./` for Capacitor, `build:pages` uses `/np-commlink/` for the subpath deploy.

**Two budgets, both set deliberately** (`angular.json`, production configuration):

| type                | warning | error  | against                                           |
| ------------------- | ------- | ------ | ------------------------------------------------- |
| `initial`           | 1.6 mb  | 1.9 mb | ~1.43 MB — `b0fa7cc`, ~12% headroom               |
| `anyComponentStyle` | 7 kb    | 8 kb   | 6.47 kB (`commlink.page`), 6.11 kB (`game-play`)  |

The component-style pair was Angular's scaffold default (6/10) until 2026-08-01, and **both halves of
it were wrong in opposite directions**: the two most decorated pages in the app — the reference
cyberpunk deck and the trackplay board — had been over the warning for as long as they had been
finished, so every green build printed `2 budget warning(s), non-fatal` and the number stopped being
read; while a 10 kB error was never going to fire, since nothing here is within 3 kB of it. A
threshold that always speaks and a threshold that never can are the same failure. 7/8 clears both
pages and puts the ceiling one page-sized step above them, so the next stylesheet to grow says so.

**A warning is not a gate**, which is exactly why this matters: `maximumWarning` cannot fail CI, so
its only function is to be read — and `scripts/verify-all.sh` surfaces the count in the build card's
footer for that reason.

**Only `build:pages` is gated, deliberately.** Compiling `build` as well would be a second full
production build per run for a difference of one string substituted into `index.html` — there is no
failure the pages build would miss and the Capacitor one would catch. `verify:pages` then serves what
`build:pages` wrote and requests it from the subpath, which is the half that can actually break.

`pnpm install --frozen-lockfile` is a CI gate with no local counterpart, on purpose: `verify-all.sh`
reads a working tree whose `node_modules` is already installed, and running an install inside a
pre-push hook is how you get a half-deleted dependency tree mid-verify. The consequence is worth
knowing — edit a dependency without re-installing and the hook passes while CI fails on the lockfile.

### 1.8 Analyzers that are not gates

Two static-analysis configs are tracked and wired into nothing. Neither is dead; both are run on
demand, and this section exists because the first reviewer to grep for them proposed deleting them.

- **`sonar-project.properties`** — for a local SonarQube (a Podman `sonarqube:community` on :9000;
  the server is not part of the repo). Run `pnpm test --coverage --coverage-reporters lcov`, then
  `SONAR_HOST_URL=… SONAR_TOKEN=… pnpm dlx @sonar/scan`. The scanner runs natively rather than
  containerized: `sonarsource/sonar-scanner-cli` is amd64-only, and a container mount breaks coverage
  import because the v8 lcov carries absolute host paths. The two suppressed rules (Ionic click-a11y
  false positives, Sass `@use`-before-`@import`) live in the properties file rather than a server-side
  quality profile so the reasoning travels with the code. Not in CI, and not to be added to it without
  deciding gate semantics first — the quality gate asserts only on *new* code, so a first analysis
  passes vacuously.
- **`qodana.yaml`** — JetBrains' generated starter profile plus one inspection (`TrivialIfJS`). IDE
  scaffolding rather than a decision; nothing has consumed it.

---

## Part 2 — Not enforced

Convention. Nothing rejects a violation, so these are the ones to actually hold in your head.

### 2.1 Comments and function shape

**Speaking code instead of comments.** Only ever comment the *why* — never the *how*. If you feel
the urge to write a comment explaining what a block does, extract that block into a well-named
function instead. The comments that earn their place are non-derivable rationale: a domain rule, a
workaround for external behaviour, a trade-off someone would otherwise "fix".

**Skeleton → execution.** Prefer small functions with human-readable names; the top-level function
reads as the list of steps, each step a named call a reader descends into only if they care.

### 2.2 Naming

- **Facade file shapes — four.** `<domain>.facade.ts` is the domain's general facade.
  `<aggregate>-page.facade.ts` is reserved for implementations of a shared page contract token
  (`LIST_FACADE` / `CATEGORY_LIST_FACADE`) — **the `-page` suffix encodes a token binding, not
  page-ness**. `<aggregate>.facade.ts` is an aggregate facade binding no token. And
  `<contract>.facade.base.ts` is an **abstract** base such an implementation extends — currently one,
  `BaseCategoryListPageFacade` in `@shared/data/categories/`, which two of the three
  `CATEGORY_LIST_FACADE` bindings inherit their nine bodies from (`a863f25`). It is in `@shared/data`
  rather than `@shared/util` because it injects `Store`; the no-NgRx half of the same contract, the
  `ICategoryListPageFacade` token, is a layer down in `@shared/util/categories/`. Why the third
  binding does *not* extend it is a recorded decision in `open-tasks.md` §12 — `cash`'s catalog carries
  its own cascades, so four of the nine bodies would be overridden, which is a base with hooks for one
  caller.

  The first name token follows the *aggregate*, not the domain folder: `GroceryListPageFacade` matches
  the `grocery-list` engine, not the `groceries` domain.
- **Action-group event keys are camelCase identifiers**, never quoted title-case: `addItem:`, not
  `'Add Item':`. **Enforced** by `commlink/action-event-keys-are-identifiers` and
  `commlink/no-action-type-literal`. The point is that the wire string and the code you write are the same token, so an
  action is greppable by the one name it has. **Nothing may match on that string** — use the creator
  (`ofType(Actions.addItem)`, `case Actions.addProduct.type`). Parsing the *source* prefix is still
  fair game, since that is a slice identity rather than an event name.
- **Effect casing tells you the kind.** A domain's hand-written effects are `@Injectable` classes
  (`TrackingEffects`); effects assembled from the shared builders are exported as functional objects
  (`tasksListEffects`) — because NgRx dedups same-class instances across injectors, so a shared
  *class* in two lazy contexts would double-dispatch.
- **An empty effects class is dead code, not a placeholder.**
- Types are sliced by concern, never a god file and never a barrel:
  `<domain>/model/<concern>.types.ts`. The barrel half is **enforced** by
  `commlink/no-barrel-outside-data` — Sheriff's `enableBarrelLess` governs how imports resolve, not
  whether one gets created.

### 2.3 Never compose an identifier at the call site

The single most repeated lesson in this codebase, in three places:

- **i18n keys** — a key built from a template string is invisible to `i18n:extract --clean` and gets
  pruned. Every family that used to be composed is a `marker(...)` const. The acceptance test is that
  running the script leaves `git diff public/i18n/` clean. **Enforced** by
  `commlink/marker-argument-is-literal`.
- **`data-testid`** — `'row-' + item.id` in a template and `getByTestId('row-milk')` in a spec share
  no literal, so neither half is greppable. A repeated row carries a static `list-row`; *which* row
  comes from user-visible content (`filter({ hasText })`).
- **Deck entry ids** — never renamed, because absence means default and a rename would need a
  migration hop.

### 2.4 The `data-testid` contract

Anything a spec locates that is not *already* a contract carries a `data-testid`. Ionic element
names, tag names, CSS classes, icon names and translated text all describe styling rather than
identity, so a re-theme can redden a green suite with no behaviour change.

- A component element name (`app-page-cash`) **is** already a contract — don't add a second name.
  **Enforced** by `commlink/no-testid-on-component-element`.
- Add an id only where a spec locates something *today*.
- **Never compose one** — `commlink/testid-is-static` enforces it (gate 1). This is the invariant
  everything else rests on: both halves of the audit match a *static literal* on each side, so a
  composed id silently drops out of the declared set and the dead-id check stops seeing it.
- `pnpm run verify:testids` decides the two decidable directions — an id no spec references, and a
  spec referencing an id no template declares. It is **gate 4 in CI** (60ms). It stays a script
  rather than a rule because both directions are whole-repo set differences, the one shape a
  per-file linter is worst at; answering them in a rule needs a cached cross-file index, which with
  `cache: true` would go stale exactly when it matters. The third case — a spec that ignores the ids
  entirely — is not decidable from the two file sets and stays a review matter.

### 2.5 Testing

Lean, not exhaustive. No 100% coverage target.

- **Pure logic** (`*.spec.ts`): utils, pipes, reducers, selectors via `.projector(...)`. No `TestBed`
  where a plain call suffices.
- **Component class logic**: `TestBed.createComponent(...).componentInstance` + `provideMockStore()`
  + `provideZonelessChangeDetection()`. **Whether `detectChanges()` is allowed depends on what the
  template embeds.** jsdom never upgrades a Stencil element, so an `ion-*` host is inert — but
  Angular still renders the light DOM around it. So a *dumb* component may call it and assert its
  own output (**28 call sites across 8 specs**), while a page or smart component whose template embeds
  Ionic-heavy children must not, because what it would assert is a shell. This is a judgement about the
  template, not a blanket ban, which is why it is here and not a lint rule — a rule on the blanket
  wording would fail all 28 correct call sites.

  Audited 2026-08-01: **zero violations.** Six of the eight are dumb `ui` components; the two that are
  not each say in place why they are safe — `item-list-quick-add` asserts `app-text-item`, a component
  element it renders itself, and `list-settings.page.spec.ts` carries a comment noting the page reads
  settings without touching the router. Reads split 22 `getByTestId` / 9 `querySelector`, so "all
  reading `getByTestId(fixture, …)`" was wrong too.

  **The old figure, 33 sites across 12 specs, was a grep artifact**, and it is the reason this entry
  now names the method: four *page* specs contain the string `detectChanges()` only inside a comment
  saying they deliberately do **not** call it, so a plain grep counts a spec's stated compliance as a
  violation and inflates the total by exactly the files most careful about the rule. Filter comments
  out, or grep for `fixture.detectChanges` — see §2.7.
- **Effects stay RxJS.** Rely on Vitest `globals: true` — do **not** `import` a *value* from
  `'vitest'`. `import type` is the exception and a necessary one: `vitest/globals` declares the
  globals but not every type, so `MockInstance` has to be imported.
- Facades are root singletons: a spec overriding a selector between two `createComponent` calls must
  `store.refreshState()`.
- Spec files share a module registry, so a `MockStore` override outlives the file that set it —
  always `afterEach(() => store.resetSelectors())`, or the leak surfaces as a spec that passes alone
  and fails in the suite. **Enforced** by `commlink/spec-resets-mock-selectors`.
- **Five Ionic locator traps** cost a red spec every time they are rediscovered; they are worked
  through with examples in `CLAUDE.md` and `docs/testing.md` §10. In short: scope to
  `app-page-<x>`, key a presented overlay off its *title* (`.show-modal`), click the `ion-select`
  *host*, use `goto` + `reload()` when bouncing between routes, and narrow `ion-toast` with
  `:not(.overlay-hidden)`. **Two of the five are gated** by `commlink/e2e-ionic-locator-traps` — the
  unnarrowed toast, and `getByRole('dialog')`, which matches nothing because Ionic puts the role on
  a wrapper inside the shadow root. The other three depend on what the spec is *doing* rather than
  on a literal it contains, so they stay prose.

### 2.6 Theming

**Do not restyle components one by one — retheme the CSS custom properties.** Component SCSS must
reference tokens (`--sr-deck-font`, `--sr-heading-transform`, `--sr-radius`, `--sr-glow`), never
hardcoded `uppercase` / `letter-spacing` / `--sr-mono`. Plain is the base `:root`; cyberpunk is the
opt-in `:root[data-theme='cyberpunk']` block, so a new surface reads plain unless it asks not to.
Never `@use 'theme/shadowrun'` from a component — it emits global CSS.

**Muted text is `var(--sr-text-dim)`, never the accent at an alpha** — **enforced** since
`commlink/muted-text-uses-token` (§1.5). A literal *inside* the cyberpunk block is a different thing
and is sanctioned: `commlink.page.scss`'s three hero `letter-spacing` values sit under
`:host-context([data-theme='cyberpunk'])` precisely because the base uses the tighter
`--sr-label-tracking`, which is the documented escape for an axis no single token spans. The rule
that matters is that a *theme-varying* value is either a token or inside the opt-in block — never a
bare literal in the base rule.

Adding a theme is partly compile-enforced (`THEMES`, `THEME_LABEL_KEYS`, `THEME_COLOR`,
`DEFAULT_ACCENT_SWATCHES`, per-entry `labels` and `DECK_CHROME_LABELS` are all `Record<TTheme, …>`)
and partly not — the message bundles have to be filled in by hand, and `deck.catalog.spec.ts` is what
catches a missing key.

### 2.7 Gate discipline

- **Verify a new gate by breaking what it should catch.** A green assertion proves nothing until it
  has been seen red for the right reason.
- **Verify a diagnostic query before scoping work off it.** A `grep -Lq` inversion once faked a
  ~70-component backlog; counting colocated `*.spec.ts` files is not coverage; grepping templates for
  `aria-live` cannot see what a web component puts in its shadow DOM.
- **A grep over source counts the prose as well as the code**, and in a codebase whose comments name
  the rules, that biases the count *toward* the careful files. One audit produced three false findings
  the same way in one afternoon: `detectChanges()` in four comments saying not to call it (§2.5's
  figure was wrong for years because of it), `overrideSelector` in a comment explaining that the spec
  stopped using it, and a `commlink/testing` "violation" that was the new sentence *saying* the folder
  does not exist. Filter comments out, or match the call shape (`fixture.detectChanges`), before
  believing a count — and treat a suspiciously tidy number as a reason to look at the lines.
- **A shell idiom can lie about a gate.** `tsc … | tail -2 && echo clean` prints "clean" whenever
  `tail` succeeds, which is always. Check `$?`, or run the command bare.
- **One artifact, two writers is always a bug in the making.** Either one tool owns a file's bytes,
  or you force the outputs byte-identical.
- When changing `eslint.config.js`, check the result with `eslint --print-config <file>` — **never
  with a passing suite**. A dropped rule option makes a gate inert, and inert gates pass.

### 2.8 Dead exports

Nothing detects them. `noUnusedLocals` and ESLint both treat an `export` as used by definition, and
`knip` / `import/no-unused-modules` were considered and deliberately rejected — a new dependency and
a per-push cost for something WebStorm's *Unused global symbol* inspection already reports live.
The sweep is a manual **Analyze Code** run at release-prep time.

### 2.9 Git

Trunk-based: work on `main`. If you must isolate, prefer a worktree over a branch and keep up with
main. Commit messages explain the *why* — the git log is where the decision record lives, and
`docs/open-tasks.md` §12 carries what is still open.

Nothing has been pushed yet: the remote holds zero refs, so CI has never run. Web and APK ship
together, and the first push waits on an Android signing keystore.
