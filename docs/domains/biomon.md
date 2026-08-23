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
