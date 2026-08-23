# State — blocked, one-way doors, waiting on upstream

**Check before proposing work.** Nothing here is merely undone: each needs a secret, an upstream release,
a human reading the result, or a product decision. Settled questions are in [decisions.md](./decisions.md).

## One-way doors

Each field below is one a distribution channel compares to decide _same app or different app_, and the
published tags have closed every one of them: changing one does not migrate an install, it stands up a
second app that cannot reach the first one's data.

- **The signing key exists and custody is the whole task.** The `signingConfig` is postsync patch 5,
  reading four `NPC_*` env vars resolved into `pnpm run apk:signed`'s own process. The shipped APK
  verifies v2 + v3 and its signer SHA-256 is pinned in the README. **Back the keystore up in two
  places**, 25+ year validity — an expired cert cannot sign upgrades, and an APK signed with a different key
  can **never** upgrade one signed with this one, at any version; the only way in is an uninstall that wipes
  every tracked session, the pantry and the ledger. Losing the keystore therefore ends the APK line, and no
  amount of source access undoes it. Deliberately **not** in the repo despite AGPL: publishing the source is
  the licence's demand, publishing the identity would let anyone ship a build that upgrades over a real
  install and inherits its data.
- **`enableV3Signing = true` shipped on** — set explicitly against AGP's default at `minSdk 24`, and
  confirmed on the released APK. v3 carries the proof-of-rotation lineage, which is what keeps rotation
  reachable at all.
- **`manifest.id` shipped as `"np-commlink"`**, parsed as a URL against the **origin** — a leading or
  trailing slash is a _different_ identity, giving the browser a second app with its own IndexedDB and no
  route to the first one's data. Never touch.
- **Renaming a persisted key or a deck entry id costs a ladder rung wherever somebody is holding one** —
  the tag closed the free window for the slices that have users, not for the app at large.
  [CLAUDE.md](../CLAUDE.md) carries the roster and the standing instruction to **ask** rather than infer;
  [decisions.md](./decisions.md) says what a rung owes once one is.
- **Cash's shape has moved without a rung, and that exemption is spent.** `APP_VERSION` stays **1** on the
  single ground that cash has no users — no v1 cash data exists anywhere for a step to migrate, so a rung
  would be a file that runs against nothing. Two consequences. A dev browser holding pre-camt cash rows has
  them with no `importKey`, and a camt import will not recognise them: **clear the cash slice there rather
  than reading the duplicate count as truth**. And the exemption does not generalise — the next
  stored-shape change once cash holds real data owes the first genuine rung, with no precedent in the repo
  to copy. `CashSchedule.dueDay` rides the same exemption, asked and answered: optional, absent on every
  stored row, and `advanced()` falls back to the day its `nextDueISO` already carries.
- **`vitals` and `notes` are published from v1.1.0 on, so their shapes are somebody's data.** The free
  window is closed for `VitalsState` with its `profiles`, `readings` and `pills` sub-slices, and for
  `notes`. Anything holding either from before that tag came from a locally built debug APK, which a
  release-key install cannot upgrade and therefore never sees.
- **`deck` and `settings` RESET rather than migrate.** `deck` stores `visibleEntries` — a pre-v1.1.0
  document carries `hiddenEntries` + `hiddenModules` — and discards that shape deliberately:
  `isCurrentShape` in `deck.reducer.ts`, whose banner argues why migrating it would invert every holder's
  choice. `settings` splits `theme` into `skin` and `mode` and falls through
  `{...initialSettings, ...settings}`, which is invisible on cyberpunk/dark, one re-pick for a boomer-skin
  holder, and a dead `theme` key riding along until the next write. So **`APP_VERSION` is 1 and
  `runMigrations` has never run a step**: the first genuine rung is unwritten, and has no precedent in the
  repo to copy.

## Blocked — needs something only the owner can supply

- **Every release attaches its APK by hand.** CI builds none — the signing key never reaches a runner — so
  the tag run gates, deploys Pages and drafts the release, and `pnpm apk:signed` plus an upload finishes it.
  The two GitHub settings the deploy depends on are in the README, not here: they are configuration, not a
  decision anyone still has to make.
- **Any camt import driven live, against a file a bank actually produced.** The parser is unit-tested
  against synthetic documents only. The exports in `docs/cash/` import, and their values are internally
  coherent — booking dates ascending through the period, entry and detail amounts agreeing, a balance
  chain that adds up across the three pages, mod-97 IBANs, `AcctSvcrRef` unique over all 311 rows. What
  they are is Volksbank's real **shape** — tag nesting, ISO-8859-1 bytes, the 150-entry pagination, the
  140-character `Ustrd` truncation that splits an IBAN across two of them — carrying invented **value**.
  So they drive the import end to end and prove nothing about what a bank emits. A real run needs the
  owner's own download, and `docs/cash/` is gitignored, so nothing committable comes out of it either way.
  Volksbank, DKB and ING each need their own first run: the format is one, but which optional elements a
  given bank fills is not — `AcctSvcrRef` above all, since its absence silently downgrades every key on
  the statement to a derived one.
- **`en.json` read by a human.** Both bundles hold the same keys and only ~76 values are identical
  (measured 2026-08-02 — recount before citing), so most are real translations. The first English session
  is the first proofread.
- **Two handbook pages carry stale screenshots, and they say so themselves.** `credstick-import` (the
  rules list lost its in-content add button and its section header; the swipe reveals a text delete
  now) and `soykaf` (the recipe list gained a searchbar and a sort row). Both page JSONs carry
  `"shotsStale": true`, which paints a warning above the article, so a reader is told rather than
  misled. Clearing it is a **release** step: re-run `playwright.handbook.config.ts`, then drop the
  flag. [CLAUDE.md](../CLAUDE.md) forbids an agent regenerating them, so the flag is set by hand and
  no gate can see it — **whoever changes a screen sets it on the pages that show that screen.**

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
  trackplay's four lists delete silently. Two gaps:
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
- **A re-import is not idempotent in one remaining way, inherent to keying off statement content.**
  Nothing writes a tombstone, so deleting an imported row and re-importing brings it back. The other half
  is handled: a row carries its derived key as well as the bank's, so a `PDNG` entry arriving again under
  the `AcctSvcrRef` it gained when it booked confirms the stored pending row in place (`plan-import.ts`).
- **Write confirmations are arbitrary, not absent.** Tracking toasts its writes; tasks, the three household
  lists, recipes, cash, categories and trackplay create/edit are silent.
- **Reading the phone's own payments is parked, and the ceiling is the platform's, not the effort.** No
  Android API exposes Google Wallet or tap-to-pay history to a third-party app; the Google Pay APIs take
  payments, they do not report them. The single hook that exists is `NotificationListenerService` — read
  the bank's and Wallet's own push notifications, parse merchant and amount. It fits the model unusually
  well: a captured spend is `source: 'manual', status: 'pending'`, which the next camt import reconciles
  through machinery that already ships. What parks it: it is a native plugin nobody maintains
  (`capacitor-notificationlistener`'s own author says it is old and probably broken on current Android), so
  it is a plugin to own; the parsing is per-bank text that breaks when a bank rewords a push; and it is
  Android-only, inert on the PWA. Proper bank access is a separate wall — PSD2 needs an AISP licence plus
  an eIDAS certificate, or an aggregator that holds a client secret on a server, and FinTS needs a product
  registration and a socket client. All three end at a backend this app does not have.
- **Transfers between own accounts are not detected on import, and the report pays for it.** `isTransfer`
  is set only by the transfer modal, so importing both accounts' statements books one internal move as
  spend on one side and income on the other, inflating every figure in the report and the burn-down.
  Detection is cheap and shaped like `findReconciliationCandidates` — opposite amount, ±3 days, a
  different account — offered as pairs to link in the import preview. Parked on the owner's call, not on
  difficulty.
- **The app is not a share target, and files are why.** A manifest-only declaration is wrong for
  files: a `share_target` carrying one must be `method: "POST"`, `enctype: "multipart/form-data"`, and the
  POST has to be intercepted in the service worker — which means wrapping `ngsw-worker.js` in an
  `importScripts` shim and registering that instead, since ngsw exposes no `fetch` hook. It also arrives
  with no account context, so the receiving flow needs an account chooser before the import preview. Two
  hundred lines, a registration path that can brick a PWA install, and nothing Playwright can drive —
  against roughly two taps saved over the file input the account page already has.
- **`@capacitor/haptics` has zero call sites.** Kept on plugin-hygiene grounds, which says nothing about
  using it. On the APK it is the cheapest upgrade available to how the app feels.
- **Three empty-state treatments, one of them useful.** The shared one explains and creates on tap;
  notifications, the burn-down, schedules and the uncategorized surface hand-roll inert copy; the
  tracking stats page, deck config and the office-time dashboard have none. `ListPageComponent` is
  what carries the useful one for trackplay, cash and the household lists — the argument for the rest.
- **The shared empty state names a searchbar that a searchless list does not have.**
  `item-list.empty.isempty.note` reads "…oder gib etwas in die Suchleiste ein", and vitals' readings
  and pills plus cash's rules all render `app-list-page` with `searchable` false. Splitting the note
  needs a second key and a `searchable` read inside `app-item-list-empty`, for copy nobody has
  complained about.
- **Six shipping controls below the touch target.** `size="small"` is 32 px in Ionic MD; ten sites, four
  `isDevMode()`-gated. The six that ship include the household scan button. The emoji picker's grid is
  `minmax(2.75rem, 1fr)` with a banner saying why — the care is here, it is not uniform.
- **`durable-storage.ts` still swallows a denied `persist()` grant.** Deliberate: eviction _risk_, not data
  loss, resolved inside `provideAppInitializer` — before translations load, and on every launch under
  Firefox and Safari. The only honest surface is a passive status row in settings. The _write_ half toasts.
- **Multi-list household is not what `:listId` offered.** `HouseholdListId` is a closed three-literal
  union over structurally different item types, named as three fields of
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
  `@shared` does not name another domain's store key. The shape is `RECENT_EMOJIS`': a read-only
  `InjectionToken<Signal<string | undefined>>` in `@shared/util`,
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
- **Recipe photos** have a place to live: `notes/data/note-image.store.ts` keys each picture on its own
  and keeps the slice text-only. What is left is generalising it past notes — the store, its resolver and
  its collector are note-shaped.

## Known cost, not yet paid

Each of these is measured, understood and left standing on purpose — a shape question, a wording question,
or a bill that only a phone with a few hundred rows actually presents.

- **A picture is base64 in IndexedDB, and binary is the better answer on both platforms.** The store keys
  each image on its own, but the value is a data URL: base64 costs a third on top of the bytes and
  every read re-parses a string. A `Blob` in IndexedDB would drop both, rendered through
  `URL.createObjectURL` — which makes revoking our problem, and only holds if the localforage driver really
  is IndexedDB (a localStorage fallback cannot carry a Blob at all). On the APK the honest answer is a real
  file: `@capacitor/filesystem` is not a dependency yet, so it is a plugin to add, sync and patch through
  `android-postsync.sh`, plus `convertFileSrc` and a CSP that admits it. The PWA has no such option, so
  either way the code carries two paths.
- **The notes list decodes a full picture into a 48 px box.** `MAX_EDGE` is two screens, so every thumbnail
  costs a full-size decode; `loading="lazy"`/`decoding="async"` defer it but do not shrink it. A second
  canvas pass at import — the canvas is already there — would store a ~192 px `thumbUrl` beside the
  picture for a few KB. It is a persisted-shape change on the image document, which is free (`notes` is
  dev-only), and the list is also unwindowed, so the two belong in one pass.
- **The pill intake log is never pruned.** `intakes` gains one entry per pill per day and nothing removes
  it, so it is carried in every vitals write forever — five pills over two years is ~3 600 entries. Pruning
  past ~90 days is a few lines, but `vitals` is a slice real users hold, so the shape change is a question
  for Martin and not a cleanup.
- **The match preview re-scans the ledger on every keystroke.** `matchesRegexSafely` compiles a new RegExp
  per transaction and the amount threshold is re-parsed per transaction, then the whole matched set is
  sorted to take five. A compiled condition set (resolve the RegExp and the cents once), a running top-five
  and a ~250 ms debounce on the preview input are the three halves of it; the debounce changes when the
  preview updates, which is why it is not a silent cleanup.

## Known duplication and shallow seams

- **Import policy is split between a page and a modal.** The page reads files, plans and hands the modal
  eight loose props; the modal then decides what counts as work and calls two facades. A `CashImportFacade`
  owning `plan(parsed)` and `commit(preview)` would put one transaction in one place.
- **Cash rules and schedules hand-roll add-or-update in their facades** while their action groups already
  carry `addOrUpdateItem`. Wiring `createItemListEffects` for them is the fix and also brings
  `syncSearchOnRename$` and the failure toast, so it changes behaviour and is a decision, not a tidy-up.
- **`windowSize` is a hand-rolled render cap in the shared list page, with one caller.** Ionic ships
  `ion-infinite-scroll` and the CDK ships virtual scroll; either would need no flag, no second items signal
  and no reset rule. Also `searchable` is declared on a facade and `windowSize` on the component — two
  opt-outs at two layers, where `sortable` settled on the facade.
- **Three smaller repeats, all named and all cheap:** the route-scoped list selector trio exists twice
  (readings, pills) and wants a factory beside `list.selector.ts`; the settings page renders the same
  label + segment block three times; and `Chart.register(...registerables)` plus a near-identical options
  object sits in three chart hosts, where `@shared/util/charts/` is already the shared home.

## Open review findings

Not blocking; kept here so they are not re-found.

- **Neither the vitals toolbar nor the household `ion-tab-bar` is worth touching**, both halves measured
  rather than argued. `list-page` guards the toolbar on `facade.hasToolbar?.() ?? true` and both vitals
  facades set it `false`, so there is no empty bar to remove. And the tab-bar has nothing to cap: Ionic
  gives it `justify-content: center` with `max-width: 168px` per button, so the three are already a centred
  504px cluster — padding the host moves them 0px (measured at a 1600px viewport, buttons at 548/716/884
  either way). Its band is full-bleed on the same grounds the header's is.
