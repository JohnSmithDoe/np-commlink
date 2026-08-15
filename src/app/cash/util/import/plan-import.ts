import { CashRule } from '../../model/rule.types';
import { CashTransaction } from '../../model/transaction.types';
import { withCategory } from '../cash-category.utils';
import { categorize } from '../categorize.utils';
import { ParsedRow, ParseResult } from './bank-parser';

export interface ImportPlan {
  toImport: CashTransaction[];
  duplicates: number;
  rejected: number;
}

const naturalKey = (
  accountId: string,
  dateISO: string,
  amountCents: number,
  description: string
): string =>
  `${accountId}|${dateISO.slice(0, 10)}|${amountCents}|${description}`;

const importedNaturalKeys = (
  existing: readonly CashTransaction[]
): Set<string> =>
  new Set(
    existing
      .filter((txn) => txn.source === 'imported')
      .map((txn) =>
        naturalKey(txn.accountId, txn.dateISO, txn.amountCents, txn.name)
      )
  );

const rowNaturalKey = (accountId: string, row: ParsedRow): string =>
  naturalKey(accountId, row.dateISO, row.amountCents, row.description);

const transactionFromRow = (
  row: ParsedRow,
  accountId: string,
  importBatchId: string,
  id: string
): CashTransaction => ({
  id,
  accountId,
  dateISO: row.dateISO,
  amountCents: row.amountCents,
  name: row.description,
  source: 'imported',
  status: 'confirmed',
  importBatchId,
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
  const alreadyImportedKeys = importedNaturalKeys(existing);
  const rows = parsed.rows;
  const toImport: CashTransaction[] = [];
  let duplicates = 0;
  for (const row of rows) {
    const key = rowNaturalKey(accountId, row);
    if (alreadyImportedKeys.has(key)) {
      duplicates++;
      continue;
    }
    alreadyImportedKeys.add(key); // also dedups within this batch
    toImport.push(
      autoCategorized(
        transactionFromRow(row, accountId, importBatchId, makeId()),
        rules
      )
    );
  }
  return { toImport, duplicates, rejected: parsed.rejected };
}
