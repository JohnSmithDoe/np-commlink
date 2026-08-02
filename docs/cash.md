# cash — CREDSTICK, an offline multi-account ledger

The other features → [features.md](./features.md) · the modal dialogs cash uses →
[dialogs-and-forms.md](./dialogs-and-forms.md).

An offline, EUR, multi-account personal-finance ledger. **Purpose-built** — it deliberately does not
ride the household `ItemList` engine: signed money, opening balances, reconciliation and ordered
filter rules don't map onto a category-bucketed item list. **All phases P0–P5 are complete and on
`main`** (accounts overview, transactions, categories + rules + categorization engine, per-bank CSV
import + reconciliation, transfers + reporting).

**Design principles.** Integer cents, never floats (`…Cents: number`, `< 0` outflow, `> 0` inflow;
formatting to `12,34 €` happens only at the view edge). Offline-first (`npc-cash`, persisted on any
`[Cash]` action). Multi-account: account balance = `openingBalanceCents + Σ signed txn amounts`, net
worth = Σ balances. **Manual override wins** — auto-categorization must never clobber a hand-set
category.

| Type                   | Role                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CashAccount`         | `giro`/`creditcard`/`savings`/`cash`; `openingBalanceCents` as of `openingDateISO`; optional `bank` (`Bank`) selecting the CSV import parser                  |
| `CashTransaction`     | signed `amountCents`; `source`; `status`; `categoryId` + `categoryManual`; `description` (the bank's counterparty + purpose joined — display text and rule-matching text in one, and what the import dedup key is built from); `matchedTxnId`, `isTransfer`, `transferGroupId`, `importBatchId` |
| `CashRule`            | email-style filter: ordered, `match` (`all`=AND / `any`=OR), `conditions[]`, assigns `categoryId`. First match wins                                            |
| `CashFilterCondition` | `field` (`description`/`amount`) · `op` · `value` · `caseSensitive?`                                                                                           |

**Categorization engine.** Rules sort by `order`; the **first** whose conditions match stamps its
`categoryId`. A transaction with `categoryManual: true` is **shielded** — rule re-runs skip it, so a
hand-set category survives future imports and rule edits. The matcher is a **pure function in
`cash/util/`** (`categorize(txn, rules)` + `matchesCondition`), called from both "Apply rules" and
the post-import auto-run — never from a component or effect. For `field: 'amount'` the ops are
numeric (`eq|lt|lte|gt|gte`) against the **signed** `amountCents` (so `lt 0` = outflows) with `value`
parsed by `eurToCents`; string ops are valid for `description` only, and `regex`/`contains` on
`amount` is rejected at rule-save time.

**Money parsing takes the language explicitly.** Display flows through the `moneyEur` pipe →
`formatEur(cents, locale)` — one seam, so a language switch re-localizes everything. Parsing could
**not** be centralized, because the two conventions are mutually ambiguous: `12,34` read as English
is a valid grouped amount (1234 €), so nothing can be rejected and the language is a required
decision at every call site. Two call sites must _not_ follow the UI: a German bank's CSV export is
German whatever the UI says, and a persisted rule threshold is normalized onto German on save so a
switch cannot re-interpret existing rules. `eurToCents` is integer-cent-safe (no float multiply):
strip sign/`€`/whitespace, `.` = thousands and `,` = decimal for `de`, take ≤2 decimal digits,
`cents = sign * (int * 100 + dec)`; empty/NaN/stray separator → `null`.

**Balances are order-independent** — pure sums, no chronological pass; a credit-card balance is
naturally negative and nets correctly. **Reconciled-away legs are excluded**
(`Σ over txns.filter(t => !t.matchedTxnId)`) or the spend double-counts; the same filter plus
`!isTransfer` gates the reporting selectors (`isReportable`). Display order is `dateISO` desc; a
running-balance column, if ever added, must accumulate chronologically ascending with a stable
tiebreak (`dateISO`, `createdAt`, `id`).

**Reconciliation.** A manual card spend is created `status: 'pending'`. Candidates for it: same
`accountId`, **equal** `amountCents`, `dateISO` within **±3 days**, not already matched. The user
confirms — **never auto-merge**, because an equal-amount coincidence (two identical fares) would
corrupt the ledger. On confirm the imported txn survives, the manual leg's `matchedTxnId` points at
it, and a hand-set category is carried over. **Reversible:** the survivor row (tagged
`reconciledManualId` by `selectTransactionsForAccount`) offers a start-swipe "detach" →
`unreconcileTransaction`, which clears `matchedTxnId` and restores `pending`.

**Transfers.** Two legs flagged `isTransfer: true`, linked by `transferGroupId` — **not**
`matchedTxnId`, which already means "reconciliation survivor" and would overload two unrelated
relations onto one field. `bookTransfer` builds both atomically via the pure `cash/util/transfer.utils.ts#buildTransferLegs`
(equal magnitude, one `< 0` / one `> 0`, shared group id); deleting either leg deletes the group.
Transfers stay in balances but are excluded from spend/income totals.

**Import — per-bank parsers, not a generic column-mapper.** An account's `bank` **implicitly selects
the parser**, which is simpler for the user and lets each parser own its bank's quirks.
`cash/util/import/`: `bank-parser.ts` holds the contract `BankParser { parse(text): ParseResult }`
plus the primitives every parser shares (`splitLines`, `splitRow`, `findHeaderIndex`,
`germanDateToISO`, `joinDescription`); `bank-parsers.ts` is the **registry** —
`BANK_PARSERS: Record<Bank, BankParser>`, `BANK_OPTIONS` (its keys, so a parser cannot ship
unofferable), `parserForBank`, so a third bank is one
entry there plus a new `*.parser.ts`. A parse returns `{ rows, rejected }`, not a bare array:
`rejected` counts data rows below the header whose date or amount was unreadable, because a partial
import that reports success leaves the balance wrong with nothing to notice it by. Parsers:
`volksbank.parser.ts`, `dkb.parser.ts` (keeps only `Gebucht` rows; counterparty = whichever of
payer/payee is set). **Each parser's header comment is the format source** — the column layout it
indexes, spelled out; both banks are `;`-delimited, `DD.MM.YYYY`, German amounts, header row first.
(There are no fixture exports in the repo, deliberately — see [decisions.md](./decisions.md).) Flow: pick
a `.csv` → `file.arrayBuffer()` → `read-csv.ts#decodeCsv` (strict UTF-8 first, **Windows-1252
fallback** when the bytes aren't valid UTF-8 — real Volksbank exports often are CP1252) → parse →
the pure `planImport(...)`, which **dedups** on the natural key
`` `${accountId}|${dateISO.slice(0, 10)}|${amountCents}|${description}` `` (against existing
_imported_ txns and within the batch) and auto-categorizes → a preview modal → one bulk
`importTransactions` action (one persist). The date is keyed on its `YYYY-MM-DD` prefix **only**:
`dateISO` is a local-midnight ISO whose offset (`+01:00`/`+02:00`) shifts with the device timezone,
so keying on the full string would defeat dedup after a DST or timezone change and re-import the
whole batch. The plan carries `rejected` through as well, so the preview can say an import was short
instead of reporting it as complete.

**Reporting** (`cash/report`, a static route before `:accountId`): `selectReportTotals` /
`selectMonthlyTotals` / `selectSpendByCategory` feed a totals strip, an income-vs-spend monthly bar
chart and a spend-by-category doughnut, via `ng2-charts` + `chart.js`.

**Scope guards (non-goals):** EUR only, no multi-currency or FX. Offline only — no backend, no sync,
no bank API (FinTS/HBCI); import is a manual file drop.

