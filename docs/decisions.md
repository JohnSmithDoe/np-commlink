# Decisions

Settled — do not re-flag as work. Blocked and before-the-next-major work is in [state.md](./state.md);
the next major's scope is in [next-version.md](./next-version.md).
No entry cites a commit SHA: a history rewrite invalidates every one. A claim carries its own evidence.
**Append while a decision stands; collapse it into its successor once one supersedes it** — a superseded
entry left standing grows this file and eventually contradicts the code.

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
## Scope and defaults

- **A cold install ships an empty deck** — no entry listed, one `@empty` node pointing at
  `/commlink/deck`. The curated four it replaced were not wrong, they were unmaintainable in a specific
  way: every new feature re-opened "does this one belong in the default?", a question with no checkable
  answer, paid for by whoever adds the next module. Empty is a rule instead of a list. **No entry is ever
  added back as a special case.**
- **The deck stores what is VISIBLE, and absence means HIDDEN.** Held the other way round, "a cold
  install ships an empty deck" was a RULE in the prose and a LIST in the code — the whole catalog
  restated — so the one invariant the deck has was maintained by copying. Three things fall out of the
  polarity and none needed arguing separately: an entry nobody has seen arrives OFF, renaming an id can
  no longer switch a program on for everyone, and `initialDeck` is `[]`.
- **Legal only because nothing is stranded — re-check before any entry claims to be reachable "from the
  deck".** Two unconditional entrances: the drawer's static `/settings` button and the grid's `@empty`
  link. An `onDeck: false` entry is why they are needed.
- **One switch per program, and no module axis at all.** A module toggle gated the same visibility a
  program toggle already gated, so two controls answered one question and a hidden module had to disable
  its children's toggles to stay coherent. The module survives as a **label on the program row**, and
  only where it names a group — on a module of one it repeats the row's own title.
- **Household is the first MVP feature.** Declined against that scope: the bulk `storage → shopping`
  sweep, because the loop already closes by hand and `minAmount` has never been driven against a real
  pantry — automating an unexercised judgement is how you get a list you stop trusting. And `bestBefore`
  stays plain text, printed and sortable, never coloured: `storageStatusColor` on two axes would have to
  rank which one wins.
- **A control the user can operate must change something the user can observe, and a page the user can
  reach must be reachable without a URL bar.** The flags page is why: `list-settings` left `DECK_CATALOG`
  entirely, because a drawer row was a second, weaker answer to a question its own toolbar answers
  better — and one a hidden program could switch off, leaving a page reachable only by URL.
## Destructive actions

- **A swipe deletes and does not ask.** Every destructive `ion-item-option` is `expandable`. A list whose
  job is a pantry or a task pile must be as cheap to remove from as to add to; a confirm on every row
  taxes the common case to insure the rare one.
- **Undo over confirm, and a confirm is not to come back as a substitute for one.** Undo is opt-in per
  list. Cascades and bulk wipes are a different class and are not settled by this — destroying what the
  user was not looking at is scheduled ([next-version.md](./next-version.md)).
- **Cash still confirms** — the ledger is imported bank history, and re-adding a row by hand is not the
  cheap gesture this policy buys elsewhere.
## Ritual

- **There is no streak.** A lifetime total and a seven-day dot row; no counter a gap sets to zero. A
  streak protects an asset for someone already consistent and manufactures one to destroy for someone
  who is not — and the second is who this is for. A gap costs nothing that existed, and two good days
  visibly repair it.
- **Completions are an append-only log, never a stored count** — the total, "is today closed" and every
  date statistic are selectors. A bonus completion is just another row, and the *day* is closed by any
  row dated today.
- **The reminder is a cron the OS owns and will nudge on days already finished.** The cron branch re-arms
  itself, so the nudge survives an app never opened again — which means today's occurrence cannot be
  suppressed. The right way to be wrong: a redundant nudge costs a glance, a reminder that quietly
  stopped costs the habit. Hence neutral wording, since copy assuming the task is undone would be wrong
  on the days the user did best.
- **It is `ritual`, not a page inside `tasks`** — `tasks` means `TaskItem`, with categories, an edit
  dialog and a sort. A prompt catalog and a completion log share none of that state.
- **The catalog lives in the translation bundle** — ~100 prompts, ~7.5 KB on a 31 KB boot fetch, keeping
  de/en in lockstep. **Past ~250 entries**, copy the emoji catalog's per-language dynamic imports.
- **Adjacency is the complaint, not recurrence** — the draw excludes the last twenty *distinct* completed
  prompts, bounded by count rather than a day window (bonus completions put five rows on one day), and
  falls back to the whole catalog when the pool would empty.
- **A prompt can be dismissed for good** — "open a window" is trivial in June and wrong in a January flat
  with a sleeping baby. *Not for me* is deliberately not a rating, a snooze or a per-day skip, and it
  ships with two ways back because `ion-toast` is `role="status"` and its button is never announced.
- **Every prompt passes one test: it cannot be half-done.** "Put one book back" has a moment it is
  finished; "tidy the shelf" does not. The three-minute ceiling is a proxy for that property, not a rule.
- **The card commits in place, and must never become a button.** The task modal's *Später* button was the
  tell — a control whose only job was to unwind the container it lived in. As a button the card's
  accessible name would be the task text, so it would announce *"…, button"* without saying what pressing
  does, and the largest target on screen would commit the day.
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

## CREDSTICK — the import, the keys, and what the ledger reads like

- **Bank statements are imported as camt, and only as camt.** A CSV export is a positional format whose
  column order is the bank's private business: Volksbank's real download is 18 columns with `Buchungstag`
  at index 4, and the parser written against a 10-column sample found no header, returned zero rows and
  reported zero rejected — a silent empty import with nothing on screen to explain it. camt states what a
  CSV makes you guess, so ONE parser serves every bank. The general shape is **prefer a self-describing
  payload over out-of-band configuration**.
- **`AcctSvcrRef` is ASSUMED to be intrinsic to the entry, and that assumption is load-bearing.**
  Volksbank's looks like `2026043042104045000` — nineteen digits opening with the booking date. Two
  readings fit one sample: a booking timestamp plus a counter, which is stable across exports, or a
  sequence assigned when the *file* was generated, which is not. The second would make every re-import
  duplicate the whole statement. **Falsifying it costs two minutes:** export one date range twice and diff
  the references. If they differ, the derived key becomes primary and the reference a tiebreaker.
- **One key space, no branch.** The schema permits a bank to omit the reference, and a key that is
  *sometimes* present forces every consumer to hold two notions of duplicate at once — so the gap closes
  before anything downstream sees a row. A derived key carries four `|`-delimited segments, which no
  plausible reference has; matching a reference's length and all-digit charset too would have manufactured
  the one collision the two shapes exist to prevent. It counts occurrences AFTER the pages are joined, so
  two €4.20 coffees on one Tuesday are `…|1` and `…|2` — numbering per document would restart at `1`
  wherever a pagination boundary fell between them.
- **The parser reads `<Ntry>`, never `<TxDtls>`, and matches on `localName` throughout.** A collective
  booking is one entry holding many details, and the balance moves once. Versions disagree on the
  namespace URI, on whether `<Sts>` holds a code or wraps one, and on whether a party sits under `<Pty>` —
  pinning any of it rejects half the exports in the wild. `fflate` is imported dynamically inside the
  unzip branch, and a zip is recognised by its magic bytes rather than its extension.
- **`<Bal>`/`CLBD` is read as a checksum, not adopted as the balance.** Comparing the bank's own closing
  figure against the derived one turns a silent import gap into a number, as of the statement's last
  entry. Adopting it would paper over exactly the gap it exists to reveal.
- **`name` is the counterparty; the statement line is not.** The line is counterparty and purpose run
  together and a purpose is a paragraph, so it read as a wall in the ledger, the report and every delete
  confirm. Every camt field became its own property and the joined string survives beside them, because
  they answer different questions — `name` is what the list searches, the parts are what a rule matches
  and what the cashboard groups by, and neither derives from the other. The joined line keeps one job:
  building a derived key, where telling two unreferenced rows apart wants everything the bank wrote. The
  cost of the split was a **re-import**, not a ladder step.
- **No table, and no column toggles.** A table compares many rows on one dimension and nobody scans forty
  IBANs — the camt fields are looked up on one booking or matched on in bulk, so they disclose behind one
  control and only date, amount and counterparty stay in the row. One layout at 393 px and at 1440 px.
  One map names those fields for both readers, because two would be two wordings for `MndtId` waiting to
  disagree; a field cannot be offered as filterable without being matchable, and an absent field never
  matches — an unwritten IBAN is not the empty one.
- **A booking is derived from, not retyped, and deriving COMMITS it first.** The entry point is the
  transaction dialog rather than the row, whose two swipe slots are already reconcile and delete (R5
  forbids a third gesture-only path). A rule filing everything except the booking it came from is a split
  brain, and the category on screen is the one the rule must carry.
- **The condition ladder is ordered by stability, not by information.** `mandateId` (one creditor, one
  contract — the definition of a fixed cost), then `counterpartyIban` (survives a rename), then
  `counterpartyName` (survives a new branch), then a one-token stem of the description. ONE token on
  purpose: the original may separate two by anything, so a `contains` built from a guess about the gap
  matches nothing, while one token cannot be wrong about the string it came from — only too broad. Too
  broad is answered by feedback: the dialogs show what the draft catches and render nothing until every
  condition has a value, because `contains ''` matches the whole ledger.
- **A rule says what it catches and what it never will.** Per rule, `matched` and `claimed` are different
  numbers: zero matched is dead, matched-but-never-claimed is **shadowed** by an earlier rule. First-match
  ordering is otherwise invisible, and shadowing is the only bug an arrangement can have — which is also
  why the apply effect fires on **reorder**, the arrangement being part of what a rule means.
- **`categoryManual` is stamped only when the category CHANGED in the dialog.** Stamping it on every save
  froze a booking against every future rule because somebody corrected its date — and it made the derive
  flow refuse to file the very booking it came from.
- **A schedule is its own entity, not a `CashRule` with extra fields.** Every transaction wants a category
  while only a dozen are fixed costs, so merged most rules would carry dead fields; two schedules claiming
  one booking is a bug to SHOW where first-match-wins is a rule's whole semantics; and `recategorizations`
  is pure and re-runnable, while a schedule learning its amount holds state. Merging would turn a
  re-derivation into a write path. Its period is read off the history — the median month gap over the
  bookings its own conditions match, snapped to 1/3/6/12.
- **A schedule's `amountCents` is an estimate that learns, and learning is ONE action with advancing the
  due date.** They are one fact: the booking arrived. Split, a confirmed amount could land on a schedule
  still claiming last month's due date, which the reserve would then divide by zero months.
- **The reserve is `amount ÷ monthsUntilDue`, and nothing is stored.** Dividing by `periodMonths` is wrong
  in a schedule's first month: it claims €50 of a €600 premium is set aside when nothing is. Dividing by
  the months REMAINING needs no accumulation history and no first-month case — installed in January, a
  March premium reserves €300 a month, which is steep and true. A **storable** pot waits for something a
  number cannot do. An overdue schedule stays committed and is shown: its money has not left, so releasing
  it would report spendable cash a late direct debit is about to take.
- **A forecast is never `status: 'pending'`.** That value belongs to camt's `PDNG` and the reconcile path
  keys off exactly that field, so a projection and an unsettled bank booking would be indistinguishable.
- **Three views, three scopes, three routes.** The ledger is per-account and answers "what happened"; the
  burn-down is across accounts over a calendar month and answers "what can I spend today"; the cashboard
  is across accounts and months and answers "where does it go". Not three renderings of one dataset, which
  is why they are not segments of one page. The report window is a facade signal rather than stored state —
  a question the reader is asking, not a fact about the ledger — and a calendar span, so the number stops
  moving at midnight. `todayISO` is a signal for the same reason: a computed that reads the clock has no
  dependency to invalidate.
- **The cashboard reports its own trustworthiness, and the figure is a route.** The uncategorized share is
  the one number saying how much of "where did it go" is actually answered, because "where" *is* the
  category — so it leads to a list of its bookings biggest-first, weighted by amount so the order matches
  what it is trying to fix. Counterparty grouping is by IBAN and skips typed rows, which name no account.
- **`importKey` stays optional on `CashTransaction`.** Expressing "required only when `source` is
  `imported`" needs a split union that eleven unrelated call sites would have to narrow, for a fact the
  import path already guarantees at the only place it matters.

## BIOMON — weight, and the profiles it hangs off

- **One domain, one slice: `{ profiles, readings }`.** Blood pressure, when it comes, is a third key in
  the same slice rather than a `bloodpressure` domain — domains are sealed, so a second one could not
  import the profiles, and they are the spine. Promoting profiles into `@shared` later is the expensive,
  irreversible half. Generic `value`/`unit`/`kind` records were rejected for the reason reversed: they buy
  a union, a unit formatter and an axis-switching chart to serve a metric that does not exist.
- **A reading's `name` IS its date, `YYYY-MM-DD`.** The shared list machinery keys a row on `name`, so
  `requireUniqueName` over the profile's own readings *is* the "one reading per profile per day" rule,
  with no second spelling of the date to keep in step. What `name` does not buy is identity —
  `findMatchingItem` falls back to matching names across a whole list, and two profiles weighed on one
  day share one — which is why readings carry an id-only add-or-update of their own.
- **The tripwire on that: a fifth suppression means the altitude was wrong.** Four of the shared
  machinery's name-flavoured behaviours meet a reading; two are answered and two are harmless. A fifth
  would mean the date is fighting the mechanism rather than riding it, and the answer then is a real
  `date` field plus a generalized unique-field rule in `@shared`.
- **Weight is stored as integer `grams`**, rounded at the input edge rather than in the type, so a later
  two-decimal scale needs no migration. `cents` already proved the unit belongs in the field name.
- **Tapping add on a date already logged opens that reading instead of refusing it.** The consequence is
  worth knowing: once today is logged, the add button no longer offers a create dialog, so a forgotten
  past day is reached by editing today's rather than by adding beside it.
- **Subtracting the person from a co-weighed pet is a calculator, not data.** The holder picker writes the
  difference into the weight field and nothing about the holder is stored, so either side can be
  corrected afterwards with no stale link. The suggestion is the holder's nearest reading **at or before**
  the date — back-dating must not subtract a body weight from the future.
- **The deck badge is a count of readings, not a weight.** A kg figure needs a designated self profile
  and the module deliberately seeds none; a delta would need a sentinel for "no reading yet", and `-1` is
  a perfectly good delta.
- **Deleting a profile takes its readings with it, and the undo entry is built in the command.** An effect
  runs after the reducer and would snapshot a profile whose history is already gone, so the facade pushes
  the restore before dispatching the delete — the last place that can still see both.
## BIOMON — pills, and one id per weekday

- **A pill's `slot` is a block of eight OS notification ids, and `nextSlot` only counts up.** The OS keys
  a notification by one integer while a pill needs up to seven (one weekly cron per due weekday). Never
  reusing a freed slot costs one integer in the slice and removes the need to establish that no cancel
  and schedule can ever race over one id.
- **The reminder effect reconciles the whole domain, not the pill that moved.** An effect runs after the
  reducer, so a deleted pill is already gone from state and nothing can read its ids back off — the same
  for every pill a deleted profile took. `nextSlot` bounds the sweep. That one path also covers a weekday
  being unticked, a profile rename changing the reminder body, and an undo.
- **`weekdays` is ISO (Monday 1), never the plugin's `Weekday`.** Capacitor numbers from Sunday; that
  enum is a runtime import and a dependency's detail, and this shape is persisted. Conversion happens at
  the platform edge, which is also where the cron lives.
- **An intake is a fact about a day, so it is a separate collection keyed by `(pillId, takenOn)`** — not
  a field on the pill, which would leave yesterday's tick reading as today's. "Taken today" is a
  comparison against `TodayService.today`, so the daily reset needs no timer and no midnight action.
- **Both switches live in the edit dialog, not the row.** No list row in this app carries a toggle, and a
  row that owned the taken-tick would have to answer "taken when" on every render. It also keeps R5 free.
- **Pills match on the id, like readings, but for the neighbouring reason.** Their uniqueness rule is
  scoped to one profile — two profiles may each hold an "Ibuprofen" — and default name-matching would
  edit the wrong one.
## Notes (SIGIL), and what the rename cost

- **One note type, never two.** "Image note" and "text note" would need a discriminator, a convert action
  and a branch in every renderer, to describe the difference "this one has no body". The distinction it
  draws is in the CREATE affordance, not in the data.
- **`items` is one array and the two sections are a partition of it.** Pinning is therefore a one-field
  change and never a move between collections, and a reorder writes a section's new order back into the
  slots that section already occupied. It REFUSES an order shorter than its section, because that is
  exactly what a drag under an armed search would send.
- **The editor has no save button.** Every keystroke is a candidate write and a write serialises the whole
  slice, images included, so the facade debounces and flushes on destroy. Destroy is also why the note id
  is captured on the way IN: by the time the page is torn down the router has moved on and a route-derived
  note reads as undefined — which is how the discard-a-blank-note path first failed.
- **A picked image is re-encoded to a 1600px JPEG before it is stored.** The budget is about the write,
  not the display: the whole slice is rewritten on each save, so one untouched camera photo would be paid
  for again on every keystroke of the body beneath it.
- **Reorder is pointer-only, and that is a known R5 gap.** `ion-reorder-group` ships no keyboard support
  and nothing else offers "move this note up". Here it is cosmetic — every note stays reachable,
  searchable and openable without a drag — where in `cash-rules` the same gap sits on a *semantic* order.
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
