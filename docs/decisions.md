# Decisions

Settled — do not re-flag as work. Blocked and before-the-next-major work is in [state.md](./state.md);
the next major's scope is in [next-version.md](./next-version.md).
No entry cites a commit SHA: a history rewrite invalidates every one. A claim carries its own evidence.
**Append while a decision stands; collapse it into its successor once one supersedes it** — a superseded
entry left standing grows this file and eventually contradicts the code.

## Per-domain decisions

A module's own reasoning lives beside the module, so this file stays about what crosses them.

- [CREDSTICK](domains/credstick.md) — the camt import, the key space, the ledger, rules and schedules
- [BIOMON](domains/biomon.md) — weight, profiles, pills and the notification slots
- [DAILY RUN](domains/ritual.md) — prompts, completions and why there is no streak
- [SIGIL](domains/notes.md) — one note type, the editor with no save button, images
- [The deck](domains/deck.md) — what ships on, and what stays reachable

## Declined extractions — read as duplication, are not

Do not re-propose these; each was measured.

- **`deck.hud-label` at its 9 re-typing sites** — it also emits `font-family`, inherited at all nine.
  Behaviour-identical, 192 bytes.
- **household `save`/`showEditDialog`/`remove` triples** — deriving the list from the route softens the
  item type to a union, the one thing stopping a storage item dispatching at the shopping list.
- **`CashCategoriesPageFacade extends BaseCategoryListPageFacade`** — its catalog cascades; 4 of 9 bodies
  would be overridden. A base with hooks for one caller.
- **A base for `TrackingListPageFacade` + `TasksListPageFacade`** — 7 one-line dispatches in common,
  against different item types, seeds and categories.
- **A `field-note` read idiom** — presentation is shared; the error read stays local. The asymmetry is
  deliberate: an empty money box disables save silently (initial state), an empty **name** says so (the
  box was seeded, so blank means cleared).
- **Scoping the list dialogs' field tree to the bound `name`** — the tree **is** the write-back channel
  and `canSave` comes from the schema. Revisit only with a measurement.
- **`addCategory`/`showEditDialog` onto `LIST_FACADE`** — forces `tracking` to implement operations it
  has no concept of.
- **A 24-line banner ceiling.** Three files pay a FACT rather than a word there. 32 is the gate
  (`commlink/comments-header-only` carries the reasoning); **6–14 lines is the guideline for a new one**.
## Keep, despite looking unused

- **`@capacitor/app` and `keyboard`** — native plugins; removing `app` changes Android's back button,
  and no gate sees it. "No import" is not "unused" for a Capacitor plugin. `haptics` was the third and is
  no longer here on that argument: it is scheduled ([next-version.md](./next-version.md)).
- **`sonar-project.properties`, `qodana.yaml`** — Sonar runs on demand, natively (the CLI image is
  amd64-only; a container mount breaks coverage import). Not for CI without deciding gate semantics: it
  asserts on *new* code only, so a first analysis passes vacuously.
- **The four `WordclockSettings` flags** — intended variants (German regional dial readings, corner-dot
  minutes), deleted once by a `/simplify` sweep and reverted. Spec-only usage is a *reachability*
  argument; the spec cases are the **specification**. Only the owner can tell unreachable from unwritten.
- **`packaging`, `packagingWeight`, `unit`** — unread SOYKAF v2 seed; deleting is free now and undone at v2.

## Identity and keys

- **A category name is a label, never an identity.** Three owners hold `{id,name}` and reference by
  `CategoryId`. The name decides *duplicates* only: adding an existing one is a no-op, renaming **onto**
  one merges.
- **Row remap is shared, rule remap is not.** A cash **rule** keeps a singular `categoryId` because it
  ASSIGNS a category rather than being tagged with one.
- **When a reducer rewrites rows a dialog is editing, the dialog is a row too** — the open draft put a
  retired id back on save, so the category picker follows the survivor.
- **A GUID per row, a natural key per singleton** — natural only where the key **is** the thing: list ids
  (route param, effects guard and persisted discriminator at once), deck ids, office-time's day maps.
- **`officedays`/`freedays` are `Record<DayKey, true>`; `holidays` is keyed by holiday NAME** with `Dayjs`
  values. What stops them being confused is the **value** type — two `Record<string, Dayjs>` would have
  compiled. The shape also carries the one-row-per-day invariant a hand-written guard never covered on
  the whole-array writes the picker actually uses.
- **`DayKey` is a template-literal type, and does not reopen branded ids.** Branded ids were rejected for
  their cost — an `as` at every mint point *including every IndexedDB read*, in an app with zero `any`.
  One mint, and the disk read re-mints rather than casting, so junk on disk is normalized not trusted.
- **Comparing by name is legitimate in exactly one shape** — the recipe matcher's fallback for a storage
  row with no `productId`. Resolution of last resort, never identity.
## Architecture, rejected and re-rejected

- **A control the user can operate must change something the user can observe, and a page the user can
  reach must be reachable without a URL bar.** The flags page is why: `list-settings` left `DECK_CATALOG`
  entirely, because a drawer row was a second, weaker answer to a question its own toolbar answers
  better — and one a hidden program could switch off, leaving a page reachable only by URL.
- **No root-state type** — selectors and facades are `type:data` and cannot reach the shell, and the
  context bundle erases key and state type before the kernel sees it. Self-enforcement needs a phantom
  type through three functions for a five-entry list.
- **"Every context lazy"** — routing the inbox forced a durable-write port. Uniform lifecycle was the
  wrong goal; the right one matches where a slice is written and read. No *supplier* slice is eager.
- **A theme-composed i18n keyspace** — made all 60 keys invisible to `--clean`, and a missing theme
  surfaced only at runtime. Declared `Record<Theme, …>` fields make it a compile error.
- **A CI i18n freshness gate** — the extract flags removed the need. *One artifact, two writers.*
- **`@ngrx/component-store` / `signalStore` for dialog state** — `signal` + `computed` was the whole
  requirement; no dialog state lives in NgRx.
- **`knip` / `import/no-unused-modules`** — a dependency and a per-push cost for what the IDE reports
  live; `verify:exports` covers the rest.
- **`office-time → tracking`** — the realized office-time is standalone and only reports telemetry.
- **A release const gated against `package.json`**, and **closing `metric?: string` into a union** —
  esbuild `define` has nothing to drift, and `metricKey` was preferred at three repeated markers.
## Layout and theme

- **The multi-column list above 1024px, reverted.** **Rows differ in height** (a running session is
  three lines, a stopped one is one), so `align-items: start` left ragged gaps and the tall row appeared
  to escape the grid. Row heights are content, not layout: no column count fixes it, and masonry or
  fixed-height rows are not worth what they cost a touch list.
- **The header chrome anchors to `$content-wide`, never to the page's own cap.** Reading the page's cap
  put the menu button somewhere different on every route — 190px in on settings, 0 on a list, half the
  screen in on ritual's 30rem — and app furniture that moves per route is worse than furniture at the
  edge. One fixed column for the chrome; a page keeps its own measure below it.
- **`space-between` in a row detail needs a measure, or it is only a phone layout.** A list row caps at
  `$content-wide`, so the label kept the left edge and its value the right one, ~800px apart, and the
  pair stopped reading as a pair. The leftover width is slack to the right of the pair, not between its
  halves. **Not** a row-height or font-size change — shrinking a touch row to fix a desktop gap pays on
  the platform that was already right.
- **One ladder, three axes: φⁿ anchored at `1rem`.** Bare, the rungs are proportion; ×`1rem` the spacing
  rhythm; ×`--fs-body` the display end of the type scale. The anchor is the argument — `1rem` is Ionic's
  `--ion-padding`, the one spacing number it ships, and Ionic has no type or spacing scale at all.
- **A fully golden system was declined** — φ cannot tile, so it never divides a container into countable
  parts summing to a whole, and the ladder therefore cannot hold both `0.5rem` and `1rem`. **The type
  scale is golden above body and hand-set below**: the small end answers legibility floors, AA contrast
  and 44px targets, and a ratio must yield to a hard minimum. Van de Graaf was declined as a literal
  canon (a *spread* canon, book-generous against Ionic's 16px) and Open Props as a dependency for a
  seven-line ladder. **The ladder is not defended on aesthetics research and must not be** — the
  golden-preference evidence is weak. Seven rungs beat twenty-one ad-hoc values whatever ratio makes them.
- **Toasts get `--ion-color-accent`, not a recoloured `success`.** `success` also encodes a value's SIGN
  in the charts and in cash's amounts, where green-against-red is the meaning. `accent` aliases `success`
  on plain and `primary` under cyberpunk, so a toast follows the user's swatch and no new hex entered the
  stylesheet. Explicit `color: 'danger'` is untouched: a refusal should not look like the deck.
- **A hand-picked accent is DROPPED when the brightness changes, and both skins' picks go with it.** An
  override is one inline style on `<html>`, so it outranks the compound block that exists precisely
  because neither hue survives the other ground — amber falls to 2.3:1 on paper, blue to 2.6:1 on ink.
  Nesting the stored map by mode was declined: a shape change on a slice every install holds, to preserve
  a colour that is two taps to pick again.
## Router and navigation

- **The router is a write API; the store is the read API.** Reads come from `@ngrx/router-store`, which is
  read-only by design — NgRx shipped `go`/`back`/`forward` in v3 and **deleted them in v4**. Reading the
  router is a selector; navigating is an effect.
- **The route sets the filter; it never clears it.** An absent `?filter=` is not an instruction, and
  household persists `filterBy`. Clearing is its own action, reacted to twice: each domain resets its own
  `filterBy`, one shared effect strips the query string.
- **`NavController` is `Router` plus a direction** — all it adds is `setDirection(...)`. Injecting
  `Router` is correct everywhere; the ~20 places that do are not a backlog.
- **Direction is a guess, and a sibling swap guesses wrong** (`back` inferred from `ev.id < lastNavId`),
  so it animates as a push. Switching household lists therefore navigates with `animated: false,
  replaceUrl: true`, so three lists are not three back-stack entries.
- **Navigating is an effect when the *store* decided it, and not otherwise.** State → URL needs one,
  possibly with no component alive. A gesture that changes no state is not a store concern; routing it
  through an action and an effect adds a type, an effect and a spec to call the same `Router` method.
- **A controller never appears in a reducer** — a reducer runs synchronously and possibly twice per
  dispatch, so a `ModalController` there presents per call and re-fires on replay.
- **The household lists are an `ion-tabs` outlet under a PATHLESS parent route, and the pathlessness is
  load-bearing.** `IonTabs` takes its prefix from its own route's URL, so an empty path contributes no
  segment and `/household/shopping` survives verbatim — which is what `deck.catalog.ts`'s three routes and
  `ROUTE_BY_LIST_ID` point at, none of them checked by a compiler. **Tidying that parent into
  `path: 'tabs'` breaks all six silently.** `list-settings` and `categories/:listId` stay siblings, not
  children: a sub-page hides the bar, and Ionic would read either as a fourth tab stack.
## Reducer purity

- **Impurity arrives through a call into a util, not an import of a framework.** A grep for framework
  imports "proved" purity and could not see the real violation: four `trackplay` handlers read
  `crypto.randomUUID()` and `Date.now()` during the reduce step, so a replayed action produced different
  state and the persisted log stopped describing the store it built.
- **The fix is a defaulted parameter on the action *creator*** — clock and id read at dispatch time. A
  default on the *factory* lets the impurity back in silently, which is how all four sites arose. Better
  still, the factory leaves the reducer: what remains takes its `id` as a **required** argument.
- **Nothing gates this.** A file-scoped import ban was rejected — it keys on a filename (a decaying gate,
  [footguns.md](./footguns.md)) and would not have caught the real violation anyway.
## Persistence and the migration ladder

- **A rung is owed only to data somebody else is holding.** A cash ladder was written and reverted the
  same day: its rungs migrated *from* shapes no install has ever held. Which slices have holders is a
  fact about people rather than about code, so it is **asked, never inferred**, and the roster lives in
  [CLAUDE.md](../CLAUDE.md) where a changing fact belongs.
- **`APP_VERSION` is global on purpose** — a slice with no entry for a hop is walked past and re-stamped,
  so the number is a *floor* on the whole document set and two slices cannot disagree about which hop
  they are on. It is **1**, and `runMigrations` has never run a step.
- **When the first real rung is written:** one per stored-shape change, never one per release (the ladder
  is only as trustworthy as its smallest step); written against `unknown` and casting once, because the
  types it migrates FROM no longer exist and a typed signature keeps a dead copy alive forever; pinned by
  a spec against a literal of the old shape. A rung is a one-way door on someone's data — no down-ladder,
  no backup — so `runMigrations` throwing is the only safe failure: it loads empty, never half-migrated.
- **A reset is a legitimate answer to a moved shape, and v1.1.0 gave it twice.** A rung is owed to data
  whose **meaning** survives the change; a reset is honest when it does not. The deck's pre-flip document
  named the ids to _hide_, which the new reading would show — migrating it would have inverted every
  holder's choice, so a rung was not the cheaper option but the wrong one.
- **Every exemption taken, in one place.** None is a precedent, because cost is a fact about the roster.
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
- **The 09:00 office nudge is cancelled once at boot, from the notifications slice.** The policy moved
  into `office-time`, but that slice hydrates on route: a deck with OFFICE switched off never reaches the
  effect that would clear the cron the old app-initializer left with the OS. It runs ONCE — cancelling on
  every boot would disarm anyone who has since switched the reminder on. Not a rung: what is stale is a
  schedule the OS owns, not a shape on disk.

## Destructive actions

- **A swipe deletes and does not ask.** Every destructive `ion-item-option` is `expandable`. A list whose
  job is a pantry or a task pile must be as cheap to remove from as to add to; a confirm on every row
  taxes the common case to insure the rare one.
- **Undo over confirm, and a confirm is not to come back as a substitute for one.** Undo is opt-in per
  list. Cascades and bulk wipes are a different class and are not settled by this — destroying what the
  user was not looking at is scheduled ([next-version.md](./next-version.md)).
- **Cash still confirms** — the ledger is imported bank history, and re-adding a row by hand is not the
  cheap gesture this policy buys elsewhere.
## Accessibility

- **The eight `commlink/a11y-*` rules stay, and what was wrong was measurement, not size.** R6 was inert
  on the app's only actionable toast and R4's controller half was blind to the global error handler's
  alert, both because the receiver regex demanded a suffix the code had stopped writing. Fixed by one
  character class plus 42 RuleTester cases, verified by reverting the regex and watching exactly those
  cases go red.
- **axe-core evaluated, not adopted** — it would cover R1/R2/R3 and add contrast classes no rule here
  touches, but it samples what a run happens to render where ESLint reads every template. Different axes,
  not substitutes — and it structurally cannot see the imperative overlay path, which is why neither rule
  considered for deletion was deleted.
- **The one suppression records a real gap.** `a11y-no-actionable-toast-button` is disabled at the toast
  effect, naming the *mechanism*: any caller setting `ToastMessage.action` owes a persistent path to the
  same action. Two callers have none.
- **Toasts already announce** — `ion-toast` renders `role="status"` + `aria-live="polite"`. An audit missed
  it by grepping `src/**/*.html`; a web component's shadow DOM is not in our templates. Raising errors to
  `assertive` would mean replacing `ion-toast` — declined.
## Coverage gaps that are decisions

- **Two gestures are deliberately not e2e-covered** — the `app-date-input` calendar and the cash-rules
  reorder. The Playwright drag would be more fragile than what it proves; both have unit specs.
- **The remaining Ionic-element locators in `e2e/` are mechanism, not identity** — `alert(page)
  .locator('button')` with `toHaveCount(1)` (the count **is** the assertion), `ion-popover` and `ion-menu`
  as scopes, `ion-searchbar input`.
- **The update prompt has no e2e** — proving it needs two deployed builds, and it ships in the first
  release regardless: a client is only told about the next version by code already in the one it runs.
- **`geist` has no e2e** — the happy path is unreachable from headless Chromium, and the Prompt API is
  desktop-Chrome-only, so `unavailable` is permanent on the APK.
- **The a11y rules carry no tests beyond RuleTester** — a rule set is config. What stands in is the
  finding count on the real corpus: 74 findings in 28 files where the previous gate reported 0.
## Findings that were wrong about their own evidence

- **`tsconfig.json`'s `references` is load-bearing for lint.** It looks like dead weight (no child sets
  `composite`, so `tsc -p tsconfig.json` answers TS6306), but removing it turned 178 spec files into "not
  found by the project service": the array is what typescript-eslint's `projectService` walks. **A new
  tsconfig must be added to it.**
- **A spec may read an internal — its own file's.** `verify:exports` allows a sibling `*.spec.ts` reader.
  A spec in a **different** directory reaching for an internal is a finding: move the assertion beside its
  subject, never widen the export.
- **A written-down lesson does not apply itself to the code underneath it.** The office-time stat cards
  froze because `calculateStats` read `dayjs()` inside projectors memoized on the slice — three lines
  below a facade comment documenting that exact trap. Two audit findings were also wrong about their own
  greps, in both directions: a filter that excluded the lines carrying the evidence, and a grep of
  `src/**/*.html` for behaviour that lives in a web component's shadow DOM.
- **The cash import CSVs were real giro exports and are gitignored**, purged from history before the first
  push. Two traps a naive purge springs: the blobs had lived at two paths, and the commit message
  *described* them (`filter-branch` leaves it without `--msg-filter`). Verify with
  `git rev-list --objects --all`, not a clean tree.
## The native project

- **`android/` is committed, and that reverses an earlier call.** `cap add android` does not regenerate it
  *identically*: a newer CLI scaffolds a different tree, and `android-postsync.sh` only pins the values it
  was told about — wrapper version, AGP, SDK levels and manifest defaults all drift silently between
  machines. Committing turns that into a reviewable diff. The `android/.gitignore` Capacitor ships excludes
  the generated half **because it expects the project to be versioned**.
- **`android-postsync.sh` stays, and its patches split in two.** The versionName/versionCode and signing
  patches are *derived per build* and must keep running; the rest is now also committed file state, kept
  because it costs nothing and keeps a from-scratch `cap add` correct.
- **`.gitattributes` exists only for the Gradle wrapper.** `gradlew.bat` is parsed line by line by
  `cmd.exe` and needs CRLF; git normalises to LF on check-in, which would break the Windows half of a
  wrapper whose whole point is that it works everywhere.
- **The launcher label is `appName` in `capacitor.config.ts`.** Capacitor writes it into `strings.xml`
  when it *scaffolds* and never again, so editing the config alone does not reach an existing `android/`.
  Cosmetic — identity is `applicationId` + signature — so it is free to change across releases.
## CI and deployment

The workflow file is the documentation for what CI does, and every choice in it is enforced by the run
itself — one serial job, Pages through the artifact API on a short-lived OIDC token, `configure-pages`
absent because the base path is pinned and gated, `contents: write` scoped to the release job, the digest
printed rather than attached, and a release re-asserted `--draft` so a retry cannot publish an APK-less
one. One decision is not visible there, because it is about what CI deliberately CANNOT do:

- **The signing key does not go into GitHub secrets, and CI builds no APK.** Weighed and declined: it
  would have saved three minutes a few times a year against a credential that *cannot be rotated* — a
  leak has no recovery story except abandoning the app identity and asking every user to uninstall,
  which takes their data. The exposure is also wider than "someone steals the repo": anyone with write
  access, any later workflow edit, and every third-party action sharing the job (`checkout`,
  `setup-node`, `cache`) would run beside it. The general shape is **automate up to the trust boundary
  and stop** — the same instinct that put Pages on a short-lived OIDC token instead of a PAT. So the
  release job goes as far as a runner can without the key, and the two assets are attached by hand.

## The shared list page, and what governs the next caller

Twelve `BaseItem` lists render `ListPageComponent`. This is the half a read of the source does not give.

- **Absence is the declaration, for every axis.** No `catalog` means no chip bar, no `manageCategories`
  no button, no `reorder` no drag handle, no `sections` one unnamed section, no `updateSort` command a
  list that is ARRANGED. One statement of each fact, with nothing empty to keep in step and nothing to
  read as "not loaded yet".
- **`itemTemplate` never required `app-list-item`.** Tracking, schedules and the uncategorized view all
  pass their own row — a trailing amount or a second action is a reason to write a row, not a reason to
  leave the shared page. First thing to check when a page looks like it cannot join.
- **The drag handle is withdrawn under a search, an armed filter or a truncating window.** A reorder
  reports the ids it can SEE and the reducer writes them back over the whole collection, so a drag over a
  partial view silently drops every row the view hid. The reducer's refusal of a short order is the
  backstop, not the UI.
- **Whether an order is PINNED or a sort MODE turns on the toolbar, not on the domain.** Pinning in the
  selector is only a one-way door when a toolbar exists to override it. Schedules and the ledger pin; the
  recipe book made its cookability ranking a sort option, because there a first tap would otherwise have
  been a one-way door out of the page's whole point. A ranking no field can express is still expressible
  as "what an absent sort means".
- **A sort fallback is not a pinned order.** `filterAndSortItemList` compares by NAME when `sort` is
  absent, so three "list items" selectors were quietly alphabetising lists whose order is semantic — each
  dead code pointing the wrong way. **A list with a meaningful order needs its own selector**, and the
  absence of a toolbar is not what pins it.
- **Structure over behaviour, where a private answer disagreed with the shared one.** Joining the shared
  effects changed what a duplicate name does: the hand-rolled save matched by `id` alone, the shared
  matcher matches id then exact name — so saving a new rule named like an existing one now updates it, as
  it already did for accounts, categories and every household list. `updateListItem` keyed off the same
  matcher all along, so the two halves disagreed before. Uniform beats the private answer unless the
  private answer is load-bearing.
- **The show-more tap became `ion-infinite-scroll`, and that is LAZY LOADING, not virtualization.** It
  changes only what triggers the next slice: it measures nothing and recycles nothing, so variable row
  heights are irrelevant and it retires neither the shown-count nor the reset-on-search rule. Real
  windowing stays unbuilt rather than superseded — `ion-virtual-scroll` was deprecated in Ionic 6 and
  **removed** in 7 with the CDK named as successor, and the CDK strategy wants a fixed `itemSize` which
  sliding rows of two and three lines with section headers between them do not offer.
- **Two lists are deliberately not candidates.** A `DeckEntry` has no `name` — its label is a per-skin
  marker — so nothing exists for a title, a search or a comparator to read, and its rows are toggles over
  a visible set rather than an `ItemList`. And cash's uncategorized view keeps its own empty state,
  because there an empty list is a SUCCESS while the shared one offers to create a transaction.
## Features and gates weighed, and declined

- **Household is the first MVP feature.** Declined against that scope: the bulk `storage → shopping`
  sweep, because the loop already closes by hand and `minAmount` has never been driven against a real
  pantry — automating an unexercised judgement is how you get a list you stop trusting. And `bestBefore`
  stays plain text, printed and sortable, never coloured: `storageStatusColor` on two axes would have to
  rank which one wins.
- **Multi-list household is not what `:listId` offered, and categories already deliver the use case.**
  Real multi-list means turning one `HouseholdState` field into a keyed collection, against six
  `Record<HouseholdListId, …>` maps and a `ListSettings` of six booleans naming the lists pairwise with no
  answer for _which_ shopping list. A shared catalog plus a route-state filter already gives "Freezer" or
  "Aldi" separation, filtering and a bookmarkable URL at no structural cost.
- **`emoji:build` stays out of CI.** The output is committed, so the build never needs the network and a
  stale artifact can only miss emoji from a newer Unicode release — a gate would need `emojibase-data` in
  CI for a check that fires once a year.
- **No skin-tone choice in the picker.** CLDR nests tone variants under each base emoji, turning 1644
  entries into several thousand for a picker that decorates an item name. A name pasted _with_ a tone
  modifier survives the round-trip regardless.
- **The PWA icons stay `"purpose": "maskable any"` at every size** — one bitmap for both wastes the
  maskable safe-zone padding in the `any` context, and splitting is worth it only if a real device's crop
  looks wrong. A trigger, not a task.
