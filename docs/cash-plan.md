# Cash ledger (CREDSTICK) — plan

> Reconstructed 2026-07-12 from the P0 code + type design after the original
> planning session's context was lost. This is the authoritative roadmap for
> the `cash` domain going forward — the code comments that say "see the cash
> plan" mean *this* file.

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
| `ICashAccount` | `giro` / `creditcard` / `savings` / `cash`; `openingBalanceCents` as of `openingDateISO`. |
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

### Reconciliation model

A manually-entered card spend is created `status: 'pending'`. When a later bank
import brings in the real transaction, the pending manual entry is **merged into**
the imported one (`matchedTxnId` points at the survivor) and marked `confirmed`.
This avoids double-counting a spend you logged before it cleared.

### Transfers

A transfer between two own accounts produces two legs flagged `isTransfer: true`.
Transfer legs are **excluded from spend/income totals** (they're not real
income/expense) but still affect each account's running balance.

## Phased roadmap

### P0 — data layer + wiring + scaffold  ✅ DONE (this branch)

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

- `cash/util/` money helpers: `centsToEur(cents)` / `eurToCents(string)` /
  `formatEur(cents)` (locale `de-DE`, integer-cent safe). **Do not** reach for a
  float `toFixed`.
- Selectors: `selectAccountBalances` (running balance per account),
  `selectNetWorthCents` (Σ balances). Compute from `openingBalanceCents` + txns.
- View: accounts list (name, kind icon, running balance), net-worth header;
  add / edit / remove account via a `cash/smart-ui/` dialog.

### P2 — transactions

- Per-account transaction list (date, description, signed amount, category chip,
  pending/confirmed indicator), sorted by `dateISO` desc.
- Add / edit / remove a **manual** transaction (`source: 'manual'`,
  `status: 'pending'` for card spends).
- Assign / clear category on a txn (`Set Transaction Category` with
  `manual: true` from the UI).

### P3 — categories + filter rules

- Category management (add/remove; `categories` is the user-managed name list).
- Rule editor: create/edit/remove rules, drag-to-reorder (`Reorder Rules`),
  condition builder (`all`/`any` + field/op/value rows).
- "Apply rules" action that walks transactions, respects `!categoryManual`,
  first-match-wins. (Consider running it automatically after import in P4.)

### P4 — import + reconciliation

- CSV / bank-export import → `ICashTransaction`s with `source: 'imported'`,
  `rawDescription` verbatim, a shared `importBatchId`; auto-run rules on the batch.
- Reconciliation UI: match a `pending` manual entry to an imported txn
  (`matchedTxnId`, flip to `confirmed`).

### P5 — transfers + reporting

- Mark/booking transfers (two `isTransfer` legs), excluded from spend/income.
- Spend/income summaries by category and period; possibly charts.

### Cross-cutting

- **Tests (owed now):** `cash.reducer.spec.ts` (upsert, cascade delete,
  manual-override, reorder, hydrate) and `cash.selector.spec.ts` (via
  `.projector(...)`) per the repo testing philosophy. P0 currently ships **no**
  cash specs — this is the first debt to clear.
- **Shadowrun re-skin:** the `--ion-color-cash` jade tint and the P1+ views need
  the same contrast/monospace/German-string audit noted for the grocery pages in
  `merge-notes.md`.
- **i18n:** all cash keys stay namespaced under `cash.`; TS-side keys use
  `marker('cash.…')`.

## Status snapshot (2026-07-12)

- Branch `feature/cash`, worktree `np-commlink-cash`. Compiles + lints (incl.
  Sheriff) clean. `cash` is auto-tagged `domain:cash` and fully sealed — needs no
  `sheriff.config.ts` bridge (it references no other domain).
- Everything above the data layer is still P0 scaffold.
