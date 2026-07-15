# Cash ledger (CREDSTICK) — plan

> Reconstructed 2026-07-12 from the P0 code + type design after the original
> planning session's context was lost. **Refined 2026-07-14**: status re-synced
> to `main`, and the cross-cutting design decisions (money parsing, the
> categorization engine's home, amount conditions, transfer pairing, import
> format, reconciliation heuristic) are now *locked* below — see
> **§ Design decisions (locked)**. This is the authoritative roadmap for the
> `cash` domain going forward — the code comments that say "see the cash plan"
> mean *this* file.

## What it is

`cash` is an **offline, EUR, multi-account personal-finance ledger** grafted into
np-commlink as an independent top-level DDD feature (same standing as `tracking`,
`shopping`, `storage`, …). Deck codename **CREDSTICK** (`0x0A`, _"nuyen // ledger"_).

It is **purpose-built** — it deliberately does **not** ride the grocery
`IItemList` / grocery-list multi-list engine. A ledger's needs (signed money,
opening balances, reconciliation, ordered filter rules) don't map onto a
category-bucketed item list, so `cash` gets its own actions/reducer/selectors.

### Design principles

- **Integer cents, never floats.** Every amount is `…Cents: number` (signed
  integer). `< 0` = outflow (spending), `> 0` = inflow (income). No float money
  anywhere — formatting to `12,34 €` happens only at the view edge.
- **Offline-first.** State lives in the `cash` NgRx slice, persisted to
  `@ionic/storage` under key `npc-cash` on any `[Cash]` action. No backend.
- **Multi-account.** Running balance of an account = `openingBalanceCents +
  Σ signed txn amounts`. Net worth = Σ account balances.
- **Manual override wins.** Auto-categorization (filter rules) must never clobber
  a category a human set by hand — see the categorization engine below.

## Domain model (`@shared/types.ts`)

| Type | Role |
|---|---|
| `ICashAccount` | `giro` / `creditcard` / `savings` / `cash`; `openingBalanceCents` as of `openingDateISO`; optional `bank` (`TBank`) that selects the CSV import parser. |
| `ICashTransaction` | signed `amountCents`; `source` (`imported`/`manual`); `status` (`pending`/`confirmed`); `category` + `categoryManual`; `rawDescription` (verbatim bank text, kept for rule matching + audit); `matchedTxnId`, `isTransfer`, `importBatchId`. |
| `ICashRule` | email-style filter: ordered, `match` (`all`=AND / `any`=OR), `conditions[]`, assigns `category`. First matching rule wins. |
| `ICashFilterCondition` | `field` (`description`/`amount`) · `op` (`contains`/`startsWith`/`endsWith`/`equals`/`regex`) · `value` · `caseSensitive?`. |
| `ICashState` | `{ accounts, transactions, rules, categories }`. |

### Categorization engine (the core idea)

Transactions are auto-categorized by **ordered, email-filter-style rules**:

1. Rules are sorted by `order`; the **first** rule whose conditions match wins
   and stamps its `category` onto the transaction.
2. `match: 'all'` = every condition must hold (AND); `'any'` = at least one (OR).
3. A transaction with `categoryManual: true` is **shielded** — rule re-runs skip
   it entirely, so a hand-set category survives future imports and rule edits.

This is why `Set Transaction Category` carries a `manual` flag, and why re-running
rules must filter on `!categoryManual`.

**Where it lives (locked).** The matcher is a **pure function in `cash/util/`** —
`categorize(txn, rules): string | undefined` (first-match-wins) plus
`matchesCondition(txn, condition): boolean`. It takes plain data and returns a
category, so it is trivially unit-tested and is called from **both** P3 ("Apply
rules" over existing txns) and P4 (auto-run over an import batch). It must **not**
live in a component or effect. The "Apply rules" effect/thunk maps over
`transactions.filter(t => !t.categoryManual)` and dispatches
`Set Transaction Category` with `manual: false` for each change.

**Amount conditions (model gap — resolve in P3).** `ICashFilterCondition.op` is
today string-only (`contains|startsWith|endsWith|equals|regex`), which is
meaningless for `field: 'amount'`. Locked decision: when P3 lands, **extend the
model** — for `field: 'amount'`, `value` is a signed EUR amount parsed by
`eurToCents`, and the op set becomes numeric (`eq|lt|lte|gt|gte`); the string ops
stay valid only for `field: 'description'`. Match on the **signed** `amountCents`
(so `lt 0` = outflows), not the absolute value. `regex`/`contains` on `amount` is
rejected at rule-save time.

### Reconciliation model

A manually-entered card spend is created `status: 'pending'`. When a later bank
import brings in the real transaction, the pending manual entry is **merged into**
the imported one (`matchedTxnId` points at the survivor) and marked `confirmed`.
This avoids double-counting a spend you logged before it cleared.

**Candidate heuristic (locked).** For a `pending` manual txn, propose matches that
are: same `accountId`, **equal** `amountCents`, `dateISO` within **±3 days**, and
not already matched. The user confirms — never auto-merge silently, because an
equal-amount coincidence (two identical fares) would corrupt the ledger. On
confirm: the imported txn survives, the manual leg's `matchedTxnId` points at it,
and the manual leg is dropped from balance/spend math (or removed outright — a
P4 call). Double-counting is the failure mode we are guarding against here.

### Transfers

A transfer between two own accounts produces two legs flagged `isTransfer: true`.
Transfer legs are **excluded from spend/income totals** (they're not real
income/expense) but still affect each account's running balance.

**Pairing field (locked, P5 model addition).** The two legs are linked by a new
`transferGroupId?: string` on `ICashTransaction` (both legs share one) — **not**
`matchedTxnId`, which already means "reconciliation survivor" and would overload
two unrelated relations onto one field. Booking a transfer creates both legs
atomically (one debit `< 0`, one credit `> 0`, equal magnitude) in a single
`Book Transfer` action so they can never desync. Deleting one leg deletes the
group.

## Design decisions (locked)

Cross-cutting calls that outlive any one phase. The per-phase sections above
carry the categorization / reconciliation / transfer details; the rest live here.

### Money parsing & formatting (`cash/util/`, P1)

Integer cents in, German at the edge — **de-DE for now**. This is *correct*, not a
shortcut: the whole app is currently hardwired to German (`LOCALE_ID: 'de-DE'`,
`dayjs.locale('de')`, `registerLocaleData(de)` in `main.ts`/`app.component.ts`),
and although `en.json` exists it is **dead** — there is no `translate.use()`, no
language switcher, `de` is the only language ever active. So a locale literal here
matches the rest of the app. Precedent for the `Intl` style is
`trackplay/util/score.pipe.ts` (which also hardcodes `de-DE`).

- **Display goes through a pipe, not a raw call.** `cash/util/money.pipe.ts`
  (`moneyEur`) is the template-facing formatter; it delegates to the pure helper
  below. Reason: when i18n goes live (see follow-up), we flip **one locale source**
  and every amount re-localizes — no scattered `'de-DE'` literals to chase.
- **`formatEur(cents, locale = 'de-DE'): string`** — `Intl.NumberFormat(locale,
  { style: 'currency', currency: 'EUR' }).format(cents / 100)` → `"12,34 €"`. The
  `locale` param defaults to de-DE today; the pipe passes it (currently the fixed
  value, later a locale signal). The `/100` float lives only at this view edge
  (per the design principle) and is safe inside `Number.MAX_SAFE_INTEGER` cents.
- **`eurToCents(input): number | null`** — parse **euros** (not cents): `"12"` →
  `1200`, `"12,34"` → `1234`. Algorithm, integer-cent-safe (no float multiply):
  extract a leading `-` sign; strip `€` and whitespace; **`.` is a thousands
  separator, `,` is the decimal** (de-DE, so `"1.234,56"` → `123456` and
  `"1.234"` → `123400`); replace `,`→`.`, split on it; take ≤2 decimal digits
  (right-pad to 2); `cents = sign * (intDigits * 100 + decDigits)`. Empty / NaN /
  a stray second separator → `null` (the dialog shows a validation error). We do
  **not** guess dot-as-decimal — `"12.34"` is `1234 €` here, which the input
  mask/placeholder must make obvious.
- **`centsToEur(cents): number`** — `cents / 100`, for chart/adapter code only.

> **Follow-up — bilingual money (app-wide, not cash-specific).** When the English
> language is actually wired (a switcher + `translate.use()` + a runtime-swapped
> `LOCALE_ID`), money should localize with it: de → `1.234,56 €`, en → `€1,234.56`.
> Because display already routes through `moneyEur` → `formatEur(cents, locale)`,
> the cash side is a one-line change (feed the active locale instead of the
> literal). The *broader* work is app-wide — the same hardcoded-`de-DE` assumption
> lives in `LOCALE_ID`, `dayjs.locale`, `registerLocaleData`, and
> `trackplay/util/score.pipe.ts`. Tracked in `docs/todo.md`. **Parsing** (`,` vs
> `.` as decimal) must become locale-aware in the same pass, or an en user typing
> `12.34` gets `1234 €`.

### Running balance & ordering

- **Balances are order-independent.** `selectAccountBalances` and
  `selectNetWorthCents` are pure sums (`openingBalanceCents + Σ amountCents`), so
  they need no sort and no chronological pass. A **credit-card** balance is
  naturally negative (a liability) and nets correctly into net worth.
- **Exclude reconciled-away legs.** Once P4 lands, a merged manual leg stays in
  state carrying its own `amountCents` **and** a `matchedTxnId` pointing at the
  surviving imported txn. The balance sum must therefore skip any txn with a
  `matchedTxnId` set (`Σ` over `txns.filter(t => !t.matchedTxnId)`), or the spend
  is double-counted. **Write this filter into the P1 selector now** even though
  no txn has `matchedTxnId` yet — it is free until P4 and easy to forget later.
  (Same applies to spend/income totals in P5.)
- **Display order** (P2 list): `dateISO` **desc**. If we ever add a
  *running-balance column*, that specific column must accumulate **chronologically
  ascending** with a stable tiebreak (`dateISO`, then `createdAt`, then `id`) —
  the flat balance selectors do not.
- We assume every txn's `dateISO` is on/after its account's `openingDateISO`; the
  balance sums **all** of an account's txns regardless (no date gate).

### Slice registration & the `enterPage` hook

- **`cash` is an *eager* root slice** (`provideStore` in `main.ts`), unlike the
  lazy grocery/tasks cluster. Its `/cash` route is therefore a plain lazy
  component with **no `provideState` / effects providers / hydration resolver** —
  correct, because `cash` is one self-contained slice with no cross-list sibling
  reads. Keep it eager unless the slice grows heavy enough to be worth code-split.
- **`CashActions.enterPage` is currently dead** — no `cash.effects.ts` exists and
  the page never dispatches it (every other domain's page does). Decision:
  **leave it unwired until a phase needs an on-enter effect** (the likely first
  need is P4 "auto-run rules after import"). When that lands, add
  `cash/data/cash.effects.ts` and have the page dispatch `enterPage()` on init.
  Until then it stays a documented, unused hook — do not add an empty effects
  file just to consume it.

### Scope guards (non-goals)

- **EUR only.** No multi-currency, no FX. `currency: 'EUR'` is hardcoded.
- **Offline only.** No backend, no sync, no bank API (FinTS/HBCI). Import is a
  manual file drop (P4).

## Phased roadmap

### P0 — data layer + wiring + scaffold  ✅ DONE (merged to `main`, `4bf2c1b`)

- `cash/data/{cash.actions,cash.reducer,cash.selector}.ts` — full CRUD for
  accounts/transactions/categories/rules; account delete cascades its txns;
  `reorderRules` re-numbers `order`; `upsertById` helper; hydrates on
  `ApplicationActions.loadedSuccessfully`.
- Wiring: reducer in `main.ts`; `saveCashOnChange$` in `app.effects.ts` (persists
  on `/^\[Cash\]/`); load in `database.service.ts`; fresh-install `cash: null` in
  the loaded-datastore action; `/cash` route; side-menu entry; CREDSTICK deck
  tile; `--ion-color-cash` theme token; `cash.*` i18n keys (de + en).
- View is a **store-connected scaffold only** (`cash.page.ts` shows the account
  count + an "under construction" hint).

### P1 — accounts overview

- `cash/util/money.ts` — `centsToEur` / `eurToCents` / `formatEur(cents, locale)`
  **exactly per § Design decisions → Money parsing** (de-DE, integer-cent safe;
  **no float `toFixed`**), plus `cash/util/money.pipe.ts` (`moneyEur`) as the
  template-facing display path. Ships with `money.spec.ts` (the parse table:
  `"12"`, `"12,34"`, `"1.234,56"`, leading `-`, `€`/whitespace, garbage → `null`).
  Views format via the `moneyEur` pipe, never a raw `formatEur` call in a template.
- Selectors: `selectAccountBalances` (`openingBalanceCents + Σ amountCents` per
  account), `selectNetWorthCents` (Σ balances). **Clears the owed
  `cash.selector.spec.ts`** (via `.projector(...)`) — see Cross-cutting.
- View: accounts list (name, kind icon, running balance via `formatEur`),
  net-worth header; add / edit / remove account via a `cash/smart-ui/` dialog
  (first `cash/util/` and first `cash/smart-ui/` in the domain).

### P2 — transactions

- Per-account transaction list (date, description, signed amount, category chip,
  pending/confirmed indicator), sorted by `dateISO` desc.
- Add / edit / remove a **manual** transaction (`source: 'manual'`,
  `status: 'pending'` for card spends).
- Assign / clear category on a txn (`Set Transaction Category` with
  `manual: true` from the UI).

### P3 — categories + filter rules

- Category management (add/remove; `categories` is the user-managed name list).
- **Model change:** extend `ICashFilterCondition` for amount conditions per
  § Categorization engine (numeric ops `eq|lt|lte|gt|gte` for `field: 'amount'`,
  string ops for `field: 'description'` only).
- `cash/util/categorize.ts` — the pure `categorize(txn, rules)` +
  `matchesCondition` matcher (+ spec: AND/OR, first-match-wins, `!categoryManual`
  shield, each op). Reused by P4 import.
- Rule editor: create/edit/remove rules, drag-to-reorder (`Reorder Rules`),
  condition builder (`all`/`any` + field/op/value rows).
- "Apply rules" thunk/effect that walks `transactions.filter(!categoryManual)`,
  first-match-wins, dispatching `Set Transaction Category` (`manual: false`).
  (Auto-run after import in P4.)

### P4 — import + reconciliation

> **Design pivot (locked 2026-07-15): per-bank parsers, not a generic
> column-mapper.** An account carries a `bank` (`ICashAccount.bank?: TBank`);
> choosing it **implicitly selects the parser** — one parser per bank, no manual
> column-mapping. This is simpler for the user and lets each parser own its
> bank's quirks. Reference exports live on the branch: `docs/example.csv`
> (Volksbank) and `docs/example2.csv` (DKB). Both are `;`-delimited, `DD.MM.YYYY`,
> German amounts (decimal comma, thousands dot), header row first.

**P4a — import (this is what the CSVs + bank selection drive):**

- **Model:** `TBank = 'volksbank' | 'dkb'`; `ICashAccount.bank?: TBank` (optional
  — a manual-only account like Bargeld has none). The account dialog gains a bank
  select (P1 dialog).
- **Parser registry** `cash/util/import/`:
  - `IBankParser { bank; label; parse(text): IParsedRow[] }`, where
    `IParsedRow = { dateISO, amountCents, description, rawDescription }`.
  - `volksbank.parser.ts` — cols `Buchungstag`[0] · payee `Auftraggeber/Beguenstigter`[2] · `Verwendungszweck`[3] · `Betrag`[6].
  - `dkb.parser.ts` — cols `Buchungsdatum`[0] · `Status`[2] (keep only `Gebucht`) · payer `Zahlungspflichtige*r`[3] / payee `Zahlungsempfänger*in`[4] (counterparty = whichever is set) · `Verwendungszweck`[5] · `Betrag (€)`[9, last]; trim the space-padded IBAN col.
  - Shared helpers: header-row detection (tolerant of a preamble), `;`-split,
    `DD.MM.YYYY`→ISO, and **`eurToCents` reused** for the amount. `description` =
    `[counterparty, purpose].join(' — ')`; `rawDescription` = the text rules match.
  - `bank-parsers.ts` maps `TBank → IBankParser` + labels; each parser has a spec
    driven by the real example rows.
- **Import flow** (from the account ledger; button enabled only when the account
  has a `bank`): pick a `.csv` → read text → `parserForBank(account.bank).parse` →
  a pure `planImport(rows, accountId, rules, existing, batchId, makeId)` that
  **dedups** (natural key `` `${accountId}|${dateISO}|${amountCents}|${rawDescription}` ``
  vs existing *imported* txns, and within the batch) and **auto-categorizes** via
  `categorize` (P3) → a preview modal (rows + new/duplicate counts) → on confirm a
  single `Import Transactions` bulk action (one persist). `plan-import.ts` is pure
  + spec'd.
- **Encoding caveat (deferred):** both examples are UTF-8/ASCII so `file.text()`
  suffices; real Volksbank exports are often Windows-1252 — add a
  `TextDecoder('windows-1252')` fallback when a real one shows mojibake.

**P4b — reconciliation ✅ DONE:** a pending manual entry's row has a
swipe-to-reconcile option → a picker modal lists candidates from the pure
`cash/util/reconcile.ts` heuristic (same account · equal cents · ±3 days · not
already a survivor); confirming dispatches `Reconcile Transaction`, which sets
`matchedTxnId` + `confirmed` on the manual leg (hidden from balance/list by the
existing `!matchedTxnId` filters) and carries a hand-set category onto the
survivor. Never auto-picks.

### P5 — transfers + reporting ✅ DONE

- **Model:** `transferGroupId?: string` on `ICashTransaction`; `Book Transfer`
  builds both legs via the pure `cash/util/transfer.ts` (equal magnitude, one
  `< 0` / one `> 0`, both `isTransfer`, shared group id) and the reducer appends
  them atomically. Deleting either leg deletes the group (`removeTransaction`).
  Booked from a transfer modal on the overview (source ≠ target guard).
- Transfers stay in balances but are excluded from spend/income via the
  reporting selectors' `isReportable` filter (`!isTransfer && !matchedTxnId`).
- **Reporting** (`cash/report`, static route before `:accountId`):
  `selectReportTotals` / `selectMonthlyTotals` / `selectSpendByCategory` (all
  spec'd) feed a totals strip, an income-vs-spend monthly bar chart, and a
  spend-by-category doughnut — via **`ng2-charts` + `chart.js`** (already deps;
  precedent `tracking/smart-ui/sessions-chart`), no new dependency.

### Cross-cutting

- **Tests:** `cash.reducer.spec.ts` ✅ **done** (10 tests — upsert, cascade
  delete, manual-override, reorder, hydrate/fallback). Still **owed**:
  `cash.selector.spec.ts` (balance + net-worth via `.projector(...)`) — clear it
  in **P1** with the balance selectors. Later phases add `money.spec.ts`,
  `categorize.spec.ts`, `csv.spec.ts` alongside their utils.
- **Shadowrun re-skin:** the `--ion-color-cash` jade tint and the P1+ views need
  the same contrast/monospace/German-string audit noted for the grocery pages in
  `merge-notes.md`.
- **i18n:** all cash keys stay namespaced under `cash.` (only `cash.page-title.cash`
  + `cash.landing.hint` exist today); TS-side keys use `marker('cash.…')`.

## Status snapshot (2026-07-15)

- **P0 merged to `main`** (`4bf2c1b`); **P1–P5 built on branch `feature/cash`**
  (worktree `np-commlink-cash`) — accounts overview, transactions, categories +
  rules + categorization engine, per-bank CSV import + reconciliation, transfers
  + reporting. **The roadmap is complete.**
- `cash` is auto-tagged `domain:cash` and fully **sealed** — no `sheriff.config.ts`
  bridge (it references no other domain), and it is an **eager** root slice (see
  § Slice registration).
- Every phase driven in the real app (Playwright) on top of the gate suite:
  tsc (app+spec) · sheriff · eslint · **681 unit** · prod build — all green.
- **Not yet pushed/merged.** When `feature/cash` meets the concurrent
  `feature/lazy-modules` work, expect conflicts in the cash **data layer** seam
  (`cash.actions`/`cash.reducer`/`types.ts`) — lazy-modules is swapping the
  hydration model (`ApplicationActions` → per-module `load`/`loaded`) and this
  branch still uses `ApplicationActions.loadedSuccessfully`. Cash UI is unaffected.
- **Remaining polish (not roadmap):** Windows-1252 CSV decode fallback (P4a note),
  a shadowrun re-skin pass on the new dialogs, and drag-reorder for rules (up/down
  today).
