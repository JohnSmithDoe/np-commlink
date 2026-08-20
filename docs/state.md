# State — blocked, one-way doors, waiting on upstream

**Check before proposing work.** Nothing here is merely undone: each needs a secret, an upstream release,
a human reading the result, or a product decision. Settled questions are in [decisions.md](./decisions.md).

## One-way doors — closed at v1.0.0

Each field below is one a distribution channel compares to decide _same app or different app_. **v1.0.0 is
published**: the tag, the PWA, and a signed APK attached to the release. None of them is free any more —
changing one does not migrate an install, it stands up a second app that cannot reach the first one's data.

- **The signing key exists, has signed v1.0.0, and custody is now the whole task.** The `signingConfig` is
  postsync patch 5, reading four `NPC_*` env vars resolved into `pnpm run apk:signed`'s own process. The
  shipped APK verifies v2 + v3 and its signer SHA-256 is pinned in the README. **Back the keystore up in two
  places**, 25+ year validity — an expired cert cannot sign upgrades, and an APK signed with a different key
  can **never** upgrade one signed with this one, at any version; the only way in is an uninstall that wipes
  every tracked session, the pantry and the ledger. Losing the keystore therefore ends the APK line, and no
  amount of source access undoes it. Deliberately **not** in the repo despite AGPL: publishing the source is
  the licence's demand, publishing the identity would let anyone ship a build that upgrades over a real
  install and inherits its data.
- **`enableV3Signing = true` shipped on** — set explicitly against AGP's default at `minSdk 24`, and
  confirmed on the released APK. v3 carries the proof-of-rotation lineage, so rotation is still reachable;
  had it been off for this release it never would have been.
- **`manifest.id` shipped as `"np-commlink"`**, parsed as a URL against the **origin** — a leading or
  trailing slash is a _different_ identity, giving the browser a second app with its own IndexedDB and no
  route to the first one's data. Never touch.
- **Renaming a persisted key or a deck entry id costs a ladder rung wherever somebody is holding one** —
  the tag closed the free window for the slices that have users, not for the app at large.
  [CLAUDE.md](../CLAUDE.md) carries the roster and the standing instruction to **ask** rather than infer;
  [decisions.md](./decisions.md) says what a rung owes once one is.
- **The cash slice's shape moved without a rung, and that exemption is spent.** `CashAccount.bank` is gone,
  `iban` and `importKey` are new, and `APP_VERSION` stayed **1** on the single ground that cash has no
  users — there is no v1 cash data anywhere for a step to migrate, so a rung would have been a file that
  ran against nothing. Two consequences. A dev browser holding pre-camt cash rows has them with no
  `importKey`, and the first camt import will not recognise them: **clear the cash slice there rather than
  reading the duplicate count as truth**. And the exemption does not generalise — the next stored-shape
  change made once cash holds real data owes the first genuine rung, with no precedent in the repo to copy.

## Blocked — needs something only the owner can supply

- **Every release attaches its APK by hand.** CI builds none — the signing key never reaches a runner — so
  the tag run gates, deploys Pages and drafts the release, and `pnpm apk:signed` plus an upload finishes it.
  The two GitHub settings the deploy depends on are in the README, not here: they are configuration, not a
  decision anyone still has to make.
- **Any camt import driven live, against a file a bank actually produced.** The parser is unit-tested
  against synthetic documents only. The exports in `docs/cash/` have been **refilled** and now import:
  anonymisation had replaced every digit with `X`, and the runs are written back coherently — booking
  dates ascending through the period, entry and detail amounts agreeing, a balance chain that adds up
  across the three pages, mod-97 IBANs, `AcctSvcrRef` unique over all 311 rows. What they still are is
  Volksbank's real **shape** — tag nesting, ISO-8859-1 bytes, the 150-entry pagination, the 140-character
  `Ustrd` truncation that splits an IBAN across two of them — carrying invented **value**. So they drive
  the import end to end and prove nothing about what a bank emits. A real run needs the owner's own
  download, and `docs/cash/` is gitignored, so nothing committable comes out of it either way. Volksbank,
  DKB and ING each need their own first
  run: the format is one, but which optional elements a given bank fills is not — `AcctSvcrRef` above all,
  since its absence silently downgrades every key on the statement to a derived one.
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
- **The IBAN on an account is compared, never validated.** It is normalised — spaces stripped, upper-cased
  — matched against the statement's, and an empty one adopts what it reads, so the common path never needs
  a keyboard at all. A hand-typed typo is the gap: it refuses every import as `wrong-account`, and the
  toast names the IBAN the **file** carries, which reads as the file being wrong. A mod-97 checksum is ten
  lines; what defers it is whether a wrong-but-well-formed IBAN earns a second error state, since the
  checksum cannot catch that one either.
- **Two ways a re-import is not idempotent, both inherent to keying off statement content.** Nothing
  writes a tombstone, so deleting an imported row and re-importing brings it back; and a `PDNG` entry can
  carry a different `AcctSvcrRef` once it books, arriving as a second row. Neither bites today — every
  export on hand is 100 % `BOOK` — and the pending/reconcile flow already exists to absorb the second.
  Recorded so that neither reads as a regression later.
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
