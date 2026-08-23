# DAILY RUN — ritual

Settled decisions for this domain — do not re-flag as work. Cross-cutting decisions are in
[decisions.md](../decisions.md); blocked work in [state.md](../state.md); the next major's scope in
[next-version.md](../next-version.md).

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
