# Domain decisions

One module's own settled reasoning — do not re-flag as work. Cross-cutting decisions are in
[decisions.md](./decisions.md), blocked work in [state.md](./state.md), the next major's scope in
[next-version.md](./next-version.md).

## CREDSTICK — cash

- **Bank statements are imported as camt, and only as camt.** A CSV export is a positional format whose
  column order is the bank's private business — a parser written against a 10-column sample found no header
  in Volksbank's real 18-column download and reported a silent empty import. camt states what a CSV makes
  you guess, so ONE parser serves every bank. **Prefer a self-describing payload over out-of-band configuration.**
- **`AcctSvcrRef` is ASSUMED intrinsic to the entry, and that assumption is load-bearing.** Volksbank's
  looks like `2026043042104045000` — nineteen digits opening with the booking date. Two readings fit: a
  booking timestamp plus a counter (stable across exports), or a sequence assigned when the *file* was
  generated (not stable, which would make every re-import duplicate the statement). **Falsifying it costs
  two minutes:** export one date range twice and diff the references. If they differ, the derived key
  becomes primary and the reference a tiebreaker.
- **One key space, no branch.** A key that is *sometimes* present forces every consumer to hold two notions
  of duplicate, so the gap closes before anything downstream sees a row. A derived key carries four
  `|`-delimited segments, which no plausible reference has. It counts occurrences AFTER the pages are
  joined — numbering per document would restart at `1` wherever a pagination boundary fell.
- **The parser reads `<Ntry>`, never `<TxDtls>`, and matches on `localName` throughout.** A collective
  booking is one entry holding many details, and the balance moves once. Versions disagree on the namespace
  URI, on whether `<Sts>` holds or wraps a code, and on whether a party sits under `<Pty>`. `fflate` is
  imported dynamically inside the unzip branch; a zip is recognised by magic bytes, not extension.
- **`<Bal>`/`CLBD` is read as a checksum, not adopted as the balance.** Adopting it would paper over exactly
  the import gap it exists to reveal.
- **`name` is the counterparty; the statement line is not.** Every camt field is its own property and the
  joined string survives beside them — `name` is what the list searches, the parts are what a rule matches
  and what the cashboard groups by. The joined line keeps one job: building a derived key. The cost of the
  split was a re-import, not a ladder step.
- **No table, and no column toggles.** The camt fields are looked up on one booking or matched on in bulk,
  so they disclose behind one control and only date, amount and counterparty stay in the row. One layout at
  393px and at 1440px. One map names those fields for both readers; a field cannot be offered as filterable
  without being matchable, and an **unwritten IBAN is not the empty one**.
- **A booking is derived from, not retyped, and deriving COMMITS it first.** The entry point is the
  transaction dialog rather than the row, whose two swipe slots are already reconcile and delete (R5 forbids
  a third gesture-only path). A rule filing everything except the booking it came from is a split brain.
- **The condition ladder is ordered by stability, not information.** `mandateId` (one creditor, one
  contract), then `counterpartyIban` (survives a rename), then `counterpartyName` (survives a new branch),
  then a one-token stem of the description. ONE token: the original may separate two by anything, so a
  `contains` built from a guess about the gap matches nothing. Too broad is answered by feedback — the
  dialogs show what the draft catches and render nothing until every condition has a value, because
  `contains ''` matches the whole ledger.
- **A rule says what it catches and what it never will.** `matched` and `claimed` are different numbers:
  zero matched is dead, matched-but-never-claimed is **shadowed** by an earlier rule. Which is also why the
  apply effect fires on **reorder** — the arrangement is part of what a rule means.
- **`categoryManual` is stamped only when the category CHANGED in the dialog.** Stamping on every save froze
  a booking against every future rule because somebody corrected its date.
- **A schedule is its own entity, not a `CashRule` with extra fields.** Every transaction wants a category
  while only a dozen are fixed costs; two schedules claiming one booking is a bug to SHOW where first-match-
  wins is a rule's whole semantics; and `recategorizations` is pure and re-runnable while a schedule
  learning its amount holds state. Its period is the median month gap over the bookings its own conditions
  match, snapped to 1/3/6/12.
- **A schedule's `amountCents` is an estimate that learns, and learning is ONE action with advancing the due
  date.** Split, a confirmed amount could land on a schedule still claiming last month's due date, which the
  reserve would divide by zero months.
- **The reserve is `amount ÷ monthsUntilDue`, and nothing is stored.** Dividing by `periodMonths` claims
  €50 of a €600 premium is set aside when nothing is. Months REMAINING needs no accumulation history and no
  first-month case. An overdue schedule stays committed and is shown — its money has not left.
- **A forecast is never `status: 'pending'`.** That value belongs to camt's `PDNG` and the reconcile path
  keys off exactly that field.
- **Three views, three scopes, three routes.** The ledger is per-account ("what happened"); the burn-down is
  across accounts over a calendar month ("what can I spend today"); the cashboard is across accounts and
  months ("where does it go"). Not three renderings of one dataset. The report window is a facade signal, not
  stored state, and a calendar span so the number stops moving at midnight. `todayISO` is a signal for the
  same reason — a computed that reads the clock has no dependency to invalidate.
- **The cashboard reports its own trustworthiness, and the figure is a route.** The uncategorized share is
  the one number saying how much of "where did it go" is actually answered, so it leads to a list of its
  bookings biggest-first. Counterparty grouping is by IBAN and skips typed rows.
- **An imported booking is not deletable; a typed one is.** A row is recognised by statement content, so
  nothing distinguishes "deleted on purpose" from "not imported yet". The veto is `canDelete`
  (`source === 'manual'`), which removes the swipe reveal rather than leaving a dead button; the correction
  path for a wrong imported row is the edit dialog. A reconciled manual leg carries `matchedTxnId` and the
  selector hides it. The pending half needs nothing: a row carries its derived key as well as the bank's, so
  a `PDNG` entry arriving again under the `AcctSvcrRef` it gained when it booked confirms the stored row in
  place (`plan-import.ts`).
- **`importKey` stays optional on `CashTransaction`.** "Required only when `source` is `imported`" needs a
  split union that eleven unrelated call sites would have to narrow.

**Traps that do not reproduce from a read:**

- **Import dedup keys on the `YYYY-MM-DD` prefix only** — `dateISO` carries a local offset, so keying the
  full string re-imports the whole batch after a DST change.
- **A parse returns `{ rows, rejected }`**, never a bare array: a partial import reporting success leaves
  the balance wrong with nothing to notice it by.
- **Reconciliation never auto-merges** — an equal-amount coincidence (two identical fares) would corrupt the
  ledger. Reconciled-away legs are excluded from balances or the spend double-counts.

## BIOMON — weight, profiles, astro, pills

**Weight and profiles**

- **One domain, one slice: `{ profiles, readings }`.** Blood pressure, when it comes, is a third key in the
  same slice — domains are sealed, so a second one could not import the profiles, and they are the spine.
  Generic `value`/`unit`/`kind` records were rejected: they buy a union, a unit formatter and an
  axis-switching chart to serve a metric that does not exist.
- **A reading's `name` IS its date, `YYYY-MM-DD`.** The shared list machinery keys a row on `name`, so
  `requireUniqueName` over the profile's own readings *is* the "one reading per profile per day" rule. What
  `name` does not buy is identity — two profiles weighed on one day share one — which is why readings carry
  an id-only add-or-update. **Tripwire: a fifth suppression means the altitude was wrong.** Four of the
  shared machinery's name-flavoured behaviours meet a reading; two are answered and two are harmless. A
  fifth means a real `date` field plus a generalized unique-field rule in `@shared`.
- **Weight is stored as integer `grams`**, rounded at the input edge rather than in the type, so a later
  two-decimal scale needs no migration.
- **Tapping add on a date already logged opens that reading instead of refusing it.** Consequence: once
  today is logged, a forgotten past day is reached by editing today's rather than adding beside it.
- **Subtracting the person from a co-weighed pet is a calculator, not data.** Nothing about the holder is
  stored, so either side can be corrected afterwards. The suggestion is the holder's nearest reading **at or
  before** the date — back-dating must not subtract a body weight from the future.
- **The deck badge is a count of readings, not a weight.** A kg figure needs a designated self profile and
  the module seeds none; a delta would need a sentinel for "no reading yet", and `-1` is a good delta.
- **Deleting a profile takes its readings with it, and the undo entry is built in the command.**

**The astro pages**

- **Two read-only pages off a profile, with no slice of their own.** `/vitals/profile/:id/zodiac` and
  `/iching` derive everything from one date and dispatch nothing, so the date is a `linkedSignal` over
  `birthDate`: seeded once the store hydrates, then freely editable. That is what makes "check someone who
  has no profile" cost nothing — the edit dies with the page.
- **The sun sign is DERIVED from the date, and the profile stores one anyway.** The redundancy is the point:
  a cusp birth and a sidereal reader both want to overrule the table. The date is truth *on the page*, the
  field is the override, and the page prints the stored value only where the two disagree.
- **The ascendant is the inverse — it cannot be derived at all.** It needs a birth time and place, neither
  stored, so it is a plain select and it VANISHES under any date other than the profile's own birthday.
- **`birthDate`, `sun` and `ascendant` shipped without a rung** — all three optional and additive.
- **Two timelines, because "now" has two scales.** The season triple turns over monthly and is built from
  START dates alone, so no row can disagree with its neighbour about a boundary; the world ages are a fixed
  table where today only marks a row.
- **The world-age table is an ESTIMATE and the page says so** (`vitals.astro.age-estimate`). Year 0 belongs
  to no age deliberately — the era labels have no year zero to print.
- **The Ki year turns on 4 February, which is why the page takes a date and not a year.** The number descends
  by one and wraps 1 → 9; digit sums are congruent mod 9, so one modulo over a fixed anchor year says the
  same thing as "eleven minus the digit sum" and lands straight on the table index.
- **The Nine Star Ki reading is content, not data** — `marker(...)` keys in `astro.consts.ts`, so a sixth
  facet is one column in one table.
- **TWO digit sums, deliberately never folded into one.** The Ki star reduces the *year* and subtracts from
  eleven; the life number reduces the *whole date* (1980 → Ki 2, 1980-08-05 → life 4). Two panels, neither
  borrowing the other's trigram, element or personality table. The life number reduces all the way to 1–9;
  numerology's master numbers are not kept apart, which the page states rather than hides.

**The browse tree**

- **Browsing is its OWN route tree under `/vitals/browse`, not a second selection on the reading pages.** The
  cheap implementation — tap Scorpio, set the date to 1 November — destroys what the reading pages are for.
  A separate tree cannot collide with the date, so `zodiac.page.ts` and `iching.page.ts` were not touched.
- **The selection lives in the URL, so a reading can be sent.** `/browse/iching/:number` and
  `/browse/zodiac/:sign` each give a deep link, a working platform back and a title per reading.
- **An unknown parameter is a page saying so, never a guard.** `hexagramNumbered` and `zodiacSignNamed`
  answer `undefined` and the page paints `app-empty-state` with its return row.
- **Both catalogs are CYCLES, so stepping has no edge case.** `cycle` leans on `Array.prototype.at` taking a
  negative index.
- **Only the two catalogs with 12 and 64 entries earn a detail route.** A Ki star and a life number fit their
  own index. The 64-row index is a plain `@for` grid, not an `ItemList` — the shared machinery is
  NgRx-backed and a static catalog has nothing to add, sort or delete.

**The coin oracle**

- **The cast holds no slice and survives no navigation.** An oracle you could reload back into is not one you
  threw. Leaving it out of the store is the feature.
- **The King Wen table was GENERATED and checked, not typed.** A wrong row yields a real hexagram, just the
  wrong one. Three invariants pin it in `hexagram.utils.spec.ts`: the patterns are a bijection onto all
  six-bit words, fourteen anchors hold (the eight doubled trigrams plus 11/12 and 63/64), and every King Wen
  pair is its partner's vertical REVERSAL — or its complement, for the eight that read the same upside down.
- **The glyph is derived from the number, never stored** — Unicode's ䷀..䷿ block runs in King Wen order, so
  the character is `0x4DC0 + number - 1`.
- **One line value carries two facts, read by two predicates.** A three-coin sum of 6..9 encodes yang in its
  PARITY and "changing" in being 6 or 9. `isYangLine` and `isChangingLine` are separate functions over that
  one number rather than two stored booleans that could disagree.
- **The judgement is Wilhelm's German, and the English is OUR rendering of it — labelled as such.** Wilhelm
  died in 1930, so his German has been public domain since 2001. Legge's 1882 English is public domain too
  but is not obtainable clean (the Wikisource transcription stops at hexagram 31; the complete scan is OCR
  that bleeds footnotes into the body). `vitals.iching.source` says so on the page. Two datasets found while
  looking claimed Legge or public-domain Wilhelm and actually shipped **Baynes** (in copyright until ~2048)
  — **verify a claimed translation against a known phrase before trusting it.**
- **Only the judgement, not the line readings.** Per-line readings are 384 more strings for a screen already
  at three panels, and the changing lines are already named by number and marked in the drawing.

**Pills**

- **A pill's `slot` is a block of eight OS notification ids, and `nextSlot` only counts up.** The OS keys a
  notification by one integer while a pill needs up to seven. Never reusing a freed slot costs one integer
  and removes the need to establish that no cancel and schedule can race over one id.
- **The reminder effect reconciles the whole domain, not the pill that moved.** An effect runs after the
  reducer, so a deleted pill's ids cannot be read back off state. `nextSlot` bounds the sweep. That one path
  also covers a weekday being unticked, a profile rename changing the body, and an undo.
- **`weekdays` is ISO (Monday 1), never the plugin's `Weekday`.** Capacitor numbers from Sunday; that enum is
  a runtime import and a dependency's detail, and this shape is persisted. Conversion happens at the platform edge.
- **An intake is a fact about a day, so it is a separate collection keyed by `(pillId, takenOn)`** — not a
  field on the pill, which would leave yesterday's tick reading as today's. "Taken today" is a comparison
  against `TodayService.today`, so the daily reset needs no timer and no midnight action.
- **Both switches live in the edit dialog, not the row.** No list row in this app carries a toggle, and a row
  owning the taken-tick would have to answer "taken when" on every render. It also keeps R5 free.
- **Pills match on the id, like readings, but for the neighbouring reason** — their uniqueness rule is scoped
  to one profile, so two profiles may each hold an "Ibuprofen".
- **One person is the go-to profile, and the sole person holds that by DERIVATION.** The star is a radio, not
  a checkbox: `withSoleFavorite` clears every other row in the reducer, so "only one" is an invariant of the
  state. Nothing is written when there is one person — `favoriteAmong` falls back to them — which is what
  makes the flag additive on a slice real users hold.
- **The fallback stops at routes that name no profile.** `/vitals/iching` and `/iching/cast` read it;
  `/vitals/profile/:id` and its children deliberately do NOT — a stale id must render nothing, never quietly
  render somebody else's readings.

## DAILY RUN — ritual

- **There is no streak.** A lifetime total and a seven-day dot row; no counter a gap sets to zero. A streak
  protects an asset for someone already consistent and manufactures one to destroy for someone who is not —
  and the second is who this is for.
- **Completions are an append-only log, never a stored count** — the total, "is today closed" and every date
  statistic are selectors. A bonus completion is just another row.
- **The reminder is a cron the OS owns and will nudge on days already finished.** The cron branch re-arms
  itself, so today's occurrence cannot be suppressed. The right way to be wrong: a redundant nudge costs a
  glance, a reminder that quietly stopped costs the habit. Hence neutral wording.
- **It is `ritual`, not a page inside `tasks`** — `tasks` means `TaskItem`, with categories, an edit dialog
  and a sort. A prompt catalog and a completion log share none of that state.
- **The catalog lives in the translation bundle** — ~100 prompts, ~7.5 KB on a 31 KB boot fetch, keeping
  de/en in lockstep. **Past ~250 entries**, copy the emoji catalog's per-language dynamic imports.
- **Adjacency is the complaint, not recurrence** — the draw excludes the last twenty *distinct* completed
  prompts, bounded by count rather than a day window, and falls back to the whole catalog when the pool
  would empty.
- **A prompt can be dismissed for good.** *Not for me* is deliberately not a rating, a snooze or a per-day
  skip, and it ships with two ways back because `ion-toast` is `role="status"`.
- **Every prompt passes one test: it cannot be half-done.** "Put one book back" has a moment it is finished;
  "tidy the shelf" does not. The three-minute ceiling is a proxy for that property, not a rule.
- **The card commits in place, and must never become a button.** As a button its accessible name would be the
  task text, so it would announce *"…, button"* without saying what pressing does — and the largest target
  on screen would commit the day.

## SIGIL — notes

- **One note type, never two.** "Image note" and "text note" would need a discriminator, a convert action and
  a branch in every renderer, to describe "this one has no body". The distinction is in the CREATE
  affordance, not in the data.
- **`items` is one array and the two sections are a partition of it.** Pinning is a one-field change, never a
  move between collections, and a reorder writes a section's new order back into the slots it already
  occupied. It REFUSES an order shorter than its section — exactly what a drag under an armed search sends.
- **The editor has no save button.** Every keystroke is a candidate write and a write serialises the whole
  slice, images included, so the facade debounces and flushes on destroy. Destroy is why the note id is
  captured on the way IN: by teardown the router has moved on and a route-derived note reads as undefined.
- **A picked image is re-encoded to a 1600px JPEG before it is stored.** The budget is about the write: the
  whole slice is rewritten on each save, so one untouched camera photo would be paid for again on every
  keystroke of the body beneath it.
- **Reorder is pointer-only, a known R5 gap.** Here it is cosmetic — every note stays reachable, searchable
  and openable without a drag — where in `cash-rules` the same gap sits on a *semantic* order.

## SOYKAF — the recipe book

Everything below the first entry is **v2.0.0 scope**.

- **The check is presence-only** ("in storage" / "missing"), never "you are 200 ml short" — storage counts
  packages while a recipe asks for a measure. That constraint shapes everything below.
- **Cook → subtract** ingredients from storage, missing ones pushed into `_shopping`. A product decision: it
  makes cooking mutate stock.
- **Base unit on `Product` + pack sizes.** Open **only if presence-only proves too weak**: making
  `StorageItem.quantity` a base-unit amount pools distinct packs into one number and so **destroys per-pack
  `bestBefore`**. Half the schema exists (`unit`, `packaging`, `packagingWeight?`, unread by the matcher).
- **Recipe photos** have a place to live: `notes/data/note-image.store.ts` keys each picture on its own and
  keeps the slice text-only. What is left is generalising it past notes — the store, its resolver and its
  collector are note-shaped.

## The deck

- **A cold install ships an empty deck** — no entry listed, one `@empty` node pointing at `/commlink/deck`.
  The curated four it replaced re-opened "does this one belong in the default?" for every new feature, a
  question with no checkable answer. Empty is a rule instead of a list. **No entry is ever added back as a
  special case.**
- **The deck stores what is VISIBLE, and absence means HIDDEN.** Held the other way round, "a cold install
  ships an empty deck" was a RULE in the prose and a LIST in the code. Three things fall out of the polarity:
  an entry nobody has seen arrives OFF, renaming an id can no longer switch a program on for everyone, and
  `initialDeck` is `[]`.
- **Legal only because nothing is stranded — re-check before any entry claims to be reachable "from the
  deck".** Two unconditional entrances: the drawer's static `/settings` button and the grid's `@empty` link.
- **Past 992px the drawer stays open as a pane, and Ionic's own default is the breakpoint.** `when` is
  deliberately unwritten — `lg` IS Ionic's default, and a copied default can silently diverge. The page
  header needed no edit (an `ion-menu-button` hides itself once its menu sits in a visible pane), and
  `[autoHide]="false"` on the three `ion-menu-toggle`s is Ionic's documented override for the same rule,
  which otherwise blanks every row the pane exists to show. The width is **300px measured, and
  `--side-max-width` is the property that sets it** — Ionic's default for it is `28%`, which is what made the
  pane 392px at 1400, so `--side-width` is not the knob it reads like.
- **The catalog's glyph reaches the page header through a token, and the header keeps `icon` as an
  override.** `@shared/ui` may import no domain, so the header cannot read `DECK_CATALOG` however it is
  shaped. `PROGRAM_ICON` is the port (`@shared/util`, empty-defaulted); `commlink/data` fulfils it as the
  longest catalog route prefixing `selectUrl`. `DeckIcon` is `keyof typeof DECK_ICONS`, so a catalog entry
  cannot name a glyph nobody registered. Consequence accepted: a page inside a program wears the program's
  glyph, so adding a route to the catalog changes a header with no edit to that page.
  **The override survives in exactly one shape — a component rendered under a route the catalog does not
  cover.** The I Ching pages are the case: `/vitals/iching` and `/cast` are entries, their
  `/vitals/profile/:id/…` twins are not. Picking a different glyph cannot fix it — the disagreement is
  between two ROUTES.
- **The config page is a program too, including the right to switch itself off.** Switching it off cannot
  strand it — the drawer's `/settings` button is unconditional, and SYSOP carries the link directly under its
  three pickers. It ships OFF like every other entry.
- **The module axis is a bulk ACTION, never a second gate.** The group header switches its children and reads
  its state back from them, so `visibleEntries` stays the only stored answer. A module of one renders no
  group at all.
- **Grouping and ordering are two questions, so the config page has two lenses.** `ion-reorder-group` needs a
  flat list and `DeckState.order` is global; nesting the drag would force a module's programs to stay
  contiguous, splitting the page by on/off would scatter a module across two sections. An `ion-segment` picks
  between **programs** (grouped, default) and **order**. The lens is component state, never persisted.
- **The order lens lists only what is ON.** A hidden entry's position is unobservable. `ion-split-pane` is
  what makes the drag worth keeping — the drawer beside it renders the same list in the same order, so a drag
  is watched live. **This is the one list on the page that can be empty**, hence `app-empty-state` where the
  catalog beside it never can.
