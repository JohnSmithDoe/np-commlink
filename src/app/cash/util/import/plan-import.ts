/* ─── why ─────────────────────────────────────────────────────────
 * One key space. Every parsed row arrives with a key already — the bank's
 * `AcctSvcrRef` where the statement carries one, a derived key where it
 * does not — so nothing here has to ask which kind it is holding, and the
 * exact and the derived path cannot disagree about what a duplicate is.
 *
 * The account prefixes the key because a reference is only unique WITHIN
 * the account that issued it, and the same statement imported into two
 * accounts is two ledgers, not one.
 *
 * A row is NAMED by whoever was paid, not by the statement line. The line
 * is the counterparty and the purpose run together, and a purpose is a
 * paragraph — it made every ledger row, every report entry and every delete
 * confirm read as a wall. The paragraph is not lost: it is `remittanceInfo`,
 * shown under the name and matchable by its own field.
 * ───────────────────────────────────────────────────────────────── */
import { CashRule } from '../../model/rule.types';
import { CamtDetails, CashTransaction } from '../../model/transaction.types';
import { withCategory } from '../cash-category.utils';
import { categorize } from '../categorize.utils';
import { ParsedRow, ParseResult } from './parsed-row';

export interface ImportPlan {
  toImport: CashTransaction[];
  duplicates: number;
  rejected: number;
}

const scopedKey = (accountId: string, importKey: string): string =>
  `${accountId}|${importKey}`;

const importedKeys = (existing: readonly CashTransaction[]): Set<string> =>
  new Set(
    existing
      .filter((txn) => txn.source === 'imported' && txn.importKey)
      .map((txn) => scopedKey(txn.accountId, txn.importKey ?? ''))
  );

const detailsFromRow = (row: ParsedRow): CamtDetails => ({
  counterpartyName: row.counterpartyName,
  counterpartyIban: row.counterpartyIban,
  counterpartyBic: row.counterpartyBic,
  remittanceInfo: row.remittanceInfo,
  endToEndId: row.endToEndId,
  mandateId: row.mandateId,
  purposeCode: row.purposeCode,
  bankTxCode: row.bankTxCode,
  valueDateISO: row.valueDateISO,
});

const nameFromRow = (row: ParsedRow): string =>
  row.counterpartyName?.trim() || row.remittanceInfo?.trim() || row.description;

const transactionFromRow = (
  row: ParsedRow,
  accountId: string,
  importBatchId: string,
  id: string
): CashTransaction => ({
  ...detailsFromRow(row),
  id,
  accountId,
  dateISO: row.dateISO,
  amountCents: row.amountCents,
  name: nameFromRow(row),
  source: 'imported',
  status: row.status,
  importBatchId,
  importKey: row.key,
});

const autoCategorized = (
  txn: CashTransaction,
  rules: readonly CashRule[]
): CashTransaction => {
  const categoryId = categorize(txn, rules);
  return categoryId === undefined ? txn : withCategory(txn, categoryId);
};

export function planImport(
  parsed: ParseResult,
  accountId: string,
  rules: readonly CashRule[],
  existing: readonly CashTransaction[],
  importBatchId: string,
  makeId: () => string
): ImportPlan {
  const seen = importedKeys(existing);
  const toImport: CashTransaction[] = [];
  let duplicates = 0;
  for (const row of parsed.rows) {
    const key = scopedKey(accountId, row.key);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    toImport.push(
      autoCategorized(
        transactionFromRow(row, accountId, importBatchId, makeId()),
        rules
      )
    );
  }
  return { toImport, duplicates, rejected: parsed.rejected };
}
