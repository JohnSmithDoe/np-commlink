# np-commlink — project review, 2026-08-01 (resolved)

A full read of the state of the project: what is good, what is bad, what to simplify, and what is
broken. **Every finding below has been actioned** — fixed, or declined with the measurement that
killed it. All thirteen gates are green.

Findings already recorded as decided in `docs/open-tasks.md` §12–13 were excluded from the review, so
nothing here re-litigates a settled call.

**Headline:** the codebase was, and is, in good shape. The gaps were not architectural — four real
bugs on user-facing paths, one significant gate hole, provably dead code, and a compendium that had
drifted behind the code in about a dozen measurable places.

## Where we stand

- 340 source files / ~24k LOC, 178 unit specs (1268 tests), 26 e2e spec files (63 tests).
- **Zero `any`, zero non-null assertions, three `eslint-disable`s** in the whole tree.
- No `.skip` / `.only` / `test.fixme` anywhere.
- **Thirteen** gates in `scripts/verify-all.sh`; CI ⊇ verify-all and verify-all ⊇ CI, gate for gate.
- 592 i18n keys, identical key sets in both bundles, **zero dead keys**.
- Still zero refs on the remote — nothing pushed, blocked on the keystore. Recorded and correct.

### What is genuinely good

- **The domain seal works.** Sheriff's type and domain axes are enforced, and the recorded
  architectural decisions held up under spot-check: store keys, route paths, per-subtree page counts
  and the deck catalog counts all match what the docs claim.
- **The base classes earn their keep** — `BaseModalDialog` (7 subclasses), `BaseEditItemDialog` (6),
  `BaseSwipeRow` (3), each carrying a rationale for why the *base* owns the invariant.
- **Comment discipline is real.** A sweep for "comment restates the code" found essentially nothing.
  The only comment debt that existed was **duplicated rationale** — the same paragraph in two files,
  which is a tell about the code, not the comment. Three such pairs are now single-sourced.
- **The frightening logic is correct.** Independently re-derived: the Meeus/Jones/Butcher Easter
  algorithm, `eurToCents`, the trackplay cascades, the RFC4180 CSV split, `runMigrations`' ladder
  indexing, the tracking pause/resume arithmetic, and `distinctUntilChanged` as the save trigger.

---

## 1. Bugs — four found, four fixed

Each has a spec that fails without the fix; each was verified to fail by reverting the fix.

| # | Defect | Fix |
| --- | --- | --- |
| B1 | **A merging category rename silently stripped the item's category.** The catalog merge remapped stored rows; the open dialog's draft still held the retired id and put it back on save. Silent, unrecoverable, all four category dialogs. | `mergeTargetForRename` extracted so the reducer and the draft reach one verdict; the draft is remapped by the same `remapCategoryRef` the reducer uses. `0ebf50f` |
| B2 | **The four office-time stat cards froze at the last slice write.** `calculateStats` read `dayjs()` inside projectors memoized on the slice — the exact trap the facade documents three lines above the affected fields. | The clock is a parameter; the cards derive against the refreshable `today` the "log today" button already used. `9d6d87a` |
| B3 | **A category op inside an open cash modal reverted every unsaved field**, and flipped the rule modal into create mode mid-edit. | `BaseModalDialog` reseeds on `editId` — identity, not the live `existing` reference. First spec for the base. `4d29769` |
| B4 | **The recipe matcher counted a `quantity: 0` pantry row as stock**, so `/soykaf` called a recipe cookable while the low-stock tile flagged the same item as out. | A `quantity > 0` predicate. Not the deferred pack-size work — presence-only, no unit conversion. `3be9a8e` |

Two latent inconsistencies went with them (`107f805`): `compareByOptionalText` sorted a missing field
*first* ascending, contradicting the invariant its two siblings hold and its own spec pinned "as-is
rather than as intended"; and a new cash rule took `order: rules().length`, which collides with a live
order after any delete.

## 2. Gates

**`e2e/` was type-checked by nothing** — no tsconfig project reached it, and Playwright transpiles
with esbuild, so 28 files had no type-check at all. `tsconfig.e2e.json` plus a thirteenth gate closed
it (`841df2b`).

That fix corrected the review, too. Removing `tsconfig.json`'s `references` — which look like dead
weight, since no child sets `composite` — turned **178** spec files into "not found by the project
service". The array is what typescript-eslint's `projectService` walks to decide which project owns a
file. It stays, with a note saying which tool reads it.

**Coverage thresholds measured the wrong denominator** (`f59f011`). 62 templates sat in it at 39%
statements / **1.4% functions** against 91%/84% for the `.ts` beside them, dragging the aggregate to
76/73.6 — so the 70/72/68/75 floor allowed ~8 points of TypeScript regression before speaking.
Templates and the i18n bundles are excluded; the floor is now 88/83/80/88 over `.ts`.

Two gate gaps were examined and **declined**, with the reasoning in `docs/coding-conventions.md`
§1.7: gating `pnpm run build` as well as `build:pages` is a second full production build for a
one-string difference no failure mode distinguishes; and `--frozen-lockfile` has no local counterpart
because running an install inside a pre-push hook is how you get a half-deleted dependency tree
mid-verify.

## 3. Simplification

**Deleted** (`5befa89`) — each proved by grep before removal: three action creators nothing
dispatches, eight of ten re-exported router selectors, one dead class binding, four exports narrowed
to their file, seven redundant devDependencies (all pinned by the `typescript-eslint` /
`angular-eslint` umbrellas the config actually loads), and `serve:prod`, which invoked an `ionic` CLI
that is not installed.

**Moved** (`cd1fee2`): `LocalizedDatePipe` to `cash/util/`, where all four consumers are; and
`reorderedIds` beside `moveInList`, so the `complete(false)` trap — the half that stayed duplicated
after the pure half was extracted — has one home. Plus the two pipe `transform()`s no test executed.

**Extracted**: `trackplay.reducer.ts` 400 → 167, its 250 `@ngrx`-free lines moving to
`trackplay/util/` as the file's own banners already grouped them, and seven same-shape handlers
collapsing to `patchGame`/`patchListConfig` (`0b6ca52`). The rule editor's 135 module-level lines to
`cash/util/rule-form.utils.ts`, which made `toStoredThreshold`'s "a stored threshold is always
German" invariant testable by plain call instead of through `TestBed` (`d51285a`). GEIST's session
lifecycle to a page-provided `GeistSessionService`, leaving the page its transcript (`d749523`).

**Deduplicated**: the two byte-identical catalog facades now share nine method bodies (`a863f25`), and
the "resolve the entity, don't stub it" rationale — shipped verbatim in two files — has one home
(`99f5d33`).

**Declined, with the measurement** (all recorded in `docs/open-tasks.md` §12 so they are not
re-flagged): the `deck.hud-label` mixin adoption costs 192 bytes on an already-over-budget stylesheet
to share two `var()` reads; the grocery facade's eleven per-list methods buy a type pairing a collapse
would soften to a union; and three of the five facades the review flagged as "the same eight methods"
share only a *shape* — cash's catalog carries its own cascades, and tracking has no categories at all.

**`@capacitor/app` stays.** Nothing imports it and nothing declares it as a peer, but it is a *native*
plugin: removing it changes Android's hardware back button, `android/` is regenerated and untested
here, and no gate can see the difference.

## 4. Docs

A dozen load-bearing claims had drifted (`3b0e1d4`). The gate count appeared as eight, nine, eleven
and twelve against thirteen in the runner. `coding-conventions.md` described three unicorn rules as
disabled while all three sat at `error` — two with no config entry at all — and carried a rationale
for an opt-out that does not exist, which is exactly the failure `--print-config` exists to catch. The
a11y set is R1–**R9**, with both permanently-ungated rules now saying why in one place. The local rule
table listed eighteen of nineteen. Smaller: 592 keys not 582, `ng2-charts` 9 not 10, 33
`detectChanges` sites not 34, pnpm 11.18 not 11.9, and `i18n:extract` writes both bundles.

One claim was stale in the *code's* favour: `tasks` and `tracking` have not held "switch-free copies"
of the list effects with a `listId` guard since the shared builder replaced both.

New: **§1.8 for the two analyzers that are tracked and run by nothing.** Neither is dead — SonarQube
has a local recipe and two deliberate rule suppressions — and the section exists because the first
reviewer to grep for them proposed deleting them.

## 5. i18n

**An English session was answered in German** (`d841f07`). GEIST's three personas hardcoded
"Antworte auf Deutsch…" into the system message and declared `expectedOutputs: ['de']`;
`systemPrompt` is a `Record<TLanguage, string>` now, read at session-open. It stays in code rather
than a message bundle for the reason the type already gave — a prompt steers the model, so a
translator's edit would change answers, not labels — and a Record makes a third language a compile
error at every persona.

The notification debug fixture wrote three German title/body pairs straight into the persisted inbox,
making the one producer not following the inbox's translate-at-publish convention the fixture written
to exercise it. Six keys, both bundles.

`src/index.html`'s `<meta name="description">` is German-only and stays so: it is read before any app
code runs, like `<title>` and the manifest's `name`. It is now the third such string rather than an
undocumented one.

---

## Verification

`./scripts/verify-all.sh` — all thirteen gates green: sheriff · test-ids · plugin types · tsc ×3 ·
stylelint · prettier · eslint · 1268 unit tests · 63 e2e · production build · pages subpath. The two
budget warnings on `commlink.page.scss` and `game-play.page.scss` are pre-existing and non-fatal.
