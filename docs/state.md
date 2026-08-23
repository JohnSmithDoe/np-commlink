# State — blocked, one-way doors, and what is owed before v2

**Check before proposing work.** Each entry either needs a secret, an upstream release, a human reading
the result — or it has been triaged to ship before the next major. Settled questions are in
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
- **Three handbook pages carry stale screenshots, and they say so themselves.** `credstick-import`
  (the rules list lost its in-content add button and its section header; the swipe reveals a text
  delete now), `soykaf` (the recipe list gained a searchbar and a sort row) and `start` (the deck
  header gained the arrange toggle). All three page JSONs carry `"shotsStale": true`, which paints a
  warning above the article, so a reader is told rather than misled. Clearing it is a **release**
  step: re-run `playwright.handbook.config.ts`, then drop the flag. [CLAUDE.md](../CLAUDE.md) forbids
  an agent regenerating them, so the flag is set by hand and no gate can see it — **whoever changes a
  screen sets it on the pages that show that screen.**

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

## Owed before v2.0.0 — decided, not yet done

Triaged deliberately: each of these ships before the next major. What was triaged INTO v2.0.0 is in
[next-version.md](./next-version.md), and an entry leaves this section by being done rather than by
being re-argued.

- **Which lists opt into undo.** The mechanism is built — `ToastMessage` carries `action`, `durationMs`
  and `group`, and `@shared/data/undo/` holds a ten-deep stack the shared toast effect offers at 5 s. Only
  shopping, storage and products pass `undoableDelete`; tasks, recipes, categories, tracking and
  trackplay's four lists delete silently. **The stack has no persistent consumer** — only the toast pops
  it, so entries below the top are unreachable until a toolbar undo button exists, which also retires the
  `a11y-no-actionable-toast-button` suppression for both callers at once. Trackplay's own half is
  scheduled ([next-version.md](./next-version.md)).
- **A transaction is not deletable, which is how the re-import stays idempotent.** Keying off statement
  content means nothing can distinguish "deleted on purpose" from "not imported yet", so a delete plus a
  re-import brought the row back — and the alternative was a tombstone store keyed the same way the rows
  are. Removing the affordance removes the question: the correction path for a wrong row is the edit
  dialog, and a manual spend is edited the same way. The other half was already handled: a row carries
  its derived key as well as the bank's, so a `PDNG` entry arriving again under the `AcctSvcrRef` it
  gained when it booked confirms the stored pending row in place (`plan-import.ts`).
- **Write confirmations are arbitrary, not absent.** Tracking toasts its writes; tasks, the three household
  lists, recipes, cash, categories and trackplay create/edit are silent.
- **Three empty-state treatments, one of them useful.** The shared one explains and creates on tap;
  notifications, the burn-down, schedules and the uncategorized surface hand-roll inert copy; the
  tracking stats page, deck config and the office-time dashboard have none. `ListPageComponent` is
  what carries the useful one for trackplay, cash and the household lists — the argument for the rest.
- **The shared empty state names a searchbar that a searchless list does not have.**
  `item-list.empty.isempty.note` reads "…oder gib etwas in die Suchleiste ein", and vitals' readings
  and pills plus cash's rules all render `app-list-page` with `searchable` false. Splitting the note
  needs a second key and a `searchable` read inside `app-item-list-empty`, for copy nobody has
  complained about.
- **Seventeen shipping controls below the touch target, and two debug buttons that should not exist.**
  `size="small"` is 32 px in Ionic MD against WCAG 2.5.8's 44 px floor. Twenty sites carry it: one is an
  `ion-title` and not a target at all, two are the `@if (isDev)` debug-notification buttons in
  `notifications.page.html` — **those get deleted, not resized** — and the other seventeen ship, across
  ritual (3), notifications (2), tracking's daily-sessions (2), the two handbook retries, the vitals
  weekday picker, cash's spend-quick-add, the emoji-picker retry, `category-input`, `note-image-input`,
  the note editor and settings' accent reset. The emoji picker's grid is `minmax(2.75rem, 1fr)` with a
  banner saying why — the care is here, it is not uniform. Gateable once the dev exemption is gone: a
  rule can match `size="small"` on an `ion-button` outright.
- **`durable-storage.ts` still swallows a denied `persist()` grant.** Deliberate: eviction _risk_, not data
  loss, resolved inside `provideAppInitializer` — before translations load, and on every launch under
  Firefox and Safari. The only honest surface is a passive status row in settings. The _write_ half toasts.
- **One glyph per program, read by both the menu and the page header.** The six list pages each pass their
  own `icon="…"` to `app-page-header` while `DECK_CATALOG` carries the same string — two copies agreeing by
  review only. The fix is small: the icon is a static const, not slice state, and `app.component` already
  `addIcons(DECK_ICONS)` eagerly, so per-page registrations are redundant. **Not a shared selector** —
  `@shared` does not name another domain's store key. The shape is `RECENT_EMOJIS`': a read-only
  `InjectionToken<Signal<string | undefined>>` in `@shared/util`,
  empty-defaulted, fulfilled by `commlink/data` as the longest catalog route prefixing the URL, with
  `icon` surviving as the override for pages with no deck entry. **What defers it is the consequence:** the
  header's glyph becomes route-derived, so adding a route to the catalog later silently changes a header.
- **A persistent desktop side menu (`ion-split-pane`).** The catalog behind the drawer already serves both
  surfaces, so the navigation model needs nothing; what defers it is reach — every page header renders an
  `ion-menu-button` that would have to disappear above the breakpoint.


## Known cost, not yet paid

Measured, understood and left standing on purpose — a shape question, a wording question, or a bill that
only a phone with a few hundred rows actually presents. The ones that got a date are in
[next-version.md](./next-version.md).

- **The notes list decodes a full picture into a 48 px box.** `MAX_EDGE` is two screens, so every thumbnail
  costs a full-size decode; `loading="lazy"`/`decoding="async"` defer it but do not shrink it. A second
  canvas pass at import — the canvas is already there — would store a ~192 px `thumbUrl` beside the
  picture for a few KB. It is a persisted-shape change on the image document, which is free (`notes` is
  dev-only), and the list is also unwindowed, so the two belong in one pass.

## Open review findings

Not blocking; kept here so they are not re-found.

- **Neither the vitals toolbar nor the household `ion-tab-bar` is worth touching**, both halves measured
  rather than argued. `list-page` guards the toolbar on `facade.hasToolbar?.() ?? true` and both vitals
  facades set it `false`, so there is no empty bar to remove. And the tab-bar has nothing to cap: Ionic
  gives it `justify-content: center` with `max-width: 168px` per button, so the three are already a centred
  504px cluster — padding the host moves them 0px (measured at a 1600px viewport, buttons at 548/716/884
  either way). Its band is full-bleed on the same grounds the header's is.
