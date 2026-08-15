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

- **What is left of the UX review of 2026-08-08.** The file it lived in is gone: the two defects, the
  swipe sides, the drawer badges, the loading indication and the mechanical list were acted on the
  same day, and `:listId` was dropped from the three household list routes. Two of its findings were
  already false when re-read against the code — the cash header carries three end-slot buttons, not
  five, and the CSV import button is gated behind `canImport()`, so picking a file for a bank with no
  parser is not reachable. The rest, still open and each deferred on a decision rather than on effort:
  - **The cascade half of the destructive-action policy.** The row half is **settled** (2026-08-14,
    [decisions.md](./decisions.md)): a swipe deletes and does not ask, because a list must be as cheap
    to remove from as to add to. What is left is the class a swipe never covers — deleting a category
    strips it off every row in three reducers, tracking's *Reset all* discards every running timer,
    and geist's purge fires **unannounced on a persona switch**. Those destroy what the user was not
    looking at, and cash's `deleteConfirmAlert` is now the one row-level confirm left standing, kept
    on ledger grounds rather than by policy.
    **The undo mechanism is built** (2026-08-09): `ToastMessage` carries
    `action`, `durationMs` and `group`, and `@shared/data/undo/` holds a ten-deep stack of
    `{ name, action }` entries that the shared toast effect offers at 5 s. A list opts in by passing
    `undoableDelete` to `createItemListEffects`, and only shopping, storage and products do — their
    restore is the list's own `addItem` with the original item. Tasks, recipes, categories, tracking
    and trackplay's four lists still delete silently, and that half is still a decision, not work.
    Two things the opt-in deliberately did not touch:
    - **Trackplay is not on the stack**, and undoes through its own `lastDeleted` slot. Its
      `restoreSnapshot` writes the pre-delete `players`, `games` and `gameTypes` arrays back
      wholesale, so deleting a game, adding a player and then undoing loses the new player. A stack
      of absolute snapshots multiplies that; per-entity restore actions would fix it and would also
      let trackplay join. Nothing is blocked on it — a single delete followed straight by an undo,
      which is the whole interaction, is correct today.
    - **The stack has no persistent consumer.** Only the toast pops it, so entries below the top are
      unreachable until the toolbar undo button exists — which is also what would retire the
      `a11y-no-actionable-toast-button` suppression for both callers at once
      ([decisions.md](./decisions.md)).
  - **Write confirmations are arbitrary, not absent.** Tracking toasts its writes; tasks, the three
    household lists, recipes, cash, categories and trackplay create/edit are silent.
  - **Cash's confirm-before-delete is now the odd one out in a narrower way.** Every cash delete
    still routes through `deleteConfirmAlert`, but the row that raises it is `ListItemComponent`,
    shared with five domains that delete on release of a swipe. The classification is still the open
    question; what changed is that adopting either policy is now one handler, not a rewrite.
  - **`@capacitor/haptics` has zero call sites.** Kept against deletion on plugin-hygiene grounds
    ([decisions.md](./decisions.md)), which says nothing about using it. On the APK it is the cheapest
    upgrade available to how the app feels.
  - **No spacing scale.** Type has seven rungs and a stylelint rule that reads them out of
    `_shadowrun.scss`; colour, radius, glow, transform and tracking are per-theme tokens. Spacing is
    per-component rem literals, which is why pages read as subtly mismatched beside each other.
  - **Three empty-state treatments, one of them useful.** The shared one explains and creates on tap;
    notifications and cash-rules hand-roll inert ones, and the tracking stats page, deck config,
    the reconcile and import-preview modals and the office-time dashboard have none. The trackplay
    lists left this list on 2026-08-09 and cash's three ledger surfaces on 2026-08-10, both by moving
    onto `ListPageComponent`, which renders the shared one — which is the argument for the rest. The
    cash **rules** page stays hand-rolled on purpose: `ion-reorder-group` has to wrap the rows and the
    shared list owns that element. Two already have copy written and never rendered
    (`cash.reconcile.empty`, `cash.import.empty`). The deck grid left this list on 2026-08-14: an
    `@empty` node linking to `/commlink/deck` answers an all-hidden deck, spelled as three
    `DECK_CHROME_FIELDS` so it speaks in the active theme's voice, which makes
    `deck.catalog.spec.ts` gate the copy in both bundles and both themes.
  - **Six shipping controls below the touch target.** `size="small"` is 32 px in Ionic MD; ten sites,
    four `isDevMode()`-gated. The six that ship include the barcode **delete**. The emoji picker's
    grid is `minmax(2.75rem, 1fr)` with a banner saying why — the care is here, it is not uniform.
  - **The barcode / ML Kit scanner's silence was not reproducible** from a read of `barcode.page.ts`.
    Verify before adding anything.
  - **`durable-storage.ts` still swallows a denied `persist()` grant.** Deliberate: that is eviction
    *risk*, not data loss, and it resolves inside `provideAppInitializer` — before translations load,
    and on every launch under Firefox and Safari. The only honest surface is a passive status row in
    settings, which is new surface during a shrink. The *write* half now toasts, once per key.
- **Multi-list household is not what `:listId` was**, and dropping the param (2026-08-08) settled it.
  `HouseholdListId` is a closed three-literal union over structurally different item types, named as
  three fields of `HouseholdState` through `combineReducers`, with six `Record<HouseholdListId, …>`
  maps keyed off it. Real multi-list means turning one of those fields into a keyed collection, and
  two things refuse it: `ListSettings` is six booleans naming the three lists pairwise
  (`showProductsInStorage`, …) with no answer for *which* shopping list, and the segment switcher is
  deliberately unrolled because `testid-is-static` forbids a bound `data-testid` inside `@for`.
  **Categories already deliver the use case** — a shared catalog plus a route-state category filter
  gives "Freezer" or "Aldi" separation, filtering and a bookmarkable URL at no structural cost. The
  param survives on `categories/:listId` alone, where it genuinely varies: it carries which list the
  catalog was opened from, so the back button can return there.
- **One glyph per program, read by both the menu and the page header** (deferred 2026-08-04). Today the
  six list pages each pass their own `icon="…"` to `app-page-header` while `DECK_CATALOG` carries the
  same string for the menu — two copies that agree by review only, and nothing gates the drift. Two
  facts make the fix small: the icon is a **static const**, not slice state (`npc-deck` holds only
  `order`/`hiddenEntries`/`hiddenModules`), so no store read is involved; and `app.component` already
  `addIcons(DECK_ICONS)` eagerly, so any page may render any deck glyph whatever route it was entered
  by — the per-page registrations are redundant. **Not a shared selector:** `@shared` naming another
  domain's store key is what was deleted with the notifications read-half. The shape is
  `RECENT_EMOJIS`' — a read-only `InjectionToken<Signal<string | undefined>>` in `@shared/util`,
  empty-defaulted so the header renders without the context, fulfilled by `commlink/data` (which owns
  the catalog *and* may read the `Router`) as the longest catalog route prefixing the current URL. The
  `icon` input survives as the override for pages with no deck entry: the category catalog, trackplay's
  sub-pages, the cash detail pages. **What defers it is the consequence, not the work:** the header's
  glyph becomes route-derived, so adding a route to the catalog later silently changes that page's
  header.
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
