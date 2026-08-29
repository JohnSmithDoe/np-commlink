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
- **`APP_VERSION` is 1 and `runMigrations` has never run a step.** The first genuine rung is unwritten and
  has no precedent in the repo to copy.
- **`vitals` and `notes` are published from v1.1.0 on**, so `VitalsState` (`profiles`, `readings`, `pills`)
  and `notes` are somebody's data. Anything holding either from before that tag came from a locally built
  debug APK, which a release-key install cannot upgrade.
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
- **`en.json` read by a human.** Both bundles hold the same keys and only ~76 values are identical
  (measured 2026-08-02 — recount before citing). The first English session is the first proofread.

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

- **Angular 22 is gated on NgRx.** On `21.2.18` (`v21-lts`, supported, not urgent); `@ngrx/*` latest is
  `21.1.1` peering `@angular/core: ^21.0.0`, `next` only `22.0.0-beta.0`. **Bump when `@ngrx/*@22` is stable.**
  - **Lockstep, one atomic commit or none:** `@angular/*` + `@angular/cli` + `@angular/build` +
    `angular-eslint` + `@ngrx/*`. Peer ranges are mutually exclusive across the v21/v22 boundary and
    Angular's intra-family peers are **exact**, so one held-back member pins the set.
  - Already compatible: `@ionic/angular` 8.8.x, `@ionic/storage-angular`, `ng2-charts` 9, `@ngx-translate/*` 18, Sheriff.
  - Run `ng update @angular/core@22 @angular/cli@22`; never hand-edit `package.json`. Its own commit.

## Open defects

- **Two household header actions are vertically clipped** — the cart on STASH and the tray on MARKET are
  sliced by the toolbar's top edge, while the tab bar renders the same glyphs whole. **The cause is not in
  the source**: Ionic's `.toolbar-container` carries `contain: content` and `overflow: hidden`, but does so
  on every page. Needs the app on screen at 412px to diagnose.
- **The birthdate field prints `05/14/1980`.** A native `<input type="date">` follows the DEVICE locale, not
  the app's language, against `dd.MM.yyyy` everywhere else.
- **Native controls ignore the skin** — SYSOP's two `<input type="color">` swatches and BIOMON's date field,
  the only unskinned chrome in the app. Replacing the native input answers this and the entry above, and
  drags in the sheet-modal safe-area entry in [next-version.md](./next-version.md).
- **Cash's rules and schedules answer an empty list with a bare sentence** on a divider, where
  `app-empty-state` exists and cash already uses it five times. _Regeln anwenden_ is offered, full-width and
  solid, with zero rules to apply.
- **Trackplay's totals row is pinned to the bottom of the viewport**, so a three-round grid puts the summary
  a screenful of emptiness below its own table.

## Known cost, not yet paid

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
