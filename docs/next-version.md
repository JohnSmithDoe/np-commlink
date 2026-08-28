# Next version — what v2.0.0 owes

**Scheduled, not open.** Everything here was triaged into v2.0.0 deliberately; the reasoning is kept so
the decision does not have to be re-made. Nothing here is blocked — [state.md](./state.md) holds what is,
and settled questions are in [decisions.md](./decisions.md).

Three entries below change a persisted shape, so the first genuine rung is owed by whichever ships
first — see [state.md](./state.md) for the ladder's current position, the roster of who is holding what,
and every exemption taken so far.

## Cash — the numbers, then the keyboard

- **Transfers between own accounts are not detected on import, and the report pays for it.** `isTransfer`
  is set only by the transfer modal, so importing both accounts' statements books one internal move as
  spend on one side and income on the other, inflating every figure in the report and the burn-down.
  Detection is cheap and shaped like `findReconciliationCandidates` — opposite amount, ±3 days, a
  different account — offered as pairs to link in the import preview. This is the one v2 entry that fixes
  wrong numbers rather than adding a capability.
- **The IBAN on an account is compared, never validated.** It is normalised — spaces stripped,
  upper-cased — matched against the statement's, and an empty one adopts what it reads, so the common
  path never needs a keyboard. A hand-typed typo is the gap: it refuses every import as `wrong-account`,
  and the toast names the IBAN the **file** carries, which reads as the file being wrong. A mod-97
  checksum is ten lines; what it does not settle is whether a wrong-but-well-formed IBAN earns a second
  error state, since the checksum cannot catch that one either.

## Destructive actions and undo

- **The cascade half of the destructive-action policy.** The row half is settled
  ([decisions.md](./decisions.md)). Left: a category delete strips three reducers, tracking's _Reset all_
  discards every running timer, geist's purge fires unannounced on a persona switch — all destroy what
  the user was not looking at. Cash's `deleteConfirmAlert` is the row-level confirm still standing, at
  four sites: accounts, the ledger, rules and schedules.
- **A cascading delete needs a restore action before it can join the undo stack.** The stack replays
  `addItem(item)`, which is exactly wrong for a delete that also touched other slices: a category comes
  back with every item it was stripped from still untagged, a profile without its readings and pills,
  and products — which already opted in — leave the recipe lines they emptied empty. Each needs a
  restore action carrying what the cascade removed, computed where the cascade runs. Until then the
  categories dialog's full swipe is the sharpest gesture in the app, having been made `expandable` on
  the promise of an undo that does not cover it yet.
- **Trackplay joins the undo stack, per entity.** `restoreSnapshot` writes the pre-delete `players`,
  `games` and `gameTypes` arrays back wholesale, so delete → add player → undo loses the new player.
  Per-entity restore actions fix it and let trackplay pass `undoableDelete` like shopping, storage and
  products already do. Nothing is broken today: delete followed straight by undo is correct.

## Measured costs

- **A picture is base64 in IndexedDB, and binary is the better answer on both platforms.** The store keys
  each image on its own, but the value is a data URL: base64 costs a third on top of the bytes and every
  read re-parses a string. A `Blob` in IndexedDB drops both, rendered through `URL.createObjectURL` —
  which makes revoking our problem, and only holds if the localforage driver really is IndexedDB (a
  localStorage fallback cannot carry a Blob at all). On the APK the honest answer is a real file:
  `@capacitor/filesystem` is not a dependency yet, so it is a plugin to add, sync and patch through
  `android-postsync.sh`, plus `convertFileSrc` and a CSP that admits it. The PWA has no such option, so
  either way the code carries two paths.
- **The pill intake log is never pruned.** `intakes` gains one entry per pill per day and nothing removes
  it, so it is carried in every vitals write forever — five pills over two years is ~3 600 entries.
  Pruning past ~90 days is a few lines, but `vitals` is a slice real users hold, so it is a shape change
  and owes a rung.
- **The match preview re-scans the ledger on every keystroke.** `matchesRegexSafely` compiles a new
  RegExp per transaction and the amount threshold is re-parsed per transaction, then the whole matched
  set is sorted to take five. A compiled condition set (resolve the RegExp and the cents once), a running
  top-five and a ~250 ms debounce on the preview input are the three halves of it; the debounce changes
  **when** the preview updates, which is why it is not a silent cleanup.

## Platform reach

- **The EAN scan works, and identifies nothing.** This is the one entry here about polishing something
  that already ships. `#showCreateProductFromScan` hands the code to `createProduct` as the **name**, so
  a scan yields a product called `4006381333931` that you type over — and scanning the same tin next
  month yields a second one. The fix is a `barcode?: string` on `Product`, which turns the scan into a
  LOOKUP: a known code adds the existing product to the list it was scanned from, an unknown one opens
  the create dialog with the code STORED rather than spelled as a name. The shape change is free by the
  additive-and-optional rule — a missing key hydrates to initial state — so `household` having real
  holders costs nothing here, and the rung question is answered by the shape rather than the roster.
  Second half of the same fix: the button sits on storage and shopping only, while every scan lands in
  products. That leaves the unknown code still needing its name typed once — which the entry below is
  about, and which this one does not wait for: a stored barcode is worth having whether or not a
  catalog ever names it.
- **An offline EAN catalog is possible, and the only open question is what it weighs.** Open Food Facts
  publishes the whole database as one gzipped CSV — **1.19 GiB, rebuilt daily**, with a daily delta feed
  beside it so a refresh is not a re-pull. 211 columns, of which four matter (`code`, `product_name`,
  `brands`, `quantity`) plus `countries_tags` to cut it to the German market, at roughly 40 bytes a kept
  row. The shape is `emoji:build`'s: a committed artifact regenerated on demand, so the app makes no
  network call and a stale copy can only miss recent products. **What is NOT measured is the subset
  size**, and one obvious shortcut does not work — the dump is code-ordered, so its first chunk is the
  `000`/`001` band and contains no German EAN (400–440) at all, while gzip's single stream has no random
  access to sample the interior. Only a full download settles it, and that number decides whether this
  ships to the PWA or stays an APK asset. Second gate before adopting: OFF is **ODbL**, which is
  share-alike on a derived database — cheap to satisfy in an AGPL repo, but a real term, not a
  formality.
- **`@capacitor/haptics` has zero call sites.** Kept on plugin-hygiene grounds, which says nothing about
  using it. On the APK it is the cheapest upgrade available to how the app feels. What defers it is not
  effort: WHICH events earn a buzz is taste, and it wants a settings switch, because there is nothing to
  turn off today. The web build cannot ride along either — the plugin's web implementation THROWS
  `unavailable` where `navigator.vibrate` is absent rather than no-opping, and Safari has none — so every
  call site needs a platform guard or a catch.
- **Reading the phone's own payments, by parsing the bank's and Wallet's push notifications.** No Android
  API exposes Google Wallet or tap-to-pay history to a third-party app; the Google Pay APIs take payments,
  they do not report them. The single hook that exists is `NotificationListenerService`. It fits the model
  unusually well: a captured spend is `source: 'manual', status: 'pending'`, which the next camt import
  reconciles through machinery that already ships. What it costs: a native plugin nobody maintains
  (`capacitor-notificationlistener`'s own author says it is old and probably broken on current Android),
  so it is a plugin to **own**; parsing that is per-bank text and breaks when a bank rewords a push; and
  Android-only, inert on the PWA. Proper bank access is a separate wall — PSD2 needs an AISP licence plus
  an eIDAS certificate, or an aggregator holding a client secret on a server, and FinTS needs a product
  registration and a socket client. All three end at a backend this app does not have.
- **The app becomes a share target, and files are why it is not one yet.** A manifest-only declaration is
  wrong for files: a `share_target` carrying one must be `method: "POST"`, `enctype:
  "multipart/form-data"`, and the POST has to be intercepted in the service worker — which means wrapping
  `ngsw-worker.js` in an `importScripts` shim and registering that instead, since ngsw exposes no `fetch`
  hook. It also arrives with no account context, so the receiving flow needs an account chooser before
  the import preview. Two hundred lines and a registration path that can brick a PWA install, against
  roughly two taps saved over the file input the account page already has.
- **Edge-to-edge draws under the navigation bar, and the strip that reads well is also a dead zone.** The
  paint is right and stays: `SystemBars.insetsHandling` defaults to `'css'` and injects
  `--safe-area-inset-*`, which `global.scss` maps onto Ionic's variables, and toolbar, footer, tab bar,
  toast, action sheet and modal inset themselves — `ion-content` and `ion-fab` never do, which is what the
  `margin-bottom` on `ion-content > *:last-child` answers. Touch is the second question and nothing in CSS
  settles it: under gesture navigation the bottom ~24dp keeps swipes and drags while letting most taps
  through, under three-button navigation the ~48dp strip is a system window that takes everything, so a
  control sitting in the inset fails intermittently rather than visibly. Two places the existing rule
  cannot reach. `ion-modal`'s `applyFullscreenSafeArea()` returns early on `isSheetModal || isCardModal`,
  so the date picker — an `initialBreakpoint: 0.65` sheet holding an `ion-datetime` with its default and
  clear buttons, and no `ion-content` for the last-child rule to bite on — puts three buttons on the
  bottom edge with neither Ionic nor this repo padding them. And a bottom margin is inert wherever that
  last child is a component host with no declared `display`, since an Angular host defaults to
  `display: inline` and an inline box drops it: `app-item-list` and `app-item-list-empty` both declare
  `flex`, so list pages hold, and a page ending in an undeclared host does not. What defers it is which
  control actually fails — switching the phone to three-button navigation turns the intermittent case into
  a reproducible one, and is the cheapest confirmation available before anything moves.

## BIOMON — what browsing left behind

The tree itself **shipped**: `/vitals/browse` with the twelve signs, the 64 hexagrams, the nine Ki stars
and the nine life numbers, its own deck program, and both detail routes deep-linkable. Why it is a
separate tree rather than a second selection on the reading pages is settled in
[domains/biomon.md](domains/biomon.md). Two things it deliberately did not do:

- **The world ages are still not browsable, and that was the point.** Browsing them invites the question
  of where the boundaries come from, and the answer is a pick rather than a source
  ([state.md](./state.md)). The sign detail names the age a sign rules and prints the existing caveat
  beside it; making the table itself walkable would advertise the weakest data on the page. Settle the
  source first.
- **Filtering the 64 by trigram** — "show me everything with Water below" — is a `computed` over
  `HEXAGRAMS` and the one place a search box would genuinely earn itself. The index ships unfiltered
  because 64 cells fit a grid; it stops fitting the moment a reader wants a subset.

## BIOMON — the astro pages explain themselves

Owed by the entry above, which shipped without it: browsing invites "why does it say that", and an
explanation nobody can reach from the screen holding the question is not one. The browse tree makes this
sharper rather than softer — a reader who can now open all 64 hexagrams has 64 more occasions to ask.

- **The pages print numbers and never say where they come from.** A reader sees `2 · Erde`, `Ki-Jahr
  1980`, a life number of 4 from the same birthday, and `Nr. 31` under six drawn lines. Nothing on screen
  says why the Ki year turned in February, why one digit sum gives 2 and the other 4, what three coins
  have to do with a broken line, or which of those numbers follows a rule you could check against a book.
  That knowledge exists only in [domains/biomon.md](domains/biomon.md) and in the source banners —
  developer-facing, and the reader is the one holding the question.
- **Being straight about it matters more here than in the rest of the app.** Everywhere else a number is
  arithmetic over the user's own data and the worst case is a bug. These pages carry divination, where the
  honest distinction is between what is DERIVED by a stated rule — the Ki number, the life number, the
  hexagram and its transformation, all deterministic and checkable — and what rests on a convention
  somebody picked: the world-age boundaries, and cusp dates taken as fixed calendar days rather than the
  true solar ingress that moves up to two days a year. The explanation is what turns "the app says so"
  into "here is the rule, check it", and it is also where the existing `vitals.astro.age-estimate` and
  `vitals.iching.source` notes stop being orphan disclaimers and become part of an account.
- **The handbook is the existing home, and screenshots are what defers it.** Every other module explains
  itself as an article under `public/handbook/pages/` with an entry in
  `public/handbook/pages/catalog.json`, so a BIOMON astro article is the shape that already fits. The
  catch is figures: shots are regenerated on release by Martin alone
  ([CLAUDE.md](../CLAUDE.md)), so the article either ships figure-free or waits for a shots run — and
  `biomon` is already flagged `shotsStale`, so it is waiting on one regardless.
- **The alternative is per-panel disclosure, and it is not obviously worse.** A tappable "wie wird das
  berechnet?" under each readout needs no screenshots, sits against the number it explains rather than
  three taps away in a separate article, and survives a reader who never opens the handbook. It costs more
  i18n and more page height on screens already three and four panels long. The two are not exclusive: the
  short form belongs on the page, the long form in the handbook, and the decision to make first is whether
  the handbook article is worth writing twice over.
- **What has to be in it either way.** The cusp table and why a date before 20 January reaches back into
  the previous year's Capricorn; the 2150-year age table and its lack of consensus; the 4 February Ki-year
  boundary and the number descending one per year, wrapping 1 to 9; the full-date digit sum reduced to a
  single figure, and that it answers to numerology rather than to the Ki cycle; and the coins — three per
  line, heads 3 and tails 2, so the sum is 6 to 9, its parity carries yang and 6 or 9 additionally marks
  the line as changing, read bottom to top. None of that drifts with a refactor, which is why it is worth
  writing down for a reader rather than only for whoever edits the table.

## SOYKAF recipe book

Its scope lives with the domain: [domains/soykaf.md](domains/soykaf.md).
