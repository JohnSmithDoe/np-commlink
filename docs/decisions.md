# Decisions

Settled — do not re-flag as work. Blocked and before-the-next-major work is in [state.md](./state.md);
the next major's scope is in [next-version.md](./next-version.md).
No entry cites a commit SHA: a history rewrite invalidates every one. A claim carries its own evidence.
**Append while a decision stands; collapse it into its successor once one supersedes it** — a superseded
entry left standing grows this file and eventually contradicts the code.

Two things do not belong here, learned by finding both. **A count the code owns** — it drifts, and a
reader trusts it anyway. And **anything a `why` banner already says**: a banner sits on the file someone
is about to edit, which is closer to the danger than this file is, so when the two overlap the banner
wins and the entry goes.

## Per-domain decisions

A module's own reasoning lives beside the module, so this file stays about what crosses them.

- [CREDSTICK](domains/credstick.md) — the camt import, the key space, the ledger, rules and schedules
- [BIOMON](domains/biomon.md) — weight, profiles, pills and the notification slots
- [DAILY RUN](domains/ritual.md) — prompts, completions and why there is no streak
- [SIGIL](domains/notes.md) — one note type, the editor with no save button, images
- [SOYKAF](domains/soykaf.md) — presence-only matching, and the v2 recipe book
- [The deck](domains/deck.md) — what ships on, and what stays reachable

## Declined extractions — read as duplication, are not

Do not re-propose these; each was measured. **A decline has a shelf life** — five entries once stood
here whose extraction later shipped anyway, so nothing goes in without a reason that outlives the shape
it was measured against.

- **A `field-note` read idiom.** An empty money box disables save SILENTLY, an empty **name** says so.
  Not an inconsistency: the money box was never seeded, so blank is initial state, while the name box
  was, so blank means cleared.
- **A 24-line banner ceiling.** 32 is the gate, and `commlink/comments-header-only` carries the
  reasoning; **6–14 lines is the guideline for a new one**.

## Keep, despite looking unused

- **`@capacitor/app`, `keyboard` and `haptics`** — all three have zero imports and all three ship on the
  native classpath, which is how a Capacitor plugin works. Removing `app` changes Android's back button,
  and no gate sees it. **"No import" is not "unused" for a Capacitor plugin.** Giving `haptics` its first
  call sites is scheduled ([next-version.md](./next-version.md)); that is about USING it, not keeping it.
- **`sonar-project.properties`** — Sonar runs on demand, natively (the CLI image is amd64-only; a
  container mount breaks coverage import). Not for CI without deciding gate semantics: it asserts on
  *new* code only, so a first analysis passes vacuously.
- **Intended variants outlive a `/simplify` sweep.** A sweep reads spec-only usage as unreachable, but
  the spec cases are the **specification** — and only the owner can tell unreachable from unwritten.
  Deleted once on that argument and reverted.

## Identity and keys

- **A category name is a label, never an identity.** Three owners hold `{id,name}` and reference by
  `CategoryId`. The name decides *duplicates* only: adding an existing one is a no-op, renaming **onto**
  one merges.
- **When a reducer rewrites rows a dialog is editing, the dialog is a row too** — the open draft put a
  retired id back on save, so the category picker follows the survivor.
- **A GUID per row, a natural key per singleton** — natural only where the key **is** the thing: list ids
  (route param, effects guard and persisted discriminator at once), deck ids, office-time's day maps.
- **Branded ids were rejected, and nothing since reopens them.** The cost is an `as` at every mint point
  *including every IndexedDB read*, in an app with zero `any`. One mint, and the disk read re-mints
  rather than casting, so junk on disk is normalized not trusted.
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
- **A skin-composed i18n keyspace** — made all 60 keys invisible to `--clean`, and a missing skin
  surfaced only at runtime. Declared `Record<Skin, …>` fields make it a compile error.
- **A CI i18n freshness gate** — the extract flags removed the need. *One artifact, two writers.*
- **`@ngrx/component-store` / `signalStore` for dialog state** — `signal` + `computed` was the whole
  requirement; no dialog state lives in NgRx.
- **`office-time → tracking`** — the realized office-time is standalone and only reports telemetry.
- **`geist`'s happy path is desktop-Chrome-only, permanently.** The Prompt API ships nowhere else, so
  `unavailable` is the APK's answer forever and the module is built around that being a normal state,
  not a failure.
- **A release const gated against `package.json`**, and **closing `metric?: string` into a union** —
  esbuild `define` has nothing to drift, and `metricKey` was preferred at three repeated markers.

## Layout and theme

- **The multi-column list above 1024px, reverted.** **Rows differ in height** (a running session is
  three lines, a stopped one is one), so `align-items: start` left ragged gaps and the tall row appeared
  to escape the grid. Row heights are content, not layout: no column count fixes it, and masonry or
  fixed-height rows are not worth what they cost a touch list.
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
- **A desktop gap is never closed by shrinking a touch row.** Row height and font size pay on the
  platform that was already right; the fix belongs to the measure. Why `space-between` needs one is on
  `_item-rows.scss`.
- **Explicit `color: 'danger'` is untouched by the toast accent** — a refusal should not look like the
  deck. What `--ion-color-accent` is and why it is not a recoloured `success` is on `variables.scss`.
- **Nesting the stored accent map by mode was declined** — a shape change on a slice every install holds,
  to preserve a colour that is two taps to pick again. Why a hand-picked accent is dropped at all is on
  `settings.reducer.ts`.

## Router and navigation

- **The router is a write API; the store is the read API.** Reads come from `@ngrx/router-store`, which is
  read-only by design — NgRx shipped `go`/`back`/`forward` in v3 and **deleted them in v4**. Reading the
  router is a selector; navigating is an effect.
- **The route sets the filter; it never clears it.** An absent `?filter=` is not an instruction, and
  household persists `filterBy`. Clearing is its own action, reacted to twice: each domain resets its own
  `filterBy`, one shared effect strips the query string.
- **`NavController` is `Router` plus a direction** — all it adds is `setDirection(...)`. Injecting
  `Router` is correct everywhere; the places that do are not a backlog.
- **Navigating is an effect when the *store* decided it, and not otherwise.** State → URL needs one,
  possibly with no component alive. A gesture that changes no state is not a store concern; routing it
  through an action and an effect adds a type, an effect and a spec to call the same `Router` method.
- **A controller never appears in a reducer** — a reducer runs synchronously and possibly twice per
  dispatch, so a `ModalController` there presents per call and re-fires on replay.

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
  fact about people rather than about code, so it is **asked, never inferred** — the roster and the
  standing instruction are in [CLAUDE.md](../CLAUDE.md), and every exemption taken is in
  [state.md](./state.md).
- **`APP_VERSION` is global on purpose** — a slice with no entry for a hop is walked past and re-stamped,
  so the number is a *floor* on the whole document set and two slices cannot disagree about which hop
  they are on.
- **When the first real rung is written:** one per stored-shape change, never one per release (the ladder
  is only as trustworthy as its smallest step); written against `unknown` and casting once, because the
  types it migrates FROM no longer exist and a typed signature keeps a dead copy alive forever; pinned by
  a spec against a literal of the old shape. A rung is a one-way door on someone's data — no down-ladder,
  no backup — so `runMigrations` throwing is the only safe failure: it loads empty, never half-migrated.
- **A reset is a legitimate answer to a moved shape.** A rung is owed to data whose **meaning** survives
  the change; a reset is honest when it does not. The deck's pre-flip document named the ids to _hide_,
  which the new reading would show — migrating it would have inverted every holder's choice, so a rung
  was not the cheaper option but the wrong one.

## Destructive actions

- **A swipe deletes and does not ask, where a row is cheap to re-add.** Those rows carry an `expandable`
  `ion-item-option`: a list whose job is a pantry or a task pile must be as cheap to remove from as to add
  to, and a confirm on every row taxes the common case to insure the rare one. **Cash is the only swipe
  deliberately not expandable**, on the grounds below. The categories dialog expands like the rest: its
  delete cascades through three reducers, and a cascade is answered by undo, not by a harder gesture —
  which is a debt until the cascade restore lands ([next-version.md](./next-version.md)).
- **Undo over confirm, and a confirm is not to come back as a substitute for one.** Cascades and bulk
  wipes are a different class and are not settled by this — destroying what the user was not looking at
  is scheduled ([next-version.md](./next-version.md)).
- **Who opts into undo is decided by the round trip, not by taste.** `undoableDelete` pushes
  `addItem(item)`, so a list qualifies only where the delete took nothing but that item: shopping,
  storage, products, tasks, tracking, recipes, vitals' readings. The abstainers each have a reason —
  categories and vitals' profiles CASCADE, so `addItem` would restore the row and not what it took with
  it; cash confirms instead; trackplay stashes one snapshot where the stack holds ten. **Products is the
  one that slipped through**: deleting a product also strips it from every recipe, and restoring the
  product does not bring those ingredient lines back.
- **The stack's persistent path is `app-undo-button`, in every list page's header.** A toast is
  `role="status"`, so its button is never announced and it lives five seconds; the header button lives as
  long as the stack is not empty and is what makes entries below the top reachable at all. It is also
  what earns the `a11y-no-actionable-toast-button` suppression — the rule stays suppressed only while
  trackplay, the last caller with no such path, keeps its own toast.
- **A write confirms only where its result is off screen.** A create lands in the list being looked at
  and an edit changes the row behind the dialog, so neither toasts anywhere in the app; a delete is an
  absence, and what it raises is the undo offer rather than a receipt. Tracking kept four toasts under
  the old arbitrary answer and keeps one: `saveAndResetTracking`, whose result is an archive entry on
  another page. Failures always toast.
- **Cash confirms, and not only at the ledger** — accounts, the ledger, rules and schedules all route
  through `deleteConfirmAlert`. The ledger is imported bank history and re-adding a row by hand is not
  the cheap gesture this policy buys elsewhere; the other three inherit that, being the definitions the
  ledger's rows are read against.

## Accessibility

- **The eight `commlink/a11y-*` rules stay, and what was wrong was measurement, not size.** R6 was inert
  on the app's only actionable toast and R4's controller half was blind to the global error handler's
  alert, both because the receiver regex demanded a suffix the code had stopped writing. Fixed by one
  character class plus RuleTester cases, verified by reverting the regex and watching exactly those
  cases go red.
- **The touch floor is a token and one global rule, not a lint rule.** `--sr-touch` is 2.75rem — 44 px at
  the default root, WCAG 2.5.5's enhanced target, not 2.5.8's 24 px minimum — and `global.scss` floors
  every `ion-button[size='small']` at it. `size="small"` therefore means small TYPE, never a small
  target, which is why banning the attribute was the wrong gate: it would have left the default size
  under 44 px and read as solved. A rem keeps the floor growing with a raised root font; the emoji
  picker's grid track and the weekday picker's `min-width` read the same token rather than their own
  literals. **One opt-out**: the chip's remove X, inline inside a 32 px chip whose own row is the target
  — flooring it inflates every form that shows a category.
- **axe-core evaluated, not adopted** — it would cover R1/R2/R3 and add contrast classes no rule here
  touches, but it samples what a run happens to render where ESLint reads every template. Different axes,
  not substitutes — and it structurally cannot see the imperative overlay path, which is why neither rule
  considered for deletion was deleted.
- **Raising error toasts to `assertive` was declined** — it would mean replacing `ion-toast`. What Ionic's
  toast already announces, and the reading that dates it, are in `ionic-a11y-assumptions.spec.ts`.

## Findings that were wrong about their own evidence

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

- **`android-postsync.sh` stays, and its patches split in two.** The versionName/versionCode, signing and
  launcher-label patches are *derived per build* and must keep running; the rest is now also committed
  file state, kept because it costs nothing and keeps a from-scratch `cap add` correct.
- **The launcher label is `appName` in `capacitor.config.ts`.** Capacitor writes it into `strings.xml`
  when it *scaffolds* and never again, so editing the config alone does not reach an existing `android/`.
  Cosmetic — identity is `applicationId` + signature — so it is free to change across releases, unlike
  the fields in [state.md](./state.md)'s one-way doors.

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

Every `BaseItem` list renders `ListPageComponent`. This is the half a read of the source does not give.

- **Absence is the declaration, for every axis.** No `catalog` means no chip bar, no `manageCategories`
  no button, no `reorder` no drag handle, no `sections` one unnamed section, no `sortOptions` a list that
  is ARRANGED. One statement of each fact, with nothing empty to keep in step and nothing to read as
  "not loaded yet".
- **`itemTemplate` never required `app-list-item`.** Tracking, schedules and the uncategorized view all
  pass their own row — a trailing amount or a second action is a reason to write a row, not a reason to
  leave the shared page. First thing to check when a page looks like it cannot join.
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
  Real multi-list means turning each named `HouseholdState` list field into a keyed collection, against a
  `ListSettings` whose six cross-list booleans name the lists PAIRWISE — a shape with no answer for
  _which_ shopping list. A shared catalog plus a route-state filter already gives "Freezer" or "Aldi"
  separation, filtering and a bookmarkable URL at no structural cost.
- **`emoji:build` stays out of CI.** The output is committed, so the build never needs the network and a
  stale artifact can only miss emoji from a newer Unicode release — a gate would need `emojibase-data` in
  CI for a check that fires once a year.
- **No skin-tone choice in the picker.** CLDR nests tone variants under each base emoji, turning the
  catalog into several thousand entries for a picker that decorates an item name. A name pasted _with_ a
  tone modifier survives the round-trip regardless.
- **The PWA icons stay `"purpose": "maskable any"` at every size** — one bitmap for both wastes the
  maskable safe-zone padding in the `any` context, and splitting is worth it only if a real device's crop
  looks wrong. A trigger, not a task.
