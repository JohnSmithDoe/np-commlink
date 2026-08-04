# State — blocked, one-way doors, waiting on upstream

**Check before proposing work.** Nothing here is merely undone: each needs a secret, an upstream
release, a human reading the result, or a product decision. Settled questions are in
[decisions.md](./decisions.md).

## One-way doors — the window closes at first publish

Every field below is one a distribution channel compares to decide *same app or different app*, and
the first artifact that reaches a user freezes it. **Nothing has been published yet**
(`git ls-remote origin` returns zero refs, no tags, CI has never run), so all of them are still free.

- **The signing key does not exist yet, and custody is the whole task.** The `signingConfig` is
  postsync patch 5 and reads four `NPC_*` env vars; `pnpm run apk:signed` resolves them into its own
  process only. Verified end-to-end with a throwaway key (2026-08-02): none set → unsigned and a clone
  still builds, some set → a named `GradleException`, all four → `app-release.apk` verifying v2 + v3.
  **Back the keystore up in two places before the first signed build**, with 25+ year validity — an
  expired cert cannot sign upgrades. An APK signed with a different key can **never** upgrade one
  signed with the old key, at any version; the only way in is an uninstall that wipes every tracked
  session, the pantry and the ledger. Deliberately **not** in the repo despite AGPL: publishing the
  source is the licence's demand, publishing the identity would let anyone ship a build that upgrades
  over a real install and inherits its data.
- **`enableV3Signing = true` must be on from the first release.** It is set explicitly against AGP's
  default at `minSdk 24`. v3 carries the proof-of-rotation lineage, and an APK first published without
  it can never be rotated afterwards.
- **`manifest.id` is `"np-commlink"`** and is parsed as a URL against the **origin**, not the manifest
  URL — a leading or trailing slash is a *different* identity. Declaring an id that differs from the
  one a client installed under makes the browser see a second app, with its own IndexedDB and no route
  to the first one's data. Write once, never touch.
- **Renaming a persisted key or a deck entry id is free only until the first release.** The
  `groceries → household` rename abandoned two persisted identities knowingly
  ([decisions.md](./decisions.md)); after the first release either needs a ladder step.

## Blocked — needs something only the owner can supply

- **The first push, the first CI run and the first tag all wait on the keystore.** The decision
  (2026-07-29) is that **web and APK ship together** rather than shipping the PWA alone. Two
  prerequisites live in repo settings, not git, and must be done before the first tag: Actions enabled
  under *Units*, and a Forgejo **webhook** targeting the Pages URL with branch filter `pages`. The APK
  is attached to the release by hand — CI builds none, so the signing key never reaches a runner.
- **Two follow-ups once the key exists:** paste the signer SHA-256 into the README's *Verify a release
  APK* placeholder, and publish the APK's `sha256sum` with the tag.
- **A DKB import driven live.** The parser is unit-tested against inline rows; only Volksbank has been
  driven end-to-end in-app.
- **`en.json` read by a human.** Both bundles hold the same 608 keys and only 76 values are identical
  (measured 2026-08-02 — recount before citing), so the great majority are real translations, but
  nothing could render them until the language switch shipped. The first English session is also the
  first proofread.

## Waiting on upstream

- **Angular 22 is gated on NgRx.** We are on `21.2.18` (the `v21-lts` line, supported and not urgent);
  `@ngrx/*` latest is `21.1.1` peering `@angular/core: ^21.0.0`, `next` only `22.0.0-beta.0`. NgRx is
  the spine here — a `data/` layer per domain, persistence and list flows as builders — so forcing it
  means pnpm overrides on an untested combination. **Bump when `@ngrx/*@22` is stable.**
  - **Lockstep, one atomic commit or none:** `@angular/*` + `@angular/cli` + `@angular/build` +
    `angular-eslint` + `@ngrx/*`. Their peer ranges are mutually exclusive across the v21/v22
    boundary, and Angular's intra-family peers are **exact**, so one held-back member pins the set.
  - Already compatible: `@ionic/angular` 8.8.x, `@ionic/storage-angular`, `ng2-charts` 9,
    `@ngx-translate/*` 18, Sheriff.
  - Run `ng update @angular/core@22 @angular/cli@22`; never hand-edit `package.json`. Its own commit —
    a framework major on top of other changes makes a red gate unattributable.
- **An Angular bug worth filing:** the `pattern=""` default described in
  [footguns.md](./footguns.md).

## Deferred on a decision, not on effort

- **Reordering the deck from the grid.** `DeckFacade.reorder(ids)` already takes what an
  `ionReorderEnd` produces. What stops it: a tile **is** a navigation link, so a drag competes with
  the tap that opens the program — it needs a long-press-to-arm or an explicit arrange toggle, a UX
  choice. The capability has a home at `/commlink/deck`.
- **A persistent desktop side menu (`ion-split-pane`).** The catalog behind the drawer already serves
  both surfaces, so the navigation model needs nothing; what defers it is reach — every page header
  renders an `ion-menu-button` that would have to disappear above the breakpoint.
- **The emoji picker's `ion-input` `end` slot is experimental** — Ionic 8 implements `start`/`end` on
  `ion-input` with *simulated* rather than native slots. It renders and clicks correctly in e2e and on
  the web build; the Android WebView is the one target no gate covers. The fallback needs no redesign:
  the identical `ion-button` moves one level out, to the wrapping `ion-item`.
- **`emoji:build` runs by hand, not in CI.** The output is committed, so the build never needs the
  network and a stale artifact cannot break a release — it can only miss emoji from a newer Unicode
  release. A gate would need `emojibase-data` in CI for a check that fires once a year.
- **No skin-tone choice in the picker.** CLDR nests tone variants under each base emoji; keeping them
  turns 1644 entries into several thousand, for a picker that decorates a household item name. A name
  pasted *with* a tone modifier survives the round-trip.
- **The PWA icons declare `"purpose": "maskable any"` at every size.** One bitmap serving both wastes
  the maskable safe-zone padding in the `any` context. Worth splitting only if a real device's
  home-screen crop looks wrong.

## SOYKAF recipe book — v2

The constraint shaping all of it: the check is **presence-only** ("in storage" / "missing"), never
"you are 200 ml short" — storage counts packages while a recipe asks for a measure.

- **Cook → subtract** ingredients from storage, missing ones pushed into `_shopping`. A product
  decision: it makes cooking mutate stock.
- **Base unit on `Product` + pack sizes.** Open **only if presence-only proves too weak**: making
  `StorageItem.quantity` a base-unit amount pools distinct packs into one number and so **destroys
  per-pack `bestBefore`**. Half the schema exists already (`unit`, `packaging`, `packagingWeight?`,
  unread by the matcher).
- **Recipe photos** need a place for binaries first — a slice persists as one key/value doc that the
  generic save effect rewrites wholesale, so base64 images would ride inside the text document.
