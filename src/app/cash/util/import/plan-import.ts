import { ICashRule, ICashTransaction } from '../../model';
import { categorize } from '../categorize';
import { IParsedRow } from './bank-parser';

export interface IImportPlan {
  /** Fresh transactions to add (auto-categorized, unique). */
  toImport: ICashTransaction[];
  /** How many rows were skipped as already-imported duplicates. */
  duplicates: number;
}

/**
 * Natural key for idempotent re-import — see docs/cash-plan.md P4. The date is
 * keyed on its `YYYY-MM-DD` prefix only: `dateISO` is a local-midnight ISO whose
 * offset (`+01:00`/`+02:00`) shifts with the device timezone, so keying on the
 * full string would defeat dedup after a DST/timezone change.
 */
const naturalKey = (
  accountId: string,
  dateISO: string,
  amountCents: number,
  rawDescription: string
): string =>
  `${accountId}|${dateISO.slice(0, 10)}|${amountCents}|${rawDescription}`;

/**
 * Turn parsed rows into transactions to import: assign ids, drop rows already
 * imported (natural-key dedup against existing imported txns AND within the
 * batch), auto-categorize via the P3 rules. Pure — `makeId` is injected so it is
 * deterministic under test.
 */
export function planImport(
  rows: readonly IParsedRow[],
  accountId: string,
  rules: readonly ICashRule[],
  existing: readonly ICashTransaction[],
  importBatchId: string,
  makeId: () => string
): IImportPlan {
  const seen = new Set(
    existing
      .filter((t) => t.source === 'imported')
      .map((t) =>
        naturalKey(
          t.accountId,
          t.dateISO,
          t.amountCents,
          t.rawDescription ?? ''
        )
      )
  );

  const toImport: ICashTransaction[] = [];
  let duplicates = 0;
  for (const row of rows) {
    const key = naturalKey(
      accountId,
      row.dateISO,
      row.amountCents,
      row.rawDescription
    );
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key); // also dedup within this batch
    const txn: ICashTransaction = {
      id: makeId(),
      accountId,
      dateISO: row.dateISO,
      amountCents: row.amountCents,
      description: row.description,
      rawDescription: row.rawDescription,
      source: 'imported',
      status: 'confirmed',
      importBatchId,
    };
    const categoryId = categorize(txn, rules);
    toImport.push(categoryId === undefined ? txn : { ...txn, categoryId });
  }
  return { toImport, duplicates };
}
