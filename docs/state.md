# State — blocked, one-way doors, and costs left standing

**Check before proposing work.** Each entry needs a secret, an upstream release, a human reading the
result — or is a measured cost left standing on purpose. Settled questions are in
[decisions.md](./decisions.md); the next major's scope in [next-version.md](./next-version.md).

## One-way doors

Each field below is one a distribution channel compares to decide _same app or different app_. The
published tags have closed every one: changing one stands up a second app that cannot reach the first
one's data.

- **The signing key exists and custody is the whole task.** `signingConfig` is postsync patch 5, reading
  four `NPC_*` env vars resolved into `pnpm run apk:signed`'s own process. The shipped APK verifies v2 + v3
  and its signer SHA-256 is pinned in the README. **Back the keystore up in two places**, 25+ year
  validity. An APK signed with a different key can **never** upgrade one signed with this one; the only way
  in is an uninstall that wipes every tracked session, the pantry and the ledger. Deliberately not in the
  repo despite AGPL.
- **`enableV3Signing = true` shipped on** — set explicitly against AGP's default at `minSdk 24`. v3 carries
  the proof-of-rotation lineage, which is what keeps rotation reachable at all.
- **`manifest.id` shipped as `"np-commlink"`**, parsed as a URL against the **origin** — a leading or
  trailing slash is a different identity with its own IndexedDB. Never touch.
- **Renaming a persisted key or a deck entry id costs a ladder rung wherever somebody holds one.**
  [CLAUDE.md](../CLAUDE.md) carries the roster and the standing instruction to **ask** rather than infer.
- **`APP_VERSION` is 2, and the `tasks` ladder holds the repo's only rung.** It is the precedent every
  later one copies: written against `unknown`, casting once, pinned by a spec against a literal of the v1
  shape. The number is global, so every other slice is walked past and re-stamped on the same hop.
- **A close that happens before `closings` exists is gone.** The log is append-only and cannot be
  reconstructed from `doneAt`, which holds one date. That is what put the field in ahead of the screen
  that reads it — see [decisions.md](./decisions.md); every other recurrence field describes a task's
  future and could have waited.
- **`vitals` and `notes` are published from v1.1.0 on**, so `VitalsState` (`profiles`, `readings`, `pills`)
  and `notes` are somebody's data. Anything holding either from before that tag came from a locally built
  debug APK, which a release-key install cannot upgrade.
- **BIOMON's profiles RESET when they moved to `people`** — asked and answered, not really in use. A
  stored `profiles.items` is dropped on load (`asCurrentShape` in `profiles.reducer.ts`). The readings and
  pills keyed on those ids **are deleted by the first BIOMON load of the next tag** — the orphan sweep
  cannot tell a pre-`people` profile from a removed person. Asked and answered: swept, no rung. `people` is published from the next tag on.
- **`deck` and `settings` RESET rather than migrate.** `deck` stores `visibleEntries` where a pre-v1.1.0
  document carries `hiddenEntries` + `hiddenModules` (`isCurrentShape` in `deck.reducer.ts`). `settings`
  splits `theme` into `skin` and `mode` and falls through `{...initialSettings, ...settings}`.

## Exemptions taken

None is a precedent — cost is a fact about the roster, not about the change.

- `groceries → household` — renamed before the first tag, dev browser the only holder.
- cash's `bank` → `iban` + `bankRef` — breaking, free because cash has no users. **Spent**: the next cash
  shape change once it holds real data owes the first real rung. `CashSchedule.dueDay` rides the same one.
- `excludedFromAllowance`, `pills` + `intakes`, recipes' `sort`, `Profile.favorite`, `TaskItem.doneAt` —
  additive and optional, so a missing key hydrates to initial state. Free by shape, not by roster:
  `tasks` and `vitals` both have real holders.
- deck entry id `barcode` → `notes` — the first taken against a slice real users hold. Cheap only because
  switching one program back off is a tap.
- `deck`'s pre-flip document — RESET. `settings`' `theme` → `skin` + `mode` — worst case one re-pick.
- The 09:00 office nudge is cancelled once at boot — **not a rung**: what is stale is a schedule the OS
  owns, not a shape on disk (`legacy-reminders.effects.ts`).

**A dev browser holding pre-camt cash rows has them with no `importKey`**, and a camt import will not
recognise them: clear the cash slice there rather than reading the duplicate count as truth.

## Blocked — needs something only the owner can supply

- **Any camt import driven live, against a file a bank actually produced.** The parser is unit-tested
  against synthetic documents only. The exports in `docs/cash/` (gitignored) carry Volksbank's real
  **shape** — tag nesting, ISO-8859-1 bytes, 150-entry pagination, the 140-character `Ustrd` truncation
  that splits an IBAN across two — with invented **value**. Volksbank, DKB and ING each need their own
  first run: which optional elements a bank fills is not part of the format, `AcctSvcrRef` above all, since
  its absence silently downgrades every key on the statement to a derived one.
- **The world-age boundaries are a pick, not a source.** 2150 years per age with Pisces at 1..2150 CE.
  Published schemes disagree by centuries. Swapping the table in `src/app/vitals/model/astro.consts.ts` is
  one edit once the owner names a school.
- **`en.json` and `fr.json` read by a human.** All three bundles hold the same keys, and neither
  translation has been proofread by anyone who speaks the language. The first session in each is the
  first proofread.
- **SIMSENSE has played only on an emulator.** Verified 2026-10-11 against a local jamserve through
  `adb reverse`: native login, browsing, covers, ExoPlayer streaming with the bearer header, and the media
  notification. Only a phone can show the screen-off run on Wi-Fi, the lock screen, surviving a swipe-away,
  and an internet server behind TLS. `media3Version` in `android/variables.gradle` is unverified against
  the latest release.
- **The APK has not run on a device since Capacitor 8.5 and Ionic 9.** `apk:build` syncs and every
  postsync patch applies; `pnpm run apk:debug` on a phone is the check left.

## Handbook figures flagged stale

`"shotsStale": true` is set by hand on `public/handbook/pages/*.json` and cleared by the next release
`handbook:shots` run. [CLAUDE.md](../CLAUDE.md) forbids an agent running the suite, so no gate sees this —
**whoever changes a screen sets it on the pages showing that screen.**

The flags themselves are the list — restating it here only drifts:

```sh
grep -l '"shotsStale": true' public/handbook/pages/*.json
```

Figures are shot at a 393px viewport, so an over-capacity toolbar shows in them. Two seeding traps:
**a reading keeps its date in `name`**, not `createdAt` (an empty `name` paints "Invalid Date" ticks), and
**Playwright wipes `outputDir` on every run**, so shots must be written outside it.

## Waiting on upstream

- **TypeScript 7 (the native compiler) is gated on Angular.** Angular, typescript-eslint and
  `@ionic/angular-toolkit` all cap TypeScript `<6.1`. None of the options TS 6 deprecates for removal in 7
  is set here.

## Open defects

- **Two household header actions may still be vertically clipped** — the cart on STASH and the tray on
  MARKET, sliced by the toolbar's top edge while the tab bar renders the same glyphs whole. It reproduces
  only where the status-bar inset is non-zero, so **re-check on the device before treating this as
  open**: the double-inset that `.toolbar-container` (`contain: content`, `overflow: hidden`) was
  clipping is fixed, and that shared the condition.
- **Native controls ignore the skin** — SYSOP's two `<input type="color">` swatches, now the only unskinned
  chrome in the app.

## Known cost, not yet paid

- **The initial bundle sits over its 1.6 MB warning** — 1.67 MB after Angular 22 and Ionic 9, under the
  1.9 MB error. `@ionic/core` is 1.07 MB of it; the root `@ionic/angular` entry is `sideEffects: false`,
  so the weight is Ionic's own, not an import shape.

- **The function-coverage floor clears by 0.34 points** (80.34% against 80 at v1.5.0). A floor on the
  aggregate lets one well-tested domain hide an untested one, so the next untested feature reds it again.
  The fix is a floor per domain or on the diff, not a lower number.

- **The notes list decodes a full picture into a 48px box.** `MAX_EDGE` is two screens, so every thumbnail
  costs a full-size decode; `loading="lazy"`/`decoding="async"` defer it but do not shrink it. A second
  canvas pass at import would store a ~192px `thumbUrl` beside the picture. Free as a shape change (`notes`
  is dev-only), and the list is also unwindowed — the two belong in one pass.

## Measured, not worth touching

- **Neither the vitals toolbar nor the household `ion-tab-bar`.** `list-page` guards the toolbar on
  `facade.hasToolbar?.() ?? true` and both vitals facades set it `false`, so there is no empty bar to
  remove. The tab-bar has nothing to cap: Ionic gives it `justify-content: center` with `max-width: 168px`
  per button, so the three are already a centred 504px cluster — padding the host moves them 0px (measured
  at 1600px). Its band is full-bleed on the same grounds the header's is.
