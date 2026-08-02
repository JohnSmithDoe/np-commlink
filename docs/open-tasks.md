# Open, deferred, blocked — and what was decided not to build

Part of the np-commlink compendium; index: [project-summary.md](./project-summary.md). Settled
questions live in [decisions.md](./decisions.md).

**Check this file before proposing work.** Almost nothing below is merely undone — every item in the
first three groups needs something the repository cannot supply on its own: a secret, an upstream
release, a human reading the result, or a product decision.

## Blocked — needs something only the owner can supply

- **Nothing has ever been published, and the first push waits on the keystore.** `git ls-remote
  origin` returns zero refs and there are no tags, so `.forgejo/workflows/ci.yml` has never executed
  and the Pages URL serves nothing. The owner's decision (2026-07-29) is that **web and APK ship
  together**, so the first push, the first CI run and the first tag all wait on the keystore below
  rather than shipping the PWA alone. Everything else is in place and verified locally; two
  prerequisites live in repo settings (Actions under _Units_, the Forgejo `pages` webhook) and must be
  done before the first tag. The APK is attached to the release by hand — CI builds none, so the
  signing key never reaches a runner.
- **APK signing — the wiring is done, the key is not.** The `signingConfig` is postsync patch 5 and
  reads four `NPC_*` env vars, so all that is missing is a keystore the owner generates (Android
  Studio → _Build → Generate Signed App Bundle / APK_, or `keytool`; 25+ year validity, since an
  expired cert cannot sign upgrades and the key cannot be swapped). Verified end-to-end with a
  throwaway key on 2026-08-02: unset → unsigned and a clone still builds, partially set → a named
  failure, all four → `app-release.apk` verifying v2 + v3
  ([build-and-deploy.md](./build-and-deploy.md)). What remains is the owner's, and it is custody, not
  code: **back the keystore up in two places before the first signed build.** The key is a one-way
  door — an APK signed with a different key can never upgrade one signed with the old key, at any
  version, and the only way in is an uninstall that wipes every tracked session, the pantry and the
  ledger. It is also deliberately **not** in the repo despite the AGPL: publishing the source is the
  licence's demand, publishing the identity would let anyone ship a build that upgrades over a real
  install and inherits its data. Two follow-ups once the key exists: paste the signer SHA-256 into the
  README's _Verify a release APK_ placeholder, and publish the APK's `sha256sum` with the tag.
- **A DKB import driven live.** The parser is unit-tested (`dkb.parser.spec.ts`, inline rows carrying
  the layout `dkb.parser.ts` documents), but only Volksbank has been driven end-to-end in-app.
- **`en.json` read by a human.** Both bundles hold the same 592 keys and only 75 values are identical,
  so the great majority are real translations — but nothing could render them until the language
  switch shipped. The first English session is also the first proofread. (Recount before citing: this
  read 582/74 for a while after the bundles grew.)
- **The PWA icons declare `"purpose": "maskable any"` at every size.** One bitmap serving both
  purposes wastes the maskable safe-zone padding in the `any` context. Worth splitting only if the
  home-screen crop ever looks wrong on a real device. (`public/icons/*` were never timetracker
  placeholders — all 8 sizes carry the np mark, landed in `8601ac3`.)

## Waiting on upstream

- **Angular 22 — gated on NgRx.** Angular `22.0.8` is `latest` (2026-07-22); we are on `21.2.18`, the
  `v21-lts` line, so this is supported and not urgent. The gate is `@ngrx/*`: `latest` is still
  `21.1.1` with peer `@angular/core: ^21.0.0`, and `next` is only `22.0.0-beta.0`. NgRx is the spine
  here — a `data/` layer in every domain, and the persistence and list-flow effects are _builders_
  every context instantiates — so forcing it would mean pnpm overrides on an untested combination.
  **Bump when `@ngrx/*@22` is stable.**
  - **Lockstep set — one atomic commit or none:** `@angular/*` + `@angular/cli` + `@angular/build` +
    `angular-eslint` (22.1.0 peers `@angular/cli >=22 <23`, so it cannot move early) + `@ngrx/*`.
    Their peer ranges are mutually exclusive across the v21/v22 boundary.
  - **Already compatible:** `@ionic/angular` 8.8.x, `@ionic/storage-angular`, `ng2-charts` 9,
    `@ngx-translate/*` 18, Sheriff.
  - Run `ng update @angular/core@22 @angular/cli@22` against `angular.dev/update-guide` 21→22; do not
    hand-edit `package.json`. Its own commit — a framework major on top of other changes makes a red
    gate unattributable.
  - **pnpm holds back releases hours old, and it looks exactly like a stuck resolver.** pnpm 11.9
    applies a default `minimumReleaseAge` cooling-off (nothing sets it in `pnpm-workspace.yaml`), so
    `pnpm update` silently declines a version its range permits — measured 2026-07-30:
    `@angular/core@21.2.19`, published 17.4 h earlier, was withheld while `@angular/cli@21.2.19`
    (same number, published three weeks earlier) installed fine. **That asymmetry is not a skew to
    fix.** The trap is the escape hatch: `pnpm add <pkg>@<version>` bypasses the gate by appending to
    `minimumReleaseAgeExclude` — a supply-chain control quietly widened to win a patch bump. **Prefer
    waiting.** The Angular family is additionally all-or-nothing: its intra-family peers are **exact**
    (`@angular/common@21.2.19` peers `@angular/core: '21.2.19'`), so one held-back member pins the set.
- **An Angular bug worth filing.** Angular pushes every control binding onto a same-named directive
  input, and `FieldState.pattern` defaults to a shared `computed(() => [])` rather than `undefined`,
  so a bound `ion-input` gets `pattern=""` — a pattern matching only the empty string, leaving the
  native input permanently `:invalid`. Harmless here (no `<form>`, no submit, no `:invalid` styling),
  latent anywhere that reads native validity. Custom controls dodge it: the binding is only written
  onto the host when the host accepts the native property, which `app-money-input` does not.

## Deferred on a decision, not on effort

- **Reordering the deck from the grid itself.** The model has always supported it
  (`DeckFacade.reorder(ids)` takes the complete resolved order, which is what an `ionReorderEnd`
  produces). What stops it: a tile **is** a navigation link, so a drag competes with the tap that
  opens the program — it needs a long-press-to-arm mode or an explicit "arrange" toggle, a UX choice.
  The capability already has a home on `/commlink/deck`.
- **A persistent side menu on desktop (`ion-split-pane`).** The menu is an overlay drawer behind a
  hamburger at every width, including 1920px, and Ionic's own answer is a `split-pane` with a
  `when=` breakpoint — the catalog behind it already serves both surfaces
  ([deck-catalog.md](./deck-catalog.md)), so the navigation model needs nothing. What defers it is
  reach, not effort: the wrapper goes in the app shell, and every page header currently renders an
  `ion-menu-button` that would have to disappear above the breakpoint rather than sit next to a menu
  that is already open. The width work it would have collided with is done — a list page's column and
  its header now share one property (`theming.md`), so a shell can shrink the available width without
  anything re-deriving its own edge.
- **A `field-note` READ idiom, if a sixth dialog wants one.** The presentation is shared (the global
  `.sr-field-note`); what stays per-dialog is how each reads its errors — `invalid()`,
  `some(kind === X)`, `some(kind !== X)`. A shared `hasErrorOtherThan(field, kind)` is two lines and
  still not worth extracting for five call sites. Note the asymmetry those reads encode deliberately:
  an empty money box leaves save disabled without a note (it is the initial state), while an empty
  **name** does say so — the box was seeded from an item or the search term, so blank means the user
  cleared it.
- **The emoji picker's `ion-input` `end` slot is experimental.** Ionic 8 documents `start`/`end` slots
  on `ion-input` but implements them with _simulated_ rather than native slots, so behaviour "may not
  exactly match". It renders and clicks correctly in the e2e run and on the web build; the Android
  WebView is the one target not covered by a gate. The fallback needs no redesign — the identical
  `ion-button` moves to the wrapping `ion-item`, one level out.
- **`emoji:build` is run by hand, not by CI.** The output is committed, so the build never needs the
  network and a stale artifact cannot break a release — it can only miss emoji added by a newer
  Unicode release. A gate that re-ran the generator and diffed would need `emojibase-data` installed
  in CI for a check that fires once a year.
- **The picker offers no skin-tone choice.** CLDR nests tone variants under each base emoji (`skins`)
  and the generator drops them — 1644 entries would become several thousand, for a picker whose job is
  decorating a household item name. `extractEmoji` already keeps a tone modifier attached to its glyph, so a
  name pasted with one survives the round-trip.

## SOYKAF recipe book — v2

The constraint shaping all of it: the check is **presence-only** ("in storage" / "missing"), never
"you are 200 ml short" — storage counts packages while a recipe asks for a measure, and nothing
converts a bottle into ml.

- **Cook → subtract** ingredients from storage; missing ingredients → push into `_shopping`. (v1's
  missing list is deliberately read-only.) A product decision: it makes cooking mutate stock.
- **Base unit on `Product` + pack sizes** (milk → `ml`; 0.5 l / 1 l bottles) — the purchase-unit vs
  consumption-unit bridge a quantitative answer requires. **Open only if presence-only proves too
  weak**, because the cost is real: `StorageItem.quantity` becomes a base-unit amount, which pools
  distinct packs into one number and so **destroys per-pack `bestBefore`** (two bottles with different
  dates become "1000 ml" with one date). Half the schema exists already — `Product` has carried
  `unit`, `packaging` and `packagingWeight?` since kitchen-bot, unread by the matcher.
- **Recipe photos.** A slice persists as one key/value doc (recipes ride inside `npc-household`) that
  the generic save effect rewrites wholesale on every mutation, so base64 images would ride inside the
  text document. Needs a place for binaries first.

## Looked at, deliberately not changed

**The list dialogs' field tree spans the whole draft, though only `name` is bound.** Raised as a cost
on the interaction path: `patch()` replaces the draft object, so every unrelated edit recomputes the
root `childrenMap` and re-aggregates `canSave`. Read against `@angular/forms` 21.2.18 it is far
cheaper than it sounds, and the fix would be worse than the cost — `childrenMap` is a `linkedSignal`
that **reuses** child nodes across recomputes (`prevData.byPropertyKey.get(key)`), so a patch is an
`Object.keys` walk plus Map lookups rather than a tree rebuild; `valid()` is a memoized `computed`
and `reduceChildren` passes `shortCircuitFalse`, so validity stops at the first invalid child; and
scoping the form to the validated field would give back the two things the conversion bought (the
tree **is** the write-back channel for `[formField]="form.name"`, and `canSave` comes from the schema
instead of a hand-written conjunction). Revisit only with a measurement, on a real draft — a
12-ingredient recipe is the worst case.

## Considered and not built

Kept so their absence doesn't read as an oversight.

- **`office-time → tracking`.** An early design had office-time read a tracking read-model selector;
  the realized office-time is standalone and only reports telemetry.
- **`notify({ level })` as a generic action.** The realized contract is `NotificationsActions`.
- **"Every context lazy" did not survive contact with the notification inbox.** `feature/fully-lazy`
  routed both remaining eager sinks. Routing the inbox forced a durable-write port; that port is gone
  and the inbox is eager again, for the same reason the dashboard read-model always was. **Uniform
  lifecycle was the wrong goal** — the right one is a lifecycle matching where a slice is written and
  read. No _supplier_ feature slice is eager.
- **A theme-composed i18n keyspace.** The original deck-label plan claimed "a third theme is a new
  JSON block, not a code change". Composing keys from `theme + id` made all 60 invisible to `--clean`,
  and a missing theme could only surface at runtime as a raw key on screen. Declared
  `Record<Theme, …>` fields turn it into a compile error.
- **A CI i18n freshness gate** — the formatting flags removed the need.
- **Closing `metric?: string` into a union** — keeping `metricKey` on the entry was preferred for
  consistency, at the cost of repeating three `marker('deck.metric.count')` literals.
- **`@ngrx/component-store` or a `signalStore` for dialog state** — `signal` + `computed` was the
  whole requirement.
