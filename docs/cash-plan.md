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
> `trackplay/util/score.pipe.ts`. Tracked in `docs/open-tasks.md`. **Parsing** (`,` vs
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

### Slice registration & hydration

> **Updated after the `main` rebase (2026-07-15).** P1–P5 were built while `cash`
> was an eager root slice; the `feature/lazy-modules` work (now on `main`) made
> `cash` a **lazy bounded context**, and this branch was rebased onto it keeping
> that new hydration. The text below reflects the lazy reality.

- **`cash` is a *lazy* bounded context.** It is **not** in the root
  `provideStore`; `cashLazyProviders` (`cash/data/provide-cash-lazy.ts`) registers
  `provideState('cash', …)` + `CashLoadEffects`/`CashSaveEffects`/
  `CashTelemetryEffects`, and **every** cash route (`/cash`, `/cash/rules`,
  `/cash/report`, `/cash/:accountId`) carries those `providers` plus
  `resolve: moduleHydrationResolver(CashActions.load, CashActions.loaded)`. Cash
  is torn down on leaving the subtree, so each sibling route must re-register +
  re-hydrate — hence the resolver on all of them.
- **Hydration is per-module `load`/`loaded`.** `CashLoadEffects` reads the `cash`
  key and emits `CashActions.loaded(cash)`; the reducer hydrates
  `on(CashActions.loaded, …)` — the old `ApplicationActions.loadedSuccessfully`
  path is gone. The `enterPage` hook stays unused (the telemetry reporter in
  `cashLazyProviders` handles the CREDSTICK standby→online flip on entry).

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
  - `volksbank.parser.ts` — cols `Buchungstag`\[0] · payee `Auftraggeber/Beguenstigter`\[2] · `Verwendungszweck`\[3] · `Betrag`\[6].
  - `dkb.parser.ts` — cols `Buchungsdatum`\[0] · `Status`\[2] (keep only `Gebucht`) · payer `Zahlungspflichtige*r`\[3] / payee `Zahlungsempfänger*in`\[4] (counterparty = whichever is set) · `Verwendungszweck`\[5] · `Betrag (€)`\[9, last]; trim the space-padded IBAN col.
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
- **Encoding (✅ DONE):** both examples are UTF-8/ASCII, but real Volksbank
  exports are often Windows-1252. The import now reads bytes via
  `file.arrayBuffer()` and decodes through the pure `cash/util/import/read-csv.ts`
  `decodeCsv()` — strict UTF-8 first, Windows-1252 fallback when the bytes aren't
  valid UTF-8 (a lone high byte like 0xFC 'ü' / 0x80 '€' triggers the fallback).

**P4b — reconciliation ✅ DONE:** a pending manual entry's row has a
swipe-to-reconcile option → a picker modal lists candidates from the pure
`cash/util/reconcile.ts` heuristic (same account · equal cents · ±3 days · not
already a survivor); confirming dispatches `Reconcile Transaction`, which sets
`matchedTxnId` + `confirmed` on the manual leg (hidden from balance/list by the
existing `!matchedTxnId` filters) and carries a hand-set category onto the
survivor. Never auto-picks. **Reversible:** the survivor row (tagged with
`reconciledManualId` by `selectTransactionsForAccount`) has a start-swipe
"detach" option → `Unreconcile Transaction`, which clears the manual leg's
`matchedTxnId` and restores it to `pending` (a carried category stays put).

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
  `open-tasks.md`.
- **i18n:** all cash keys stay namespaced under `cash.` (only `cash.page-title.cash`
  + `cash.landing.hint` exist today); TS-side keys use `marker('cash.…')`.

## Status snapshot (2026-07-15)

- **P0 merged to `main`** (`4bf2c1b`); **P1–P5 built on branch `feature/cash`**
  (worktree `np-commlink-cash`) — accounts overview, transactions, categories +
  rules + categorization engine, per-bank CSV import + reconciliation, transfers
  + reporting. **The roadmap is complete.**
- `cash` is auto-tagged `domain:cash` and fully **sealed** — no `sheriff.config.ts`
  bridge (it references no other domain), and (after the `main` rebase) it is a
  **lazy** bounded context (see § Slice registration & hydration).
- Every phase driven in the real app (Playwright) on top of the gate suite:
  tsc (app+spec) · sheriff · eslint · **681 unit** · prod build — all green.
- **Not yet pushed/merged.** When `feature/cash` meets the concurrent
  `feature/lazy-modules` work, expect conflicts in the cash **data layer** seam
  (`cash.actions`/`cash.reducer`/`types.ts`) — lazy-modules is swapping the
  hydration model (`ApplicationActions` → per-module `load`/`loaded`) and this
  branch still uses `ApplicationActions.loadedSuccessfully`. Cash UI is unaffected.
- **Remaining polish (not roadmap):** see § Deferred polish.

## Deferred polish

Non-blocking follow-ups on the completed roadmap.

- **Windows-1252 CSV decode ✅ DONE.** The import reads bytes via
  `file.arrayBuffer()` and decodes through the pure `cash/util/import/read-csv.ts`
  `decodeCsv()`: a strict `TextDecoder('utf-8', { fatal: true })` first, falling
  back to `TextDecoder('windows-1252')` when the bytes aren't valid UTF-8 (a lone
  high byte like 0xFC 'ü' / 0x80 '€' throws and is caught). Covers UTF-8 and
  legacy CP1252 exports; spec'd in `read-csv.spec.ts`.
- **DKB imported live only in spec.** The DKB parser is unit-tested against
  `docs/example2.csv`, but only Volksbank was driven end-to-end in-app. Do a
  manual DKB import pass when convenient.
- **Shadowrun re-skin of the new surfaces.** The P1–P5 dialogs/pages
  (account/transaction/rule/transfer modals, import preview, rules + report
  pages) need the same contrast-vs-amber, monospace-clipping and German-string
  audit noted for the grocery pages in `open-tasks.md`. The report chart palette
  (`#2dd36f`/`#eb445a`/category ramp) is Ionic-default, not `--sr-*` tokens — pull
  it onto the theme.
- **Rules drag-reorder.** Rules reorder via up/down controls today; the app wires
  no `ion-reorder-group` anywhere, so a drag implementation was deferred rather
  than pioneered blind.
- **Category input unification ✅ DONE.** The transaction dialog + the rule
  dialog now use the shared `@shared/ui/categories-dialog` picker in
  single-select mode (backed by `categories`) instead of a free-text input / bare
  `ion-select`, matching grocery's multi-select. Cash gained `Update Category`
  (rename cascades to the catalog + transactions + rules) and a `Remove Category`
  cascade (clears it off transactions → uncategorized; rules keep their orphan
  label). Kept on the name-string model — the `{id,name}`-by-id migration is a
  separate deferred epic.
- **Un-reconcile.** Reconciliation is one-way in the UI — the merged manual leg
  is hidden (recoverable only via data). A "detach" affordance (clear
  `matchedTxnId`, restore `pending`) would make it reversible.
