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

## SOYKAF recipe book

Its scope lives with the domain: [domains/soykaf.md](domains/soykaf.md).
