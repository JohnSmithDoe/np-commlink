# BIOMON — weight and pills

Settled decisions for this domain — do not re-flag as work. Cross-cutting decisions are in
[decisions.md](../decisions.md); blocked work in [state.md](../state.md); the next major's scope in
[next-version.md](../next-version.md).

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

## BIOMON — the astro pages, and one date they all hang off

- **Two read-only pages off a profile, with no slice of their own.** `/vitals/profile/:id/zodiac` and
  `/vitals/profile/:id/iching` derive everything from one date and dispatch nothing, so the date is a
  `linkedSignal` over the profile's `birthDate`: seeded once the store hydrates, then freely editable.
  That is what makes "check someone who has no profile" cost nothing — the edit is page-local and dies
  with the page.
- **The sun sign is DERIVED from the date, and the profile stores one anyway.** Two spellings of one fact
  is normally a smell; here the redundancy is the point, because a cusp birth and a sidereal reader both
  want to overrule the table. The date is the source of truth *on the page*, the field is the override,
  and the page prints the stored value only where it disagrees with the date in the box.
- **The ascendant is the inverse — it cannot be derived at all.** It needs a birth time and a place,
  neither of which is stored, so it is a plain select and it VANISHES under any date other than the
  profile's own birthday. A stranger's sign beside this profile's ascendant is the one answer that would
  be wrong rather than merely absent.
- **`birthDate`, `sun` and `ascendant` shipped without a migration rung.** All three are optional and
  additive: a profile written before them reads back with three `undefined`s and every selector already
  tolerates that. The roster of who holds what, and when the question stops being free, is in
  [CLAUDE.md](../../CLAUDE.md).
- **Two timelines, because "now" has two scales.** The season triple — previous, current, next sun sign —
  turns over monthly and is built from START dates alone, so no row can disagree with its neighbour about
  where the boundary is; the world ages are a fixed table where today only marks a row.
- **The world-age table is an ESTIMATE, and the page says so.** 2150 years per age with Pisces at
  1..2150 CE. There is no consensus — schemes differ by centuries and some put Aquarius already underway
  — so `vitals.astro.age-estimate` prints the caveat rather than letting the table imply a source. Year 0
  belongs to no age deliberately: the era labels have no year zero to print.
- **The Ki year turns on 4 February, which is why the page takes a date and not a year.** A January
  birthday carries the previous year's star. The number descends by one and wraps 1 → 9, which the
  classic rule spells as "eleven minus the digit sum" plus a per-century variant; digit sums are
  congruent mod 9, so one modulo over a fixed anchor year says the same thing and lands straight on the
  table index — nothing has to defend a 1-based number twice.
- **The Nine Star Ki reading is content, not data.** Nine numbers × name, element, personality, strength
  and shadow are `marker(...)` keys in `src/app/vitals/model/astro.consts.ts`, so the wording is
  translated rather than composed and a sixth facet is one column in one table.
- **TWO digit sums, deliberately never folded into one.** The Ki star reduces the *year* and subtracts
  from eleven; the life number reduces the *whole date*. Same input, different systems — 1980 gives Ki 2
  while 1980-08-05 gives life 4 — so they are two panels and neither borrows the other's trigram,
  element or personality table. Feeding a full-date sum into the Ki table would attach meanings Nine
  Star Ki never assigned to it. The life number reduces all the way to 1–9; numerology's master numbers
  (11, 22) are not kept apart, which the page states rather than hides.

## BIOMON — the browse tree, beside the reading pages rather than inside them

- **Browsing is its OWN route tree under `/vitals/browse`, not a second selection on the reading pages.**
  The cheap implementation — tap Scorpio, set the date to 1 November — destroys what the reading pages are
  for: your own sign leaves the screen the moment you look at somebody else's. A separate tree cannot
  collide with the date at all, so `zodiac.page.ts` and `iching.page.ts` were not touched, and no
  `linkedSignal`, profile or slice reaches the catalog pages.
- **The selection lives in the URL, so a reading can be sent.** `/vitals/browse/iching/:number` and
  `/vitals/browse/zodiac/:sign` each give a deep link, a working platform back and a title per reading —
  which a signal would have lost on refresh. A hexagram is exactly the kind of thing worth sending to
  somebody, and the pages are read-only, so there is nothing a URL can desynchronise.
- **An unknown parameter is a page saying so, never a guard.** `hexagramNumbered` and `zodiacSignNamed`
  take the raw string and answer `undefined`, and the page paints `app-empty-state` with its return row.
  A guard would need a route entry and a redirect target to argue about; this needs neither, and
  `/browse/iching/99` reads as an answer rather than a bounce.
- **Both catalogs are CYCLES, so stepping has no edge case.** Hexagram 1's previous is 64 and Capricorn's
  next is Aquarius. `cycle` leans on `Array.prototype.at` taking a negative index, so the wrap is the
  language's rather than an arithmetic that has to be re-read.
- **Only the two catalogs with 12 and 64 entries earn a detail route.** A Ki star and a life number are
  two paragraphs that fit on their own index, so they are flat tables. The 64-row index is a plain `@for`
  grid, not an `ItemList` — the shared list machinery is NgRx-backed and keyed on a slice, and a static
  catalog has nothing to add, sort or delete.
- **The deck entry is what makes it reachable, and costs nothing to add.** `visibleEntries` means absence
  is HIDDEN, so `browse` is off for every existing install until one tap switches it on — see
  `deck.reducer.ts`'s banner. No rung, and no program appearing unasked.

## BIOMON — the coin oracle

- **The cast holds no slice and survives no navigation.** It is the only thing in BIOMON not derived
  from stored data, and an oracle you could reload back into is not one you threw. Leaving it out of the
  store is the feature, not an omission.
- **The King Wen table was GENERATED and checked, not typed.** 64 rows of six-bit patterns is exactly
  where a transcription error hides silently — a wrong row yields a real hexagram, just the wrong one,
  and no test that does not know the table can see it. Three invariants pin it: the patterns are a
  bijection onto all six-bit words, fourteen anchors hold (the eight doubled trigrams plus 11/12 and
  63/64), and every King Wen pair is its partner's vertical REVERSAL — or, for the eight hexagrams that
  read the same upside down, its complement. `hexagram.utils.spec.ts` re-checks all three, so the table
  cannot be edited back into a plausible wrong state.
- **The glyph is derived from the number, never stored.** Unicode's ䷀..䷿ block runs in King Wen order,
  so the character is `0x4DC0 + number - 1` and no row carries a glyph that could drift from its own
  number.
- **One line value carries two facts, read by two predicates.** A three-coin sum of 6..9 encodes yang in
  its PARITY and "changing" in being 6 or 9. `isYangLine` and `isChangingLine` are separate functions
  over that one number rather than two stored booleans that could disagree, and the transformed hexagram
  is the same bottom-to-top walk with `afterChange` swapped in — so the two readings cannot diverge on
  how a line becomes a bit.
- **The judgement is Wilhelm's German, and the English is OUR rendering of it — labelled as such.**
  Richard Wilhelm died in 1930, so his German has been public domain since 2001 (life + 70); the text
  was taken verbatim from a full-text host and cross-checked hexagram by hexagram against the titles
  already shipped. Legge's 1882 English is public domain too but is not obtainable clean: the Wikisource
  transcription stops at hexagram 31, and the complete 1882 scan is OCR that bleeds page footnotes into
  the body and mangles the romanised names. So `en.json` carries a translation of the SAME German rather
  than a text wearing Legge's name, and `vitals.iching.source` says so on the page. Two datasets found
  while looking both claimed Legge or public-domain Wilhelm/Baynes and actually shipped **Baynes**
  (in copyright until ~2048) — verify a claimed translation against a known phrase before trusting it.
- **Only the judgement, not the line readings.** A cast produces up to six changing lines, each with its
  own text in Wilhelm; the page shows the hexagram's own judgement and the transformed hexagram's. Adding
  the per-line readings is 384 more strings for a screen already at three panels, and the changing lines
  are already named by number and marked in the drawing.

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
- **One person is the go-to profile, and the sole person holds that by DERIVATION.** The star is a
  radio, not a checkbox: `withSoleFavorite` clears every other row in the reducer, so "only one" is an
  invariant of the state rather than a rule the UI is trusted to keep. Nothing is written when there is
  one person — `favoriteAmong` falls back to them — which is what makes the flag additive on a slice
  real users hold, and why the star renders only once a second person makes it a choice.
- **The fallback stops at routes that name no profile.** `/vitals/iching` and `/vitals/iching/cast` read
  it, and the coin oracle can live outside a profile because it holds none: `iching-cast.page.ts` says
  the cast survives no navigation. `/vitals/profile/:id` and its children deliberately do NOT fall back
  — a stale or wrong id must render nothing, never quietly render somebody else's readings.
