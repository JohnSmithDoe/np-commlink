# Backlog — found, not yet fixed

Findings live here until the code answers them, then the entry is **deleted**. Nothing here is a
decision; if a finding turns out to be the right answer, it moves to [decisions.md](./decisions.md) and
leaves. A finding that needs a secret, a device or a human moves to [state.md](./state.md); one triaged
into the next major moves to [next-version.md](./next-version.md). No entry belongs in two files.

Line numbers were true when the finding was written and the tree moves — locate by symbol, not by line.

_Reviewed 2026-09-06 across five passes: pattern conformance, duplication, trackplay correctness, the
deck/nav shell, and state/tests/docs. Gates were green at the time (`lint`, `sheriff`, `verify:testids`,
`:icons`, `:docs`, `:exports`, 2010 Vitest specs) — everything below is invisible to all of them, which
is the point._

---

## Bugs — a user reaches these

- **B2 · office-time can overwrite a real document with an empty one.** `office-time` is the only
  persisted slice that writes by hand (`office-time/data/office-time.effects.ts`) instead of
  through `createSaveSliceEffect`, and it skips all three guards that effect exists for: no
  `reads.mayPersist(key)` gate, `switchMap` instead of `concatMap`, `catchError(() => EMPTY)` instead of
  the write-failed toast. After a transient read failure every factory-backed slice correctly stops
  writing; this one saves `initialOfficeTime` + one day over the stored document, silently. It also
  spells the key `'officeTime'` as a literal rather than `OFFICE_TIME_STATE_KEY`. **Fix:** the hand-roll
  exists for a real reason (`serializedForStorage` flattens dayjs maps), so add an optional `serialize?`
  hook to `PersistedContext` and route it through the factory — not delete the hand-roll.

- **B3 · An imported board setting mints duplicate figures.** `board.setup.ts:30-31` derives figure
  identity positionally (`player = floor(placed.length / pieces)`), which holds only if placement ran in
  strict order. `parseSetting` assigns `piece` from a per-player counter, and `validateSetting` checks
  only per-player counts. Load `b4 p1-p1f0 p2-p2f0`, place three more figures, and the fourth is a
  duplicate `{player:1,piece:0}` — two identical `@for` track keys, and `same()` in `board.moves.ts:50`
  matches both, so one move teleports both figures. **Fix:** `nextFigure` picks the lowest `(player,
piece)` not already present; `validateSetting` rejects a duplicate pair.

- **B4 · A tie crowns an arbitrary winner, permanently.** `rankPlayersByScore`
  (`trackplay/data/games/games.selector.ts`) returns `0` for equal scores and `toSorted` is
  stable, so ties resolve to roster order. Nothing downstream tests for one: `[0]` becomes "the winner"
  with trophy and confetti, and `selectPlayerStats` credits every other participant with a **loss**.
  An ended game with no rounds scored crowns a winner too. **Fix:** compute the top score once; no
  winner block and no losses credited when more than one player holds it.

- **B5 · With `exactHome` off, only one figure can ever finish.** `board.moves.ts:87-88` clamps an
  overshoot with `Math.min(slot, pieces - 1)` — always the _deepest_ slot, never the deepest _free_ one
  — and the occupancy check then refuses every later overflow with `own-piece`, naming a square the user
  did not aim at. **Fix:** clamp to the deepest free slot at or below `slot`.

- **B6 · Stacking moves the wrong player's figure.** Two rules let figures share a field
  (`throwOnLanding: false`, `blockOwn: true`), but `figureOn` is `find` — first match wins — and
  `planMove` addresses the mover by field id. Once two figures share a square only the one earlier in
  the array is reachable; the other is stranded for the rest of the game, and the renderer draws both
  circles at identical coordinates with no count. **Fix:** either refuse the cross-player overlay, or
  give stacking a real model (`figureOn` returns a list, plus a which-piece pick). `board.moves.spec.ts`
  asserts the overlay as intended, so **decide which it is before fixing**.

- **B8 · An unknown game id renders a blank page with a live button.** `:id` is the catch-all under
  `/trackplay/games`, so a bad segment never reaches the app's `**` redirect. `game()` is `undefined`,
  the `@if` body renders nothing, and the header still paints an empty heading and an End-game button.
  Reachable by bookmark, or by browser-forward onto a deleted game's URL. **Fix:** an `@else` with
  `<app-empty-state>` (the dice page is the precedent) and hide the toolbar button when `!game()`.

- **B14 · The header glyph flips during a page transition.** `PROGRAM_ICON` is a `Signal` over
  `selectUrl`; its own sibling token spells out why that shape is wrong for a mounted page — _"Ionic
  keeps the leaving page mounted through a transition, so a page reading 'where am I now' answers for
  the page that replaced it."_ Both headers are mounted mid-push and both read the same signal. Fixed
  for free by **P1**.

## Patterns — forked, or one too many

- **P1 · Three shell tokens, two shapes — collapse to one.** This is the direct answer to _did we
  introduce too many new patterns_: the count is **three** tokens, not four (`route-url.ts` is a plain
  helper). `PROGRAM_RETURN` and `PROGRAM_SIBLINGS` are identical — `(url) => T`, `useValue`, a pure call
  into `program-route.ts`, asked with the caller's own `routeUrl(inject(ActivatedRoute))`. `PROGRAM_ICON`
  alone is a `Signal` over `selectUrl` with `useFactory` and a `Store` injection, and that difference is
  bug **B14**. **Fix:** one `PROGRAM_CONTEXT: (url) => { icon?, isProgram, parent?, siblings }`,
  `useValue` over `DECK_CATALOG`, one provider, one spec. A route-`data` contract instead was considered
  and **rejected**: it copies catalog facts into 13 route files and destroys the property the deck is
  built on — promoting a page to a program is one catalog edit with no page touched.

- **P2 · The extraction left its own precedent standing.** The commit that introduced
  `@shared/feature/module-tabs-page` named household's hand-rolled `ion-tabs` shell as one of the
  answers it replaces, and household still runs it.
  `programSiblingsFor(DECK_CATALOG, '/household')` already returns exactly the same three tabs. Three
  things make it small work rather than a delete: the bars disagree on order (catalog says
  shopping/storage/products, household paints products/shopping/storage), the labels are
  `household.list-switcher.*` rather than `page-title.household-*`, and the household e2e reads
  `data-testid="list-switcher-*"`. **Fix:** adopt the shared shell and retire the keys — or record in
  [domains.md](./domains.md) why household keeps its own.

- **P3 · `ModuleTabsPage`'s selector is the only page selector that is not `app-page-*`.** 52 of 53
  `*.page.ts` follow the convention, and [footguns.md](./footguns.md) makes that selector load-bearing
  for e2e scoping. Rename to `app-page-module-tabs` now, while one spec consumes it.

- **P4 · The tab bar and the route table are two writers of one contract.** A catalog entry one
  segment below a shell with no matching child route paints a tab that navigates nowhere; a child route
  with no entry gets no tab. Nothing cross-checks them. `<ion-tab-bar>` also renders unconditionally, so
  a module adopted before its entries move paints an empty 56px stripe on every page — the token's
  factory default is `[]`. And `redirectTo: 'games'` restates _the first catalog sibling_ as a literal.
  **Fix:** `@if (tabs.length > 1)` around the bar; derive the redirect; consider a script asserting every
  sibling segment resolves to a child route of the shell at that prefix.

- **P5 · The board ships a 12-colour palette as hex literals in a component stylesheet.**
  `trackplay/ui/board/board.component.scss` is the **only** file under `src/app` matching
  `#rrggbb`; every other colour literal lives in the theme layer. Declared on `:host`, neither
  `[data-skin]` nor `[data-mode]` can reach them — the board paints identically in every skin and both
  modes, worst case `#ebbc00` on the light paper ground. The repo also already owns a categorical
  palette (`@shared/util/charts/chart-colors.ts`). **Fix:** `--sr-seat-0…11` in the theme layer, with the
  dark/plain overrides every other token gets. (Its banner also states a count `BOARD_PLAYER_COUNTS`
  owns — drop that line.)

- **P6 · The board has no keyboard or AT path — R5.** The `<svg>` carries `role="img"`, which makes
  every child a non-exposed graphic, and each field is a bare `<circle (click)>` with no `tabindex`, no
  role, no name, no key handler. Placement has a partial escape hatch ("Place next in its yard");
  **moving has none**, so play is unreachable without a pointer. R5 can never be gated, and the
  `a11y-*` rules only inspect `ion-*` elements. **Fix:** drop `role="img"` on the interactive case, make
  each pickable field `role="button" tabindex="0"` with `(keydown.enter)`/`(keydown.space)` and a label
  from `notationOf`. Whether the notation textarea counts as an alternative for _placement_ is Martin's
  call; it is not one for moving.

- **P7 · Eight live regions on the board page are created together with their message.**
  `board.page.html` mounts each `role="status"` inside its own `@if`/`@switch`, so a region arrives with
  its text already present — commonly not announced. The repo fixed exactly this one commit earlier in
  the same domain: `dice-tray.component.html:14-23` keeps the box permanently mounted and toggles only
  its content. Eight messages is the board's whole feedback channel. **Fix:** one always-mounted `<p
role="status">` per group (setup / move / clipboard) with the `@switch` inside it.

- **P8 · `muted-text-uses-token` cannot see `opacity` on text, and the newest muted site uses it.**
  The rule matches `color:` declarations whose value is `rgba(var(--sr-*-rgb), α)`.
  `deck-config.page.scss:26-29` halves a whole label's contrast with `opacity: 0.5` and the rule is
  blind to it. Its own banner argues _"the ratio is what fails, and a ratio is not visible in a diff"_ —
  which is equally true of opacity. This is repo-wide (geist, deck, notifications), so the fix is a
  sweep plus a widened rule, not a one-liner.

- **P9 · `game-play.page.ts` keeps in the page what geist extracted and tested.** Three
  `viewChild(ElementRef)`s, a hand-written horizontal scroll mirror, a mutable `#prevRoundCount` latch
  inside an `effect`, a `requestAnimationFrame` scroll, and a shadow-root blur — all inline, none
  specced. `viewChild(…ElementRef)` appears in exactly two files in the repo; the other one
  (`geist.page.ts`) put the _decision_ in `geist/util/transcript.utils.ts` with a 100-line spec and left
  the page holding one assignment. **Fix:** mirror that.

- **P10 · One collection, two views is built three ways.** vitals derives via the shared
  route-scoped factory; cash derives and pins `sort` inside the projection; **trackplay stands up a
  whole second persisted slice** (`GamesView` — actions, reducer, facade, page facade, its own selector
  chain, and an entry in `save.sources`). Nobody decided that a search term typed on one player's page
  survives a reload while the same term on a cash account does not — it fell out of picking a different
  mechanism. **Fix:** settle it. Deleting the slice is ~90 lines and costs no ladder rung (dev-only),
  but `showEndedGames` genuinely wants per-view state, so if it is kept the reason belongs in
  [domains.md](./domains.md).

- **P11 · `save.sources` is a hand-maintained enumeration, and the newest domain has the longest
  one.** `trackplay.providers.ts:22-32` lists seven aggregates by hand. The factory's own banner argues
  at length that _subtracting_ view-only events beats enumerating mutations because "a mutation
  forgotten out of an `on:` list stops persisting silently" — the same argument applies one level up. An
  eighth aggregate not added here reduces, renders, survives navigation, and is gone on next launch.
  Only household derives its list. **Fix:** match on the domain prefix (`'[Trackplay'`) and keep the
  existing `persistsNothing` subtraction. Turns an enumeration into a rule.

- **P12 · `games.selector.ts:87-114` ships four selector factories** against its own domain's banner,
  which argues that reading `:id` through `selectRouteEntityId` is what makes these memoized selectors
  rather than factories a component re-creates per read. `players.selector.ts` follows the banner; games
  does not. Not a live bug — the page calls each once at field initialisation — but `IonicRouteStrategy`
  keeps visited routes mounted, so each visited game leaves a live chain, and it is one template binding
  from being recreated per change-detection pass.

- **P13 · Two undo registration paths.** Seven lists opt in through `undoableDelete:` config;
  `recipes.effects.ts:5-11` calls `pushUndoOnDelete` directly because it does not build its list effects
  through the factory. Harmless today — **but** [next-version.md](./next-version.md) schedules a plugin
  rule over undo scopes, and a rule written against the config key would not see recipes. **When that
  gate is written, match on `pushUndoOnDelete`'s first argument, not on the config shape.**

## Duplication — the same shape, written again

- **D1 · 17 hand-written ItemList CRUD reducer blocks, and hydration has already forked.** Every
  list reducer spells out `addItem`/`removeItem`/`updateItem`/`updateSearch`/`updateFilter`/`updateSort`
  plus its `loaded` handler — ~95 handler lines and ~120 lines of repeated imports. The _action_ half of
  exactly this set is already a factory (`item-list.actions.factory.ts`), used by all 17. The reducer is
  the only half nobody generated, and the copies have diverged on the one line that touches persisted
  data: seven spell hydration `{ ...initialXState, ...(loaded ?? state) }`, nine spell it `loaded ??
state`. The second form takes the stored document wholesale, so a field seeded into initial state
  never reaches anyone holding an older document. **Fix:** `itemListReducerOns(actions, initial)` in
  `@shared/data/item-lists/` (must be `data/` — `on()` is `@ngrx/store`), and pick the initial-spread
  spelling. Do this **before** the "a list declares its own sort fallback" item in
  [next-version.md](./next-version.md) — it turns that from 17 edits into one.

- **D2 · Seven facades hand-roll the three forwarders `itemListCommands` already builds** (vitals ×3,
  trackplay ×4), while nine use the helper. Already diverged: `game-types.facade.ts:70` declares
  `setSortMode(sortBy)` with **no `direction` parameter**, hardcoding `'toggle'`. Structural typing
  accepts the narrower signature silently; it is harmless only because every current caller passes
  `'toggle'`. The first caller wanting a pinned direction gets it ignored, with no error.

- **D3 · `showEditDialog` written out 16 times, the create-seed 13 times.** The seeding rule — _a new
  item takes its name from the search box and is filed under the armed filter_ — is stated twice per
  list: once as `create:` config in the domain's list effects, once in the facade. Two writers, one
  fact, and it has already produced two spellings of the same null-guard (`state().searchQuery` vs
  `state()?.searchQuery`) against one `Signal<ItemList | undefined>` contract. **Fix:** `showEditDialog`
  onto `BaseListPageFacade`; an abstract `create` both the facade and the effects config read.

- **D4 · ~18 pages carry three-line forwarders, under six names for one operation.**
  `removeItem`/`remove`/`deleteItem`/`deletePlayer`/`deleteType`/`deleteProfile`… and
  `showEditDialog`/`openEdit`/`edit`/`openEditRule`/`openPillEdit`… Two of them forward to a method
  _already on the bound page facade_ — pure indirection — and ~10 pages inject a second facade solely to
  hold them. Two pages already prove the template can call the facade directly. The real cost is that a
  reader cannot tell from a page whether a delete is undoable or confirmed without opening the facade.

- **D5 · The route-scoped list-selector chain is hand-rolled three times while the `@shared` factory
  that does it serves one domain.** `route-scoped-list.selector.ts` is used by vitals only; cash
  rebuilds it twice in one file and trackplay once, and the _unscoped_ triple is written out in 13 more
  places. The load-bearing part is the ordering — scope before search — and cash's banner and the
  factory's banner each argue it separately while trackplay's states neither. **Fix:** generalise the
  factory to take the scope selector plus an optional `project(list)` hook (cash pins `sort` inside its
  scope, which the factory has no concept of), and add a plain `createListSelectors` for the 13. This is
  the honest resolution of "something in `@shared` only one domain uses" — the shared thing is right,
  the others should join it.

- **D6 · Five facades hand-wire push-undo-then-remove**, while two declarative forms already exist —
  the effects factory's `undoableDelete` and `BaseCategoryListPageFacade`'s `restoreActionFor?` hook.
  Three ways to say one thing, and the wiring is where the mistake lands: `game-types.facade.ts:75`
  guards `id === DEFAULT_GAME_TYPE_ID` and `trackplay.reducer.ts:55` re-checks the identical veto.

- **D7 · Modal chrome is written raw in seven components** (cancel / title / confirm toolbar), three
  of them line-for-line identical. This is where R4 lives and the copies disagree: four set
  `[attr.aria-label]` on their own `ion-modal`; the three cash ones have no modal host and depend on the
  _caller_ passing `htmlAttributes`, with nothing linking the visible title to that label.
  [footguns.md](./footguns.md) records that they must be kept in sync by hand — seven copies is seven
  places to forget. **Fix:** a `modal-chrome` component under `@shared/ui/` taking every label as an **input** (so
  `i18n-key-ownership` holds) and deriving the aria-label from the title, closing the sync gap
  structurally. Scope honestly: the cash trio is the byte-identical part.

- **D8 · `@shared/feature/modal-dialog/base-modal-dialog.ts` has one consumer, in one domain.** 57
  lines plus a spec serving `cash/feature/transfer-modal` alone — cash's two other modals do not use it.
  It sits one directory from `BaseEditItemDialog` (12 consumers, 6 domains) with a near-identical member
  set, so a reader in `@shared/feature/` must work out which of two dialog bases applies, and the answer
  is "the second one, only if you are the transfer modal". **Fix:** move it to `cash/feature/`, beside
  its consumer — the shape household already uses. It earns a return when a second domain needs one.

- **D9 · The category-catalog port is implemented twice as pure forwarders** (household, tasks), and
  cash solved the same problem a third way with its own picker while trackplay treats `GameType` as a
  category joining none of it. Four answers, two of them identical boilerplate. **Fix when a third
  domain wants a category picker in an edit dialog**, not before: one injected `CATEGORY_CATALOG` token
  replaces the three abstract methods and deletes `base-household-edit-item-dialog.ts`.

## Tests — the risk-weighted holes

Coverage is not the metric and _lean tests_ is being honoured, not abused. These are the seams where a
wrong answer is silent.

- **T2 · `programSiblingsFor` has no spec** — the newest routing rule, and the whole "a tab is a
  program exactly one segment below the shell" decision. Its two older siblings in the same file have
  nine cases between them. Pin: `/trackplay` → games/dice/board; `/vitals` → iching/browse but **not**
  `/vitals/iching/cast`; an unknown prefix → `[]`.

- **T3 · `spec-resets-mock-selectors` has no RuleTester spec**, so a working rule and a dead one
  produce identical output — there are zero current violations. [footguns.md](./footguns.md) states the
  repo's own rule: _a lint rule with no spec fails open_. It is also blind to
  `provideMockStore({selectors})` and to an override moved into a `@shared/testing/` helper, a premise
  its header asserts and nothing enforces.

- **T4 · `@shared/util/forms/form-rules.ts` has no spec.** `requireUniqueName` encodes the
  edit-exemption (`twin.id !== editingId`) — drop that clause and every edit dialog refuses to save its
  own unmodified item, a total feature break no current test catches. `requireParseableDate` is the only
  defence against a persisted `'Invalid Date'`, which footguns records "sorts above every real date and
  can never be reconciled". Both take thunks; both are callable in a plain spec.

- **T5 · `board.page.ts` has no spec** — trackplay's largest feature file and the only page in the
  module without one, where three engines are wired to eight on-screen messages. The specific untested
  claim is the refusal→message mapping: `planMove` returns four refusals and `refuseNext` two, and a
  renamed union member renders nothing rather than failing — `no-figure` was exactly that hole.

- **T6 · Small, cheap pins:** `selectPlayerStats` with equal scores (see
  **B4**), `game-play.page.ts`'s `onValue` coercion (`"abc"→0`, `"3.7"→3`, `""→0`), and the
  `parseSetting → nextFigure` composition — both halves are well specced and **B3** lives only in their
  interaction.

## Docs — drift found

- **X1 · The board is absent from [domains.md](./domains.md).** The TRACKPLAY section is still
  headed "the dice pool" and every entry is about dice, while three commits of genuinely settled
  reasoning sit in two file banners _at the 13-line ceiling_ — a piece walks its own lap so
  `travelled + pips` decides everything and turning into home needs no separate rule; every rule the
  walk consults is data, so MÄDN, Pachisi and a house rule are one engine; the notation format; the
  `combineReducers`-identity trick that forces the cascade handlers into one file. That is content with
  no home. **Fix:** retitle the section and add the entries, then the banners shrink to a pointer.

- **X2 · [state.md](./state.md) says "both bundles" — French shipped.** `public/i18n/` holds three,
  [next-version.md](./next-version.md) already says the UI speaks three languages, and `fr.json` has
  never been proofread either. The entry understates its own debt by a third. Drop the ~76 figure while
  fixing it — it is a count the code owns and the entry already says to recount it.

- **X3 · The products-cascade defect is recorded in two files** — as a settled aside in
  `decisions.md` and as scheduled work in `next-version.md`. It is not settled, so `next-version.md` is
  its only correct home. Delete the sentence from `decisions.md`; the decision it trails ("a cascade
  must build its entry in the COMMAND") stands without the counter-example.

- **X4 · The undo opt-in rosters in `decisions.md` are an inventory mirroring the tree** — eight
  lists named, then six more. Both are accurate today, which is exactly what makes the drift silent
  tomorrow, and CLAUDE.md forbids the shape. Keep the two _rules_, drop the rosters: `grep
undoableDelete` and `grep UndoActions.pushed` is where the fact cannot drift from itself.

- **X5 · The tab-bar decision misses its most expensive case.** It prices `/soykaf`, `/data` and
  `/commlink/deck` as "a move plus a redirect", but `segmentBelow` returns `undefined` when
  `route === prefix` — so **a program mounted at its own module root can never be a tab in its own
  module's bar**, and two are: `/cash` and `/vitals`. Adopting the shell there means moving a published
  program URL down a segment, which for `vitals` touches a slice real users hold and therefore owes the
  usual ask. This constraint is what drove the trackplay restructure and is nowhere in the docs.

- **X6 · Two entries are written as the story, not the state.** The household-clipping entry in
  `state.md` narrates a cause "since found and fixed" (it is in the tree); the reducer-purity entry in
  `decisions.md` opens in the present tense about four handlers reading `crypto.randomUUID()` during
  reduce, and the code shows the fix landed. Both make a reader verify against the code to learn what is
  true. Keep the re-check instruction and the transferable lesson; drop the narrative and the count.

---

## What the next reviewer should look for

These are the shapes that produced the list above. Each one is invisible to every gate in the repo.

1. **A moved route leaves absolute string literals behind.** `games-page.facade.ts` was the signature failure: a program's
   URL moved, four literals were updated, the fifth was in a facade no compiler, lint rule or spec
   reads. After any `route:` change in `deck.catalog.ts` or a `path:` change in a routes file, grep the
   old literal across `src` **and** `e2e` — and check that the page still has an in-app entrance at all,
   not just a working URL.
2. **An extraction that leaves its own precedent standing.** `P2`: the shared tab shell was built to
   replace three improvised ones and replaced two. When a commit message says "every module invented its
   own answer", check that every instance actually converted.
3. **The newest domain re-answering a solved question.** `D1`, `D2`, `D5`, `P10` are all one shape: a
   new domain copied the block next door instead of the `@shared` factory. Ask of any new `data/`
   directory: which of these six lines does `@shared` already generate?
4. **A gate that is green for a structural reason.** `P8` (blind to `opacity`), `T3` (a rule with no
   RuleTester spec is indistinguishable from a dead one). When a rule reports zero violations, ask what
   would happen if it had stopped matching.
5. **A hand-maintained enumeration.** `P11` (`save.sources`), `X4` (the undo rosters). Forgetting an
   entry never fails — it reduces, renders, and is gone on next launch. Prefer a prefix rule to a list.
6. **Persisted hydration that does not spread initial state.** `D1`. `loaded ?? state` looks
   equivalent to `{...initial, ...loaded}` and is not: it is where an additive field stops being free.
7. **A live region created together with its message.** `P7`. `@if`-wrapped `role="status"` is the
   default mistake; the dice tray is the correct precedent in the same domain.
8. **An interactive surface that is not an Ionic element.** `P6`. The eight `a11y-*` rules only inspect
   `ion-*`, so an SVG, a canvas or a bare `<div (click)>` is unseen by all of them — and R5 can never be
   gated.
9. **Colour literals outside the theme layer.** `P5`. `grep --include='*.scss' '#[0-9a-fA-F]\{6\}'
src/app/` should return nothing.
10. **A refusal union whose template `@switch` is missing a `@case`.** An unmatched `@switch` is
    empty, not an error — every branch of a refusal type needs a visible answer or the feature is silent.
11. **Two writers of one artifact.** `P4` (tab bar vs route table), `D3` (the seed rule in both the
    effects config and the facade), and two action groups minting one `source`. Footguns says it: _one
    artifact, two writers is always a bug in the making._
12. **A tie, an empty set, a single member.** `B4`, `B8`, `P4`. Ranking code that never tests for equal
    scores, an `:id` catch-all with no unknown-id branch, a tab bar that renders with zero tabs.

### Verified clean — do not re-derive

Facade discipline is uniform and unchallenged: 44 action groups, zero hand-rolled `createAction`, zero
`@ngrx/*` outside `data/`, zero cross-domain imports outside the shell. No `I`/`T` type prefixes. No
`expect(component).toBeTruthy()` filler anywhere. `deck.catalog.ts` is a data table with no logic crept
in, and **no deck entry id has been renamed** by any recent commit. URL composition cannot break under
`--base-href` — the app is hash-routed, so base-href touches assets only. None of the three shell tokens
can throw `NullInjectorError`; all ship in the root injector with factory defaults. `board.factory.ts`'s
ring arithmetic, `planMove`'s lap walk and home-column blocking, the notation round-trip,
`trackplay.cascade.ts` and `trackplay.scoring.ts` were all hand-traced and are correct. Every one of the
13 edit dialogs uses `item-edit-modal`. `board.moves.ts` **is** covered (`board.moves.spec.ts`, 11
cases including a Pachisi ruleset) — a stale index claimed otherwise.

Route boilerplate across the 13 `*.routes.ts` was considered for extraction and **rejected**: the shape
is not uniform (providers, `data`, nested children, spread contexts), a helper would grow an options bag,
and these files are the one place a reader sees a module's whole URL surface — which `X5` makes
load-bearing. Also rejected: an `app-icon-button` for the 54 icon-only buttons (blocked — a third carry
`data-testid`s the e2e reads by literal, and `verify:testids` cannot see a pass-through input), cash's
four `confirmDelete` wrappers (already scheduled for deletion by undo), the three swipe-action constants
(the wording is domain-owned by design), and the per-domain `*.providers.ts` and feature-selector
projections (config and typing, not duplication).
