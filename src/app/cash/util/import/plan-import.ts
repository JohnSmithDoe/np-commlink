import { ICashRule } from '../../model/rule.types';
import { ICashTransaction } from '../../model/transaction.types';
import { categorize } from '../categorize.utils';
import { IParsedRow, IParseResult } from './bank-parser';

export interface IImportPlan {
  /** Fresh transactions to add (auto-categorized, unique). */
  toImport: ICashTransaction[];
  /** How many rows were skipped as already-imported duplicates. */
  duplicates: number;
  /** How many rows the parser could not read at all — carried through so the
   * preview can say so instead of reporting a short import as a complete one. */
  rejected: number;
}

/**
 * Natural key for idempotent re-import — see docs/project-summary.md §7.3 (Import). The date is
 * keyed on its `YYYY-MM-DD` prefix only: `dateISO` is a local-midnight ISO whose
 * offset (`+01:00`/`+02:00`) shifts with the device timezone, so keying on the
 * full string would defeat dedup after a DST/timezone change.
 */
const naturalKey = (
  accountId: string,
  dateISO: string,
  amountCents: number,
  description: string
): string =>
  `${accountId}|${dateISO.slice(0, 10)}|${amountCents}|${description}`;

const importedNaturalKeys = (
  existing: readonly ICashTransaction[]
): Set<string> =>
  new Set(
    existing
      .filter((txn) => txn.source === 'imported')
      .map((txn) =>
        naturalKey(txn.accountId, txn.dateISO, txn.amountCents, txn.description)
      )
  );

const rowNaturalKey = (accountId: string, row: IParsedRow): string =>
  naturalKey(accountId, row.dateISO, row.amountCents, row.description);

const transactionFromRow = (
  row: IParsedRow,
  accountId: string,
  importBatchId: string,
  id: string
): ICashTransaction => ({
  id,
  accountId,
  dateISO: row.dateISO,
  amountCents: row.amountCents,
  description: row.description,
  source: 'imported',
  status: 'confirmed',
  importBatchId,
});

const autoCategorized = (
  txn: ICashTransaction,
  rules: readonly ICashRule[]
): ICashTransaction => {
  const categoryId = categorize(txn, rules);
  return categoryId === undefined ? txn : { ...txn, categoryId };
};

/**
 * Turn parsed rows into transactions to import: assign ids, drop rows already
 * imported (natural-key dedup against existing imported txns AND within the
 * batch), auto-categorize via the P3 rules. Pure — `makeId` is injected so it is
 * deterministic under test.
 */
export function planImport(
  parsed: IParseResult,
  accountId: string,
  rules: readonly ICashRule[],
  existing: readonly ICashTransaction[],
  importBatchId: string,
  makeId: () => string
): IImportPlan {
  const alreadyImportedKeys = importedNaturalKeys(existing);
  const rows = parsed.rows;
  const toImport: ICashTransaction[] = [];
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
