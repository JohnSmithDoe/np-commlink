# State — blocked, one-way doors, waiting on upstream

**Check before proposing work.** Nothing here is merely undone: each needs a secret, an upstream release,
a human reading the result, or a product decision. Settled questions are in [decisions.md](./decisions.md).

## One-way doors — the window closes at first publish

Each field below is one a distribution channel compares to decide _same app or different app_. **Nothing
has been published** (`git ls-remote origin` returns zero refs, no tags, CI has never run), so all are
still free.

- **The signing key does not exist yet, and custody is the whole task.** The `signingConfig` is postsync
  patch 5, reading four `NPC_*` env vars resolved into `pnpm run apk:signed`'s own process. Verified with
  a throwaway key: none set → unsigned and a clone still builds, some set → a named `GradleException`, all
  four → `app-release.apk` verifying v2 + v3. **Back the keystore up in two places before the first signed
  build**, 25+ year validity — an expired cert cannot sign upgrades, and an APK signed with a different key
  can **never** upgrade one signed with the old, at any version; the only way in is an uninstall that wipes
  every tracked session, the pantry and the ledger. Deliberately **not** in the repo despite AGPL:
  publishing the source is the licence's demand, publishing the identity would let anyone ship a build that
  upgrades over a real install and inherits its data.
- **`enableV3Signing = true` must be on from the first release** — set explicitly against AGP's default at
  `minSdk 24`. v3 carries the proof-of-rotation lineage; without it from the start, rotation is impossible.
- **`manifest.id` is `"np-commlink"`**, parsed as a URL against the **origin** — a leading or trailing slash
  is a _different_ identity, giving the browser a second app with its own IndexedDB and no route to the
  first one's data. Write once, never touch.
- **Renaming a persisted key or a deck entry id is free only until the first release**
  ([decisions.md](./decisions.md)); after it, either needs a ladder step.

## Blocked — needs something only the owner can supply

- **The first push, CI run and tag wait only on repo settings now.** The keystore exists and
  `pnpm apk:signed` produces an APK verifying under v2 + v3; the fingerprint is pinned in the README. Web
  and APK ship together, not the PWA alone. Two prerequisites live in repo settings, not git: _Settings →
  Pages → Source_ set to **GitHub Actions**, and _Settings → Environments → github-pages → Deployment
  branches and tags_ given a rule with **Ref type: Tag**, pattern `v*`. The environment is auto-created
  protected to the default branch and a branch rule does not cover tags, so without the second the deploy
  job fails on the first release with `Branch "v1.0.0" is not allowed to deploy to github-pages`. The APK is
  attached by hand — CI builds none, so the signing key never reaches a runner.
- **One follow-up remains at first release:** publish the APK's `sha256sum` with the tag.
- **A DKB import driven live** — the parser is unit-tested against inline rows; only Volksbank has been
  driven end-to-end in-app.
- **`en.json` read by a human.** Both bundles hold the same keys and only ~76 values are identical
  (measured 2026-08-02 — recount before citing), so most are real translations, but nothing rendered them
  until the language switch shipped. The first English session is the first proofread.

## Waiting on upstream

- **Angular 22 is gated on NgRx.** On `21.2.18` (`v21-lts`, supported, not urgent); `@ngrx/*` latest is
  `21.1.1` peering `@angular/core: ^21.0.0`, `next` only `22.0.0-beta.0`. NgRx is the spine here, so
  forcing it means pnpm overrides on an untested combination. **Bump when `@ngrx/*@22` is stable.**
  - **Lockstep, one atomic commit or none:** `@angular/*` + `@angular/cli` + `@angular/build` +
    `angular-eslint` + `@ngrx/*`. Peer ranges are mutually exclusive across the v21/v22 boundary and
    Angular's intra-family peers are **exact**, so one held-back member pins the set.
  - Already compatible: `@ionic/angular` 8.8.x, `@ionic/storage-angular`, `ng2-charts` 9,
    `@ngx-translate/*` 18, Sheriff.
  - Run `ng update @angular/core@22 @angular/cli@22`; never hand-edit `package.json`. Its own commit — a
    framework major on top of other changes makes a red gate unattributable.
- **An Angular bug worth filing:** the `pattern=""` default in [footguns.md](./footguns.md).

## Deferred on a decision, not on effort

- **The cascade half of the destructive-action policy.** The row half is settled
  ([decisions.md](./decisions.md)). Left: a category delete strips three reducers, tracking's _Reset all_
  discards every running timer, geist's purge fires unannounced on a persona switch — all destroy what the
  user was not looking at. Cash's `deleteConfirmAlert` is the one row-level confirm still standing.
- **Which lists opt into undo.** The mechanism is built — `ToastMessage` carries `action`, `durationMs`
  and `group`, and `@shared/data/undo/` holds a ten-deep stack the shared toast effect offers at 5 s. Only
  shopping, storage and products pass `undoableDelete`; tasks, recipes, categories, tracking and
  trackplay's four lists delete silently. Two gaps the opt-in did not touch:
  - **Trackplay is not on the stack** — `restoreSnapshot` writes the pre-delete `players`, `games` and
    `gameTypes` arrays back wholesale, so delete → add player → undo loses the new player. Per-entity
    restore actions would fix it and let trackplay join. Nothing is blocked: delete followed straight by
    undo is correct today.
  - **The stack has no persistent consumer** — only the toast pops it, so entries below the top are
    unreachable until a toolbar undo button exists, which also retires the
    `a11y-no-actionable-toast-button` suppression for both callers at once.
- **Write confirmations are arbitrary, not absent.** Tracking toasts its writes; tasks, the three household
  lists, recipes, cash, categories and trackplay create/edit are silent.
- **`@capacitor/haptics` has zero call sites.** Kept on plugin-hygiene grounds, which says nothing about
  using it. On the APK it is the cheapest upgrade available to how the app feels.
- **Three empty-state treatments, one of them useful.** The shared one explains and creates on tap;
  notifications and cash-rules hand-roll inert ones, and the tracking stats page, deck config, the
  reconcile and import-preview modals and the office-time dashboard have none. Moving a surface onto
  `ListPageComponent` is what fixed trackplay, cash and the household lists — the argument for the rest.
  Cash **rules** stays hand-rolled: `ion-reorder-group` has to wrap the rows and the shared list owns that
  element. Two have copy written and never rendered (`cash.reconcile.empty`, `cash.import.empty`).
- **Six shipping controls below the touch target.** `size="small"` is 32 px in Ionic MD; ten sites, four
  `isDevMode()`-gated. The six that ship include the barcode **delete**. The emoji picker's grid is
  `minmax(2.75rem, 1fr)` with a banner saying why — the care is here, it is not uniform.
- **The barcode / ML Kit scanner's silence was not reproducible** from a read of `barcode.page.ts`. Verify
  before adding anything.
- **`durable-storage.ts` still swallows a denied `persist()` grant.** Deliberate: eviction _risk_, not data
  loss, resolved inside `provideAppInitializer` — before translations load, and on every launch under
  Firefox and Safari. The only honest surface is a passive status row in settings. The _write_ half toasts.
- **Multi-list household is not what `:listId` was**, and dropping the param settled it. `HouseholdListId`
  is a closed three-literal union over structurally different item types, named as three fields of
  `HouseholdState` through `combineReducers`, with six `Record<HouseholdListId, …>` maps keyed off it. Real
  multi-list means turning one field into a keyed collection, and two things refuse it: `ListSettings` is
  six booleans naming the lists pairwise (`showProductsInStorage`, …) with no answer for _which_ shopping
  list, and the segment switcher is deliberately unrolled because `testid-is-static` forbids a bound
  `data-testid` inside `@for`. **Categories already deliver the use case** — a shared catalog plus a
  route-state filter gives "Freezer" or "Aldi" separation, filtering and a bookmarkable URL at no
  structural cost. The param survives on `categories/:listId`, carrying which list opened the catalog.
- **One glyph per program, read by both the menu and the page header.** The six list pages each pass their
  own `icon="…"` to `app-page-header` while `DECK_CATALOG` carries the same string — two copies agreeing by
  review only. The fix is small: the icon is a static const, not slice state, and `app.component` already
  `addIcons(DECK_ICONS)` eagerly, so per-page registrations are redundant. **Not a shared selector** —
  `@shared` naming another domain's store key is what was deleted with the notifications read-half. The
  shape is `RECENT_EMOJIS`': a read-only `InjectionToken<Signal<string | undefined>>` in `@shared/util`,
  empty-defaulted, fulfilled by `commlink/data` as the longest catalog route prefixing the URL, with
  `icon` surviving as the override for pages with no deck entry. **What defers it is the consequence:** the
  header's glyph becomes route-derived, so adding a route to the catalog later silently changes a header.
- **Reordering the deck from the grid.** `DeckFacade.reorder(ids)` already takes what an `ionReorderEnd`
  produces. What stops it: a tile **is** a navigation link, so a drag competes with the tap that opens the
  program — it needs a long-press-to-arm or an arrange toggle, a UX choice.
- **A persistent desktop side menu (`ion-split-pane`).** The catalog behind the drawer already serves both
  surfaces, so the navigation model needs nothing; what defers it is reach — every page header renders an
  `ion-menu-button` that would have to disappear above the breakpoint.
- **The emoji picker's `ion-input` `end` slot is experimental** — Ionic 8 implements `start`/`end` with
  _simulated_ slots. It renders and clicks correctly in e2e and on the web build; the Android WebView is
  the one target no gate covers. The fallback needs no redesign: the identical `ion-button` moves one level
  out, to the wrapping `ion-item`.
- **`emoji:build` runs by hand, not in CI.** The output is committed, so the build never needs the network
  and a stale artifact can only miss emoji from a newer Unicode release. A gate would need `emojibase-data`
  in CI for a check that fires once a year.
- **No skin-tone choice in the picker.** CLDR nests tone variants under each base emoji; keeping them turns
  1644 entries into several thousand, for a picker that decorates an item name. A name pasted _with_ a tone
  modifier survives the round-trip.
- **The PWA icons declare `"purpose": "maskable any"` at every size** — one bitmap for both wastes the
  maskable safe-zone padding in the `any` context. Worth splitting only if a real device's crop looks wrong.

## SOYKAF recipe book — v2

The constraint shaping all of it: the check is **presence-only** ("in storage" / "missing"), never "you are
200 ml short" — storage counts packages while a recipe asks for a measure.

- **Cook → subtract** ingredients from storage, missing ones pushed into `_shopping`. A product decision:
  it makes cooking mutate stock.
- **Base unit on `Product` + pack sizes.** Open **only if presence-only proves too weak**: making
  `StorageItem.quantity` a base-unit amount pools distinct packs into one number and so **destroys per-pack
  `bestBefore`**. Half the schema exists (`unit`, `packaging`, `packagingWeight?`, unread by the matcher).
- **Recipe photos** need a place for binaries first — a slice persists as one key/value doc that the generic
  save effect rewrites wholesale, so base64 images would ride inside the text document.
