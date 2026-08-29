# State — blocked, one-way doors, and costs left standing

**Check before proposing work.** Each entry either needs a secret, an upstream release, a human reading
the result — or is a measured cost left standing on purpose. Settled questions are in
[decisions.md](./decisions.md); the next major's own scope is in [next-version.md](./next-version.md).

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

## Every exemption taken, in one place

None is a precedent, because cost is a fact about the roster rather than about the change. What a rung
owes once one IS needed is in [decisions.md](./decisions.md).

- `groceries → household` — key renamed before the first tag, when the dev browser was the only holder.
- cash's `bank` → `iban` + `bankRef` — breaking, free because cash has no users. **Spent**: the next
  cash shape change once it holds real data owes the first real rung.
- `excludedFromAllowance`, `pills` + `intakes`, recipes' `sort` — additive and optional, so a missing
  key hydrates to initial state. Free by shape, not by roster.
- deck entry id `barcode` → `notes` — the **first taken against a slice real users hold**. Under the
  polarity of the day an id the catalog gained read as visible, so every install switched NOTES on by
  itself. Cheap only because switching one program back off is a tap.
- `deck`'s pre-flip document — RESET. `settings`' `theme` → `skin` + `mode` — the same two strings under
  a new field name; worst case one re-pick for a boomer-skin holder.
- `Profile.favorite` — additive and optional, and never written on install: the sole person is the
  favorite by DERIVATION, so an existing document hydrates unchanged and nothing on disk moves. Free by
  shape, like `excludedFromAllowance` above, not by roster — `vitals` has real holders.
- The 09:00 office nudge is cancelled once at boot, from the notifications slice — **not a rung**: what
  is stale is a schedule the OS owns, not a shape on disk. `legacy-reminders.effects.ts` argues why once
  and not per boot.

## Blocked — needs something only the owner can supply

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
- **The world-age boundaries are a pick, not a source.** 2150 years per age with Pisces at 1..2150 CE,
  which reads today as late Pisces. Published schemes disagree by centuries and several put Aquarius
  already underway; the page prints the caveat, and swapping the table in
  `src/app/vitals/model/astro.consts.ts` is one edit once the owner names a school.
- **`en.json` read by a human.** Both bundles hold the same keys and only ~76 values are identical
  (measured 2026-08-02 — recount before citing), so most are real translations. The first English session
  is the first proofread.
- **`stash` and `market` are flagged stale** — the undo toast lost its button, and those are the two
  pages whose delete figure was captioned as showing it. The 2026-08-28 `handbook:shots` run had cleared
  all fifteen flags; these two went back on the list on 2026-08-29. Their prose is already corrected,
  along with `sigil`, `biomon`, `catalog` and `gesten` — whose delete figures catch the row mid-swipe,
  before any toast, and so are NOT flagged. [CLAUDE.md](../CLAUDE.md) forbids an agent running the
  suite, so SETTING `"shotsStale": true` stays manual and no gate can see it — **whoever changes a
  screen sets it on the pages that show that screen**, and the next release run clears it.

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

## Known cost, not yet paid

Measured, understood and left standing on purpose — a shape question, a wording question, or a bill that
only a phone with a few hundred rows actually presents. The ones that got a date are in
[next-version.md](./next-version.md).

- **The notes list decodes a full picture into a 48 px box.** `MAX_EDGE` is two screens, so every thumbnail
  costs a full-size decode; `loading="lazy"`/`decoding="async"` defer it but do not shrink it. A second
  canvas pass at import — the canvas is already there — would store a ~192 px `thumbUrl` beside the
  picture for a few KB. It is a persisted-shape change on the image document, which is free (`notes` is
  dev-only), and the list is also unwindowed, so the two belong in one pass.

## The Pixel 8 walk, and what it found

A pre-release visual pass drove the real app at **412 × 915, DPR 2.625** (Playwright's own `Pixel 8`
descriptor) and shot every program's screens — 130 figures, seeded through the persisted documents and
the UI the way `e2e/handbook/*.shots.ts` does. It was a **walk, not a suite**: nothing asserted, so it
could not go red, and it earned no place in `verify:all`. **The harness is deleted** — a Pixel 8 clone of
`e2e/handbook/` that duplicated its seeding to assert nothing, and a second copy of that seeding is a
cost paid on every later change to it. Re-shooting the set is a `devices['Pixel 8']` project pointed at
the handbook shots, not a second suite.

What it settled first is that the **nav sweep landed**: every page in `DECK_CATALOG` correctly shows no
return row, and every genuine child page has one, derived from the catalog rather than hardcoded. The
findings below are what the screens showed instead. Each fix dates handbook figures, so whichever ones
get paid, set `"shotsStale": true` on the pages that show those screens.

Two traps the walk itself paid for, so the next run does not: **a reading keeps its date in `name`**, not
in `createdAt` (`weight-chart` labels off `localizedDayMonth(reading.name)`), so a seed leaving `name`
empty paints five "Invalid Date" ticks that are the seed's fault and not the chart's. And **Playwright
wipes `outputDir` on every run**, which ate a copy of the shots parked under `test-results/` — whatever
shoots them next must write outside that directory.

### Wrong, not a matter of taste

- **`/cash` clips its own total.** The sort row's right-aligned sum runs past the right edge at 412 px —
  the `€` glyph is cut in half on the accounts page. The clearest defect in the set.
- **Two household header actions are vertically clipped**: the cart on STASH and the tray on MARKET are
  sliced by the toolbar's top edge, while the tab bar renders the same two glyphs whole. Not a fluke —
  both list pages show it.
- **CHRONO's toolbar is over capacity at 412 px** and wraps the sort label onto two lines, `A-` over `Z`.
  The dev-only flask (`@if (isDev)`, `tracking.page.html:32`) additionally clips at the right edge, so
  what ships is the wrap alone.
- **Trackplay numbers its rounds from 0** — the `#` column prints the array index, so a card game opens
  at round 0 — and a fresh round pre-fills `0 / 0 / 0`, which makes "not entered yet" and "scored
  nothing" the same cell.
- **`1 SESSIONS · 0M`** — a plural on one, and a three-second session rounded to zero minutes.
- **AGENDA runs two facts together with no separator**: `Arbeit Fällig am: 26.08.2026` reads as the
  broken phrase "Arbeit Fällig". The report's `28.08.2026 · Wohnen` is the shape to copy.
- **The birthdate field prints `05/14/1980`.** A native `<input type="date">` follows the DEVICE locale,
  not the app's language, so US order appears on a German UI and no language switch touches it, against
  `dd.MM.yyyy` everywhere else.

### One thing, two treatments

- **The ledger row is twice the height of the row that shows the same data better.** A booking spends
  three or four lines — title, category, date, amount each on their own — so five rows fill a phone
  screen, while `cash-report`'s _Größte Ausgaben_ already carries title-with-amount plus one dim
  `date · category` subline. Same domain, same fields, two layouts.
- **Only AGENDA says which sort is active** (an arrow beside `TERMIN`); `/cash` and the household lists
  print their sort keys with nothing marking the live one.
- **CHRONO spells one state three ways on one screen** — a `LÄUFT` chip, a lowercase `läuft` chip, and
  `GESTOPPT` as bare amber text — and one duration two ways, `3 Sekunden` beside `00:00:03`.
- **Two different colours mean "secondary".** In cyberpunk `--sr-text-dim` IS the amber at 85 %
  (`_shadowrun.scss:119`), so the notes snippet, which sets the token, is amber, while `list-item`'s
  `list-row-category` and the deck-config intro never set it and inherit Ionic's grey step. Neither
  breaks `commlink/muted-text-uses-token` — the rule sees a hardcoded colour, not an unthemed default.
- **Filled buttons appear twice and outline everywhere else**: cash's _Regeln anwenden_ and the shopping
  toolbar's bag are solid amber; every other button in the walk is an outline.
- **Green carries four meanings** — income in the ledger, _Ohne Kategorie_ in the report donut, both
  priority 3 and no priority in AGENDA, and a healthy MHD in STASH.
- **Native controls ignore the skin entirely**: SYSOP's two `<input type="color">` swatches wear grey
  browser bezels and BIOMON's date field a white calendar glyph, the only unskinned chrome in the app.
- **The deck config's subline is a label for some rows and a count for others** — "Bürozeiten" and
  "Notizen" against a bare "4 / 4", in the same slot, with nothing saying the count is programs.

### Structure

- **SYSOP is two pages stacked.** Its top half is plain divs, its storage and about halves are `ion-item`
  rows on their own band, and section headers render exactly like field labels — _Deck_, _Akzentfarben_
  and _Speicher_ carry no more weight than _Helligkeit_ — so the hierarchy reads flat. Its worst row is
  _Dauerhafter Speicher_, where a right-aligned status squeezes the description into three lines of ~28
  characters with 40 % of the row empty beneath it.
- **Cash's rules and schedules answer an empty list with a bare sentence** on a divider, where
  `app-empty-state` exists and cash already uses it five times — and neither says what a rule is or that
  `+` makes one. _Regeln anwenden_ is offered, full-width and solid, with zero rules to apply.
- **The handbook article is the one child page with no way back at the top.** Its header is `hideButtons`
  and names the program rather than the article, and the only parent link is `hb-pager__overview` BELOW
  the whole article — the longest scroll in the app, left by the OS gesture or not at all.
  `app-page-return` needs no inputs there; `PROGRAM_RETURN` already derives `/handbook`.
- **Trackplay's totals row is pinned to the bottom of the viewport**, so a three-round grid puts the
  summary a screenful of emptiness below its own table.

## Open review findings

Not blocking; kept here so they are not re-found.

- **Neither the vitals toolbar nor the household `ion-tab-bar` is worth touching**, both halves measured
  rather than argued. `list-page` guards the toolbar on `facade.hasToolbar?.() ?? true` and both vitals
  facades set it `false`, so there is no empty bar to remove. And the tab-bar has nothing to cap: Ionic
  gives it `justify-content: center` with `max-width: 168px` per button, so the three are already a centred
  504px cluster — padding the host moves them 0px (measured at a 1600px viewport, buttons at 548/716/884
  either way). Its band is full-bleed on the same grounds the header's is.
