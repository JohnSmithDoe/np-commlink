# CREDSTICK — cash

Settled decisions for this domain — do not re-flag as work. Cross-cutting decisions are in
[decisions.md](../decisions.md); blocked work in [state.md](../state.md); the next major's scope in
[next-version.md](../next-version.md).

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
- **An imported booking is not deletable; a typed one is.** A row is recognised by statement content, so
  nothing distinguishes "deleted on purpose" from "not imported yet" and a delete plus a re-import brought
  it back — the alternative being a tombstone store keyed the same way the rows are. A manual row has no
  import identity, so nothing can resurrect it and its delete is safe. The veto is `canDelete` on the row
  (`source === 'manual'`), which removes the swipe reveal rather than leaving a dead button; the correction
  path for a wrong imported row is the edit dialog. A reconciled manual leg is not reachable either — it
  carries `matchedTxnId` and the selector hides it, leaving the imported survivor on screen. The pending
  half needs nothing: a row carries its derived key as well as the bank's, so a `PDNG` entry arriving again
  under the `AcctSvcrRef` it gained when it booked confirms the stored row in place (`plan-import.ts`).
- **`importKey` stays optional on `CashTransaction`.** Expressing "required only when `source` is
  `imported`" needs a split union that eleven unrelated call sites would have to narrow, for a fact the
  import path already guarantees at the only place it matters.

## Traps that do not reproduce from a read of the source

- **Import dedup keys on the `YYYY-MM-DD` prefix only** — `dateISO` carries a local offset, so keying the
  full string re-imports the whole batch after a DST change.
- **A parse returns `{ rows, rejected }`**, never a bare array: a partial import reporting success leaves
  the balance wrong with nothing to notice it by.
- **Reconciliation never auto-merges** — an equal-amount coincidence (two identical fares) would corrupt
  the ledger. Reconciled-away legs are excluded from balances or the spend double-counts.
