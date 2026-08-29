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

## SOYKAF

Recipe-book scope lives with the domain: [domains.md](./domains.md).
