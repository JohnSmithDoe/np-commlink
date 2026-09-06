# Next version — what v2.0.0 owes

**Scheduled, not open.** Nothing here is blocked — [state.md](./state.md) holds what is, and settled
questions are in [decisions.md](./decisions.md). Three entries change a persisted shape, so the first
genuine rung is owed by whichever ships first.

## Cash

- **Transfers between own accounts are not detected on import.** `isTransfer` is set only by the transfer
  modal, so importing both accounts' statements books one internal move as spend on one side and income on
  the other, inflating the report and the burn-down. Detection is shaped like
  `findReconciliationCandidates` — opposite amount, ±3 days, a different account — offered as pairs to link
  in the import preview. The one v2 entry that fixes wrong numbers rather than adding a capability.
- **The IBAN on an account is compared, never validated.** A hand-typed typo refuses every import as
  `wrong-account`, and the toast names the IBAN the **file** carries, which reads as the file being wrong. A
  mod-97 checksum is ten lines; open question is whether a wrong-but-well-formed IBAN earns a second error state.

## Destructive actions and undo

- **The cascade half of the destructive-action policy.** The row half is settled. Left: a category delete
  strips three reducers, tracking's _Reset all_ discards every running timer, geist's purge fires unannounced
  on a persona switch. Cash's `deleteConfirmAlert` is the row-level confirm still standing, at four sites.
- **Two cascades have no restore action** — PRODUCTS (leaves the recipe lines it emptied empty) and CASH
  categories (whose delete also deletes every rule pointing at it and blanks a schedule's, so its entry has
  to carry three collections rather than a list of ids).
- **The undo scope has no gate.** Producer and page each name the list; drift shows as a button that never
  appears. Owed: a plugin rule banning a string literal in the three scope positions, and a contract spec
  per producing list.
- **A list scoped per page breaks where one list is shown on two pages.** Readings are one list shown
  filtered per profile, so profile A's reading is undoable from profile B's page. Cash transactions and
  trackplay games have the same shape already. The fix widens `undoableDelete.scope` to accept a function
  of the item.

## The shared list page

- **A list has to declare its own sort fallback.** `filterAndSortItemList` falls back to NAME when `sort` is
  absent, so household's unmarked sort button is correct and the recipe list's absent sort means the
  cookability ranking. Two cheap fixes fail: seeding `sort` into initial state reaches nobody who has the
  problem (`hydratedList` takes the stored document wholesale), and reading an absent sort as "name" inside
  the toolbar lies on the recipe list. Owed: a `defaultSort` the FACADE declares beside `sortOptions`, which
  the toolbar marks when `activeSort` is absent.
- **`/cash` is not a caller of the shared toolbar at all** — the accounts page hangs its net worth in
  `toolbarActionsEnd` but renders no sort row. Worth doing after the entry above, not before.

## Measured costs

- **A picture is base64 in IndexedDB.** base64 costs a third on top of the bytes and every read re-parses a
  string. A `Blob` rendered through `URL.createObjectURL` drops both — makes revoking our problem, and only
  holds if the localforage driver really is IndexedDB. On the APK the honest answer is a real file:
  `@capacitor/filesystem` to add, sync and patch, plus `convertFileSrc` and a CSP that admits it. Either way
  the code carries two paths.
- **The pill intake log is never pruned.** `intakes` gains one entry per pill per day forever — five pills
  over two years is ~3600 entries, carried in every vitals write. Pruning past ~90 days is a few lines, but
  `vitals` is a slice real users hold, so it owes a rung.
- **The match preview re-scans the ledger on every keystroke.** `matchesRegexSafely` compiles a new RegExp
  per transaction, the amount threshold is re-parsed per transaction, and the whole matched set is sorted to
  take five. Owed: a compiled condition set, a running top-five, and a ~250ms debounce — the debounce changes
  **when** the preview updates, which is why it is not a silent cleanup.

## Rejected, not deferred

- **`@angular-eslint/template/no-call-expression`.** 688 hits across 119 files (2026-08-29), and the count
  is the reason: the rule matches every `Call` node except `$any` and output handlers, so `facade.items()` —
  a memoised signal read — is indistinguishable from `statusColor(item)`. Its options filter by receiver
  NAME, which cannot express "zero arguments". The rule predates signals. The underlying concern is real and
  now has no gate: a call WITH arguments in a `@for` body re-runs per row per change detection. That would
  need a rule of our own matching a `Call` with a non-empty argument list.

## Platform reach

- **Barcode scanning was REMOVED, and returning means a free-software reader.** It shipped on
  `@capacitor-mlkit/barcode-scanning`, whose `com.google.mlkit:barcode-scanning` put
  `libbarhopper_v3.so` in the APK across four ABIs — **21 MB of a 29.8 MB artifact**, proprietary, under
  the Google APIs / ML Kit Terms of Service rather than any open licence, and non-sublicensable, which
  an AGPL work cannot cleanly carry. The feature never earned that: it only ever called `scan()`, and
  fed the raw EAN to `createProduct` as the **name**, so scanning the same tin twice made two products.
  The replacement shape, if it returns: **ZXing compiled to WebAssembly** (`zxing-wasm`, or the
  `barcode-detector` polyfill that wraps it behind the standard `BarcodeDetector` API), Apache-2.0, a
  few hundred KB, driven from `getUserMedia`. One code path for the PWA and the APK, no Capacitor
  plugin, no native patch, nothing from Play Services. Two honest costs: `android.permission.CAMERA`
  comes back (the WebView needs it for `getUserMedia`), and ZXing reads 1D codes visibly worse than
  barhopper did at an angle or in poor light, so the UI has to help with framing rather than assume a
  grab-and-go read. **Do it as a LOOKUP this time** — `barcode?: string` on `Product`, additive and
  optional so it owes no rung — and put the control on all three lists, since every scan lands in
  products.
- **An offline EAN catalog is possible, downstream of the scanner returning.** Open Food Facts publishes the
  database as one gzipped CSV — 1.19 GiB, rebuilt daily, with a delta feed. 211 columns, of which four matter
  (`code`, `product_name`, `brands`, `quantity`) plus `countries_tags` to cut it to the German market, at
  ~40 bytes a kept row. Shape is `emoji:build`'s — a committed artifact regenerated on demand. **The subset
  size is not measured**, and sampling does not work: the dump is code-ordered, so its first chunk holds no
  German EAN (400–440), and gzip's single stream has no random access. Second gate: OFF is **ODbL**,
  share-alike on a derived database.
- **`@capacitor/haptics` has zero call sites.** What defers it is taste — WHICH events earn a buzz — and it
  wants a settings switch. The web build cannot ride along: the plugin's web implementation THROWS
  `unavailable` where `navigator.vibrate` is absent rather than no-opping, so every call site needs a guard.
- **Reading the phone's own payments by parsing the bank's and Wallet's push notifications.** No Android API
  exposes Wallet or tap-to-pay history; `NotificationListenerService` is the single hook. It fits the model
  — a captured spend is `source: 'manual', status: 'pending'`, which the next camt import reconciles through
  machinery that already ships. Costs: a native plugin nobody maintains (so one to **own**), per-bank text
  parsing that breaks when a bank rewords a push, and Android-only. Proper bank access is a separate wall —
  PSD2 needs an AISP licence plus an eIDAS certificate, FinTS a product registration and a socket client;
  all three end at a backend this app does not have.
- **The handbook has no language axis, and French shipped without one.** The UI speaks three languages;
  `public/handbook/pages/*.json` is 19 pages of German prose, and `handbook.service.ts` fetches
  `./handbook/pages/<slug>.json` flat — no language in the path, so there is nothing to fall back *from*.
  Adding one is a directory level, a fallback rule per page, and 19 pages of long-form prose per language.
  The figures are the harder half: every screenshot is of a German UI, so a translated page either shows
  German figures or `handbook:shots` grows a language axis — and that suite already runs on release only,
  by hand. Falling back to German is the current behaviour by accident rather than by design; making it
  deliberate (a page declaring which languages it has, and saying so in the reader's language) is the
  cheap half and can land alone.
- **The app becomes a share target.** A `share_target` carrying a file must be `method: "POST"`,
  `enctype: "multipart/form-data"`, and the POST intercepted in the service worker — wrapping
  `ngsw-worker.js` in an `importScripts` shim, since ngsw exposes no `fetch` hook. It also arrives with no
  account context. ~200 lines and a registration path that can brick a PWA install, against two taps saved.
- **Edge-to-edge draws under the navigation bar.** The paint is right and stays. Touch is the second
  question and CSS does not settle it: under gesture navigation the bottom ~24dp keeps swipes while letting
  most taps through, under three-button navigation the ~48dp strip takes everything — so a control in the
  inset fails intermittently rather than visibly. Two places the existing rule cannot reach:
  `ion-modal`'s `applyFullscreenSafeArea()` returns early on `isSheetModal || isCardModal`, so the date
  picker puts three buttons on the bottom edge unpadded; and a bottom margin is inert wherever the last
  child is a component host with no declared `display` (an Angular host defaults to `inline`).
  Switching the phone to three-button navigation is the cheapest confirmation available.

## The deck

- **Ordering and hiding cost four interactions before the thing being changed is even on screen.** Both
  live in the config page's order lens, so changing what the deck shows means drawer → DECK → REIHENFOLGE
  → drag or eye, then back. The deck itself is inert: a tile opens its program and does nothing else.
  That is the accepted cost of dropping arrange mode ([domains.md](./domains.md)) and it is too high —
  the setting is about the grid, and it is edited everywhere except on the grid.
  **What a return must not be:** a list on the deck. That is the order lens rebuilt one route away, which
  is why arrange mode went. Only direct manipulation of the tiles earns a second surface.
  Two shapes, and they compose: **move buttons on the tile** (what v1 shipped, and they worked — they were
  removed for being ugly, not for being wrong), and **a visibility toggle on the card itself**. Neither is
  free, for the same reason arrange was a MODE to begin with: **a tile IS an `<a routerLink>`**, so any
  control on it competes with the tap that opens the program, and `ion-reorder-group` cannot drive the grid
  at all — the gesture is y-only ([footguns.md](./footguns.md)), so dragging tiles means a hand-written
  pointer drag, ~120 lines, plus suppressing touch-scroll mid-drag.
  Cheap and worth pricing first: **long-press a tile to toggle its visibility**, which needs no mode and no
  second layout, against R5 — a gesture is never the only way, and here the order lens already is the other
  way. **Owes no rung:** `hiddenTiles` and `reorderWithin` already ship, so this is UI only.
- **Price the DRAWER before either of those — it may retire the entry above.** The side menu already
  renders the same entries in the same order, as `ion-item`s in an `ion-list` (`app.component.html:37`):
  **a single-column vertical list, which is the one thing `ion-reorder-group` does support.** Everything
  the grid cannot have comes free here — no hand-written pointer drag, no y-only problem, no second
  layout. Three things it wins outright: the drawer opens from **every page**, so a global setting stops
  being reachable only from one route; past 992px it is a permanent pane, so the reorder happens in the
  surface being reordered rather than one route away; and it lists the `onDeck: false` entries too, so it
  can order the WHOLE list instead of the tile subset.
  **It likely needs no mode at all.** Drag-by-handle is its own hit target — Ionic's `ion-reorder`
  already calls `stopImmediatePropagation` on click inside an enabled group — so the handle can sit in
  every row permanently while the rest of the row keeps navigating, exactly as the config order lens
  works today. The open question is visual noise, not mechanics.
  The eye belongs here too, and reads better here than anywhere: hiding a tile while keeping the row is
  legible precisely when **you are looking at the row that stays**.
  Two wrinkles: the reorder group's direct children would be the `ion-menu-toggle` wrappers rather than
  the `ion-item`s, which is what `.reorder-list-active > *` would restyle mid-drag
  ([footguns.md](./footguns.md)); and the drag stays pointer-only, so the config order lens remains the
  keyboard path (R5) and cannot be dropped as a duplicate.
- **A cold install hands the whole catalog to someone who has seen none of it.** The empty deck is a rule
  and stays one ([domains.md](./domains.md)) — but its one entrance drops a first-time user straight into
  the config page: every program in the catalog, grouped by module, each a switch with a codename and a
  civil name and nothing saying which of them is for them. The catalog only grows, so the landing gets
  worse on its own, and the failure is not confusion but resignation — everything on, or nothing.
  Owed: **a step-by-step setup wizard that asks rather than lists.** A few questions in the user's own
  terms — do you track working hours, do you cook, do you want the money side — each switching on the
  entries that answer it, one screen at a time, with what it just enabled shown as it goes. It must
  **pick nothing on its own**: the wizard is a different way to answer the same question the config page
  asks, so an unanswered step leaves those entries OFF and the empty-deck rule survives it.
  Skippable, and **re-runnable from SYSOP** — the second run is the more useful one, once the catalog has
  grown past what the first covered.
  **This is where the module count is actually paid for**, not on the deck: the deck shows what was
  chosen, the wizard is what makes choosing survivable.
  Two costs: the questions are **wording, not code**, and wrong wording makes it worse than the list it
  replaces — they want drafting in German first, in the plain skin's voice, since a wizard speaking
  cyberpunk to a new user is the problem restated. And **"has run the wizard" is a persisted flag** in
  `settings`, a slice real users hold, so it owes the usual ask before it is added.

## BIOMON

The browse tree **shipped** — `/vitals/browse`, twelve signs, 64 hexagrams, nine Ki stars, nine life
numbers, own deck program, both detail routes deep-linkable. Left:

- **The world ages are still not browsable, deliberately.** Browsing them invites the question of where the
  boundaries come from, and the answer is a pick rather than a source ([state.md](./state.md)). Settle the
  source first.
- **Filtering the 64 by trigram** — a `computed` over `HEXAGRAMS`, and the one place a search box would earn
  itself. The index ships unfiltered because 64 cells fit a grid.
- **The astro pages print numbers and never say where they come from.** A reader sees `2 · Erde`, `Ki-Jahr
  1980`, a life number of 4 from the same birthday, `Nr. 31` under six drawn lines — and nothing on screen
  says which follows a rule you could check against a book. The honest distinction is between what is
  DERIVED by a stated rule (Ki number, life number, hexagram and its transformation) and what rests on a
  convention somebody picked (the world-age boundaries; cusp dates taken as fixed calendar days rather than
  the true solar ingress, which moves up to two days a year).
  Two homes, not exclusive: a handbook article under `public/handbook/pages/` (the shape every other module
  uses, but figures are regenerated on release by Martin alone), or per-panel disclosure — a tappable "wie
  wird das berechnet?" under each readout, which needs no screenshots and sits against the number it
  explains, at the cost of more i18n and more page height.
  **What has to be in it either way:** the cusp table and why a date before 20 January reaches back into the
  previous year's Capricorn; the 2150-year age table and its lack of consensus; the 4 February Ki-year
  boundary and the number descending one per year, wrapping 1 to 9; the full-date digit sum reduced to a
  single figure and that it answers to numerology rather than the Ki cycle; and the coins — three per line,
  heads 3 and tails 2, sum 6 to 9, parity carrying yang and 6 or 9 marking the line as changing, read bottom
  to top.

## TRACKPLAY

- **The board plays a game but polices no turn.** Any figure moves by any count: nothing holds whose turn
  it is, nothing grants the extra roll a six earns, nothing gives a player with an empty board their three
  throws, and nothing enforces that an occupied start field is cleared first. That is deliberate — the
  board is a virtual copy of a game on the table, and there the humans already hold the turn order, so a
  board that refuses a move the physical game has just made is wrong more often than it is right. What
  makes it a real question rather than a settled one is that the same screen is the only place a game
  could be played with nobody at a table.
  Owed if it lands: turn state — current player, throws left, whether a six is pending — which is a
  persisted shape in the `board` slice and so wants the usual ask. The move rules are already a
  ruleset (`BoardRules`), so the turn rules belong beside them as toggles rather than as a second engine,
  and the decision to make first is whether the board FOLLOWS the table or LEADS it.

## SOYKAF

Recipe-book scope lives with the domain: [domains.md](./domains.md).
