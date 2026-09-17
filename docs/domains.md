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
  booking timestamp plus a counter (stable across exports), or a sequence assigned when the _file_ was
  generated (not stable, which would make every re-import duplicate the statement). **Falsifying it costs
  two minutes:** export one date range twice and diff the references. If they differ, the derived key
  becomes primary and the reference a tiebreaker.
- **One key space, no branch.** A key that is _sometimes_ present forces every consumer to hold two notions
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
  `requireUniqueName` over the profile's own readings _is_ the "one reading per profile per day" rule. What
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
  a cusp birth and a sidereal reader both want to overrule the table. The date is truth _on the page_, the
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
- **TWO digit sums, deliberately never folded into one.** The Ki star reduces the _year_ and subtracts from
  eleven; the life number reduces the _whole date_ (1980 → Ki 2, 1980-08-05 → life 4). Two panels, neither
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
- **Adjacency is the complaint, not recurrence** — the draw excludes the last twenty _distinct_ completed
  prompts, bounded by count rather than a day window, and falls back to the whole catalog when the pool
  would empty.
- **A prompt can be dismissed for good.** _Not for me_ is deliberately not a rating, a snooze or a per-day
  skip, and it ships with two ways back because `ion-toast` is `role="status"`.
- **Every prompt passes one test: it cannot be half-done.** "Put one book back" has a moment it is finished;
  "tidy the shelf" does not. The three-minute ceiling is a proxy for that property, not a rule.
- **The card commits in place, and must never become a button.** As a button its accessible name would be the
  task text, so it would announce _"…, button"_ without saying what pressing does — and the largest target
  on screen would commit the day.

## AGENDA — tasks

- **The cadence decides whether an anchor exists; the task decides which one.** `Interval` is a union of
  calendar-positioned arms (`weekdays`, `months`) and one elapsed arm (`every` + `unit`). A positioned
  cadence names its own next occurrence, so `anchor` is neither stored nor offered for it — the edit
  dialog renders the control off the arm, which is why the union is worth more than optional fields.
  **A due date is the second gate**: with none, `seedFor` falls back to the close whichever anchor is
  set, so both chips would do the same thing and neither is shown.
- **A repeat needs no due date — the close is the anchor.** `seedFor` seeds from `now` when `dueAt` is
  absent, so "every 3 days" starts counting the first time it is ticked off, which is the whole point of
  the maintenance case. What was missing was not the behaviour but the EVIDENCE: until its first close
  such a task has no date and no status colour, so the row said nothing and the cadence looked broken.
  The row states the cadence **whenever there is one**, beside the date rather than instead of it —
  "Fällig am 21.07. · Am Montag, Dienstag" answers when AND how often, and reading the rhythm off the
  list is worth the second fact. It comes from the same `intervalSummary` the picker writes under its
  own control, so an incomplete cadence says so on the row too.
- **`dueAt` is the reader's entry and the app never writes it; `nextDueAt` is where the schedule moves.**
  One field doing both jobs meant a date somebody typed was silently replaced by a computed one, and
  after the first close the entry was unrecoverable. Every read goes through `nextDueOf`, which falls
  back to `dueAt` — that fallback is why tasks written before the split answer correctly and **no rung
  beyond the existing one is owed**. Closing writes only `nextDueAt`; **editing either input in the
  dialog discards it**, because a date derived from a cadence the reader has just replaced is a date
  nothing stands behind. Changing the due date writes both, changing the cadence resets `nextDueAt` to
  `dueAt`, and the next close recomputes from there. The shared list comparator reads a raw key
  and cannot fall back, so the sort moved to `nextDueAt` and the rung backfills it onto every dated
  task, not only the recurring ones.
- **A monthly cadence keeps the day the reader chose, because `dueAt` still holds it.** A month added to
  the 31st lands on the 28th, and a month added to THAT keeps the 28th for good — so each step re-applies
  `dueAt`'s day, clamped to the month it lands in: 31 Jan → 28 Feb → **31 Mar** → 30 Apr. CREDSTICK pays
  for the same fix with a `dueDay` field beside its date (`schedule.types.ts`); AGENDA needs no second
  field because the split already keeps the entry. It is excluded for `week`, where a day number means
  nothing and applying it drags the date bodily across the month.
- **Rolling forward is one loop with one exit: the first date after today.** Both anchors feed the same
  advance; only the seed differs — `dueAt` for an obligation, `doneAt` for maintenance. Completion
  anchoring can never land in the past, so the loop is a no-op there, and the same code covers both.
- **A seed already in the future is the answer, not a starting point, and that is what makes advancing
  idempotent.** Closing a due-anchored task twice used to step twice — the second close read the date
  the first one wrote, an occurrence that has not happened, and walked past it — so a stray tick and
  untick pushed the schedule out a whole interval and three of them pushed it three. Nothing can tell a
  correction from doing the task again, so closing must land on the same date however often it runs.
  Completion anchoring was never affected: its seed is the clock, not the stored date.
- **A lead can pull a task open earlier, never earlier than the day after it was closed.** Without that
  clamp a lead wider than the gap to the next occurrence re-opens the task the instant it is closed, and
  ticking it off does nothing: "Tue and Wed" closed on Tuesday is due Wednesday, and a two-day lead opens
  it on Monday — a date already gone. The clamp cannot overshoot, because the next occurrence is always
  strictly after the close, so `doneAt + 1 day` is never past `dueAt`.
- **The lead row never clears, because "on the day" IS its neutral state.** An absent `lead` and a lead
  of zero days open the task on the same date, so a clear button offered a second spelling of the first
  chip — and a new task, seeded with no lead, showed an empty row that was quietly already behaving as
  "on the day". The dialog reads `lead ?? ON_DAY_LEAD`, so one chip is always lit and the stored shape is
  untouched: `undefined` still means on the day. `app-option-chips` therefore has no clear affordance at
  all and emits `T` rather than `T | undefined`; `app-number-select` keeps its own, because a priority
  genuinely has no neutral value to fall back to.
- **The lead CHIPS are capped by the same rule, so the clamp is a floor nobody reaches.** `leadOptionsFor`
  offers nothing whose worst reach is not shorter than the cadence's widest gap — five days for "Mon and
  Tue", one for "Mon, Wed, Fri, Sun", none at all for a chore on every weekday. Two things follow that are
  easy to mistake for bugs: **the chip row changes length when you change the cadence**, and a weekday
  cadence enumerates its days where the longer units read a ladder. Leaving the clamp as the only guard
  was the version that shipped first, and it is the worse one — the chips were all still offered, and
  picking any of them did the same thing as picking the one beside it.
- **The lead time and the amber window are the same shape and must not be merged.** Both scale to the
  cadence, and `warnDaysBefore` already derives one. They differ in consequence: amber paints a task the
  user can see, the lead MOVES it out of DONE. A task can want to go red a fortnight out and re-arm the
  morning it is due, so one value cannot serve both.
- **Re-arming is triggered twice and polled never.** The condition is derivable — open when
  `now >= next occurrence - lead` — so nothing records that an occurrence was handled and a check that
  never ran costs nothing. `reopenDueTasksResolver` covers ARRIVING: it sits on the `list` CHILD route,
  so the parent's hydration resolver has already run (Angular resolves a parent's before a child's) and
  the row is in OPEN on the first paint. `tasksDayRolloverEffects` covers STAYING, off `TodayService` —
  on a phone the common path is resume, not reload, and its signal holds an ISO day, so resuming on the
  same day emits nothing and only a real rollover reaches it. A minute timer was declined for the one
  case those two miss between them, which is none; an effect on `routerNavigatedAction` was declined
  because it fires after `NavigationEnd`, painting the row in DONE and then moving it.
  **Pattern: level-triggered beats edge-triggered wherever the condition is derivable** — the trigger
  stops being a correctness question and becomes a latency one, so it can be as cheap as you like.
- **Anything reading "today" reads `TodayService`, never `dayjs()`.** The list's status colours are
  computed in the template off its signal, so a page left open across midnight repaints itself instead
  of holding yesterday's verdict. `task.utils` still takes `now` as a parameter — the clock is injected
  at the edge, which is also what lets the specs pin dates.
- **`closings` is capped and never pruned by age.** A daily chore closed for two years is 730 entries on
  a slice loaded at boot, so the log keeps its most recent entries and drops the oldest — a bound the
  reducer applies, not the view. Age would make the cap depend on the cadence.

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
  and openable without a drag — where in `cash-rules` the same gap sits on a _semantic_ order.

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

## TRACKPLAY — the dice pool and the board

- **The game page addresses its game by id, not through the route.** Every other drill-down reads
  `selectRouteEntityId`, which is what makes those views memoized selectors instead of factories a
  component re-creates. The game page is the exception on purpose: `IonicRouteStrategy` keeps a visited
  page mounted and re-entering mounts a second one, so a route-scoped selector would repaint the LEAVING
  game's table with the arriving game's rows while it slides away. The id is read once from the snapshot,
  which is a fact that never moves under the page — the same argument `PROGRAM_CONTEXT` is built on.

- **The table is stored and the throw is not.** A setup is configuration you rebuild every session
  otherwise; a result you could reload back into is not one you threw — the same split the I Ching cast
  makes. So `TrackplayState.dice` holds the table and the `PoolRoll` lives in the page, dying with it.
  Clearing the table clears the last throw with it: the thing that produced it is gone.
- **A bag and a table, so `dice` is a FLAT list and never a count.** Three d6 is three taps on the d6
  in the bag and three dice on the table, each tapped back individually — which is why the stored array
  holds one entry per die and is kept SORTED on insert: equal dice sit together, and the index the UI
  emits is then the die the reader meant. A `{faces, count}` pair would have to be re-derived into
  targets anyway, so it exists only where it reads: `tallyDice` builds `4W6 + 1W20` for display.
- **No modifier, no per-die readout — the throw answers with one number.** Both were built and both
  were noise against a table you can already see: the dice show their own faces, so a breakdown line
  restated them, and a `+N` field is arithmetic the reader was going to do anyway. The button sits
  ABOVE the table so a throw needs no scroll, which is also why the tray renders nothing at all until
  there is a roll.
- **`rollPool` is pure and decides everything before the first frame.** The tray animates a known
  outcome — its scramble is a function of a tick counter, never a second random source — so what the
  dice settle on is assertable without waiting on an animation.
- **Seven silhouettes are drawn, not registered.** Ionicons ships one `dice` glyph and a pool needs
  d4..d100 told apart at a glance. Each is the die from above: outer polygon, the face turned to the
  reader, and the number inside THAT face, which is why every shape carries its own baseline. Unrolled,
  a die shows its own face count, so one component labels the editor and the tray.

### The board

- **A piece does not walk the ring, it walks ITS OWN lap.** Distance is counted from the player's own
  start, so `travelled + pips` decides everything: below the lap length the piece is still on the ring,
  at or above it the overflow IS the home slot. Turning in therefore needs no separate rule, and the
  count into home being exact falls out of the same arithmetic rather than being enforced beside it.
- **Every rule the walk consults is DATA.** What roll frees a piece, whether home takes an exact count,
  whether own pieces block or stack, whether landing throws — all of it is `BoardRules`. Mensch ärgere
  Dich nicht is one filling of that shape; Pachisi and a house rule are others, and none of them needs a
  second engine. It is also why turn order can be added later as more of the same (parked in
  [next-version.md](./next-version.md)) rather than as a rewrite.
- **The track is the only common ground.** A yard and a home column belong to the player whose colour
  they carry, so a figure may stand on any track field and on nobody's private ground but its own. One
  rule, and every way onto the board is made to ask it: the tap, the yard button, and a pasted setting
  alike.
- **A figure's identity is which `(player, piece)` pair is missing, not how many stand.** Deriving it
  positionally held only while placement ran in order, so an imported setting could mint a duplicate that
  no `@for` track key and no move could tell apart.
- **A field is named by WHOSE stretch of track it is** (`p1-p2f3` — player 1's figure on field 3 of
  player 2's stretch). The ring is cut into one sector per player, so an offset within a sector is a name
  read off the board without counting from a fixed origin. The actor leads because a field name alone
  cannot say who is standing there. Players count from 1 and fields from 0; `h` is the home column and
  `b` the yard, without which leaving the yard and finishing are the two moves that could not be written.
- **The three `removeItem`s and the two restores live ONLY in `trackplay.reducer.ts`.**
  `combineReducers` returns the IDENTICAL state when no sub-reducer changed anything, so the cascade sees
  the pre-action slice if and only if no per-aggregate reducer claims that action. Add one to an
  aggregate and the cascade silently starts reading POST-delete state — neither the compiler nor a
  per-aggregate spec notices. `setRoundValue` is the deliberate opposite: the aggregate writes the round
  and the cascade then stamps `lastPlayedAt`, which wants the post-write game.

## COPROCESSOR — calculator, converter, golden section

- **The first domain that owns nothing.** No slice, no facade, no `data/` and no barrel; every value is a
  component signal and a reload starts cold. `handbook` and `geist` established that a domain may skip the
  store; this one also skips the service. The e2e asserts the emptiness after a reload, because every other
  module's suite defends the opposite and a slice added here would pass all of them.
- **Three catalog entries, one folder.** `calc`, `units` and `golden` are separately switchable programs, and
  because `programSiblingsFor` derives the bar from routes one segment below the mount, the same three
  entries _are_ the tab bar. A page one segment deeper would be a stack inside its tab, which is why the
  golden screen's two views are an `ion-segment` and not routes.
- **The unit table is affine, and the defaults are foreign.** One formula, `value * factor + offset`, covers
  ratio and temperature alike. Each quantity opens on a foreign unit converted into the metric one —
  centimetres into metres is mental arithmetic, pounds and Fahrenheit are what a converter is opened for.
  Every factor is pinned by a spec against its _definition_ (a mile is 8 furlongs) rather than restated.
- **`humanize` reads only the ladder it is handed.** Given a whole quantity it will answer 320.000.000 m in
  nautical miles, because nmi has the larger factor and is still "readable". A ladder is a curated scale, not
  a unit list, so the money mode passes metric rungs and the converter never calls it at all.
- **Money is scale intuition, not currency.** A stale exchange rate is a wrong answer that looks right, so
  currency stays out; the references that _do_ drift carry their year in the visible label instead. Every
  number a reader sees is interpolated from the field the calculation divided by — a rate typed into a
  translation string is the same silent wrongness arriving through the bundle.
- **The anchor is half of every money row.** `2,33 Mio km` is a number, `6,1× zum Mond` is the sentence you
  repeat. `pickAnchor` prefers a multiple at or just above 1 and then the largest qualifying rung, which is
  what makes 320.000 km read as the equator rather than as a fraction of the moon. Each family is a ladder
  with no gap wider than 100×, asserted by spec, so the band can never come up empty.
- **Anchors are named for recognition, not correctness** — `die Grenze zum Weltall`, never `die
Kármán-Linie`. A name that costs a lookup is the failure the feature exists to prevent.
- **The spiral is seeded by orientation.** Its subdivision only stays a spiral while each cut alternates the
  rectangle's axis, so the corner sequence starts one step further when the first cut is horizontal. Getting
  this wrong breaks every arc joint in a portrait figure and draws as curves flying out of the frame — it
  shipped that way until a portrait case was added to the spec, which had only ever run landscape.
- **The crossings are the answer, the spiral is the explanation.** Two levels of recursion, both pickable,
  drawn smaller with depth but kept touchable by a transparent stroke. Level one is four points you can
  measure onto a wall; past level two they sit closer together than the thing being placed.

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
  shaped. `PROGRAM_CONTEXT` is the port (`@shared/util`, empty-defaulted); `commlink/data` fulfils it as the
  longest catalog route prefixing the URL the page was ACTIVATED on. It answers the glyph, the way back
  and the module's tabs together, because all three are readings of that one match — and asking it with
  the page's own route rather than "where is the app now" is what keeps a leaving page from answering
  for its successor mid-transition. `DeckIcon` is `keyof typeof DECK_ICONS`, so a catalog entry
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
- **Two switches, and the second is a subset of the first.** `visibleEntries` says whether a program exists
  for the user at all; `hiddenTiles` says only whether it also gets a tile, so a program can sit in the
  drawer with no tile but never the reverse. **Absence in `hiddenTiles` means SHOWN** — the opposite polarity
  to `visibleEntries`, and forced: switching a program on has to put it on the deck. Switching one off clears
  its tile preference, so a re-add never restores a choice nothing on screen still names.
- **The deck itself has no arrange mode, and it is not an omission.** Direct manipulation on the grid is what
  would justify a second surface, and `ion-reorder-group` cannot do it — the gesture is y-only
  ([footguns.md](footguns.md)). Anything it _can_ do is the order lens rebuilt one route away, so ordering
  and tile-visibility both live there and the deck stays a launcher. **A list on the deck is not the
  compromise — it is the duplication.**
- **`commlink` is pinned to slot 0 by `orderEntries`, not by the stored order.** The drawer's first row is
  the way back to the deck, so it cannot be dragged away or sorted behind a program. It is therefore dropped
  from the order lens as well — a row that can be dragged and snaps back reads as a defect.
