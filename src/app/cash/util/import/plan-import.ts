/* ─── why ─────────────────────────────────────────────────────────
 * One key space, and a row answers with both of its keys — `importKeyOf` is
 * the bank's `AcctSvcrRef` where the statement carries one and the derived
 * key where it does not — so a duplicate is a hit on either, and the exact
 * and the derived path cannot disagree about what one is.
 *
 * A hit whose stored row is PENDING and whose incoming row is booked is not
 * merely a duplicate: it is the same spend, arriving with the reference the
 * intraday export withheld. Confirming that row in place keeps whatever
 * manual spend was reconciled against it, which re-importing would orphan.
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
import { ImportConfirmation, ImportPlan } from '../../model/import.types';
import { CashRule } from '../../model/rule.types';
import { CamtDetails, CashTransaction } from '../../model/transaction.types';
import { withCategory } from '../cash-category.utils';
import { categorizeOrdered, rulesByOrder } from '../categorize.utils';
import { importKeyOf, ParsedRow, ParseResult } from './parsed-row';

const scopedKey = (accountId: string, importKey: string): string =>
  `${accountId}|${importKey}`;

const importedByKey = (
  existing: readonly CashTransaction[]
): Map<string, CashTransaction> =>
  new Map(
    existing
      .filter((txn) => txn.source === 'imported' && txn.importKey)
      .map((txn) => [scopedKey(txn.accountId, txn.importKey ?? ''), txn])
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
  importKey: importKeyOf(row),
});

const autoCategorized = (
  txn: CashTransaction,
  ordered: readonly CashRule[]
): CashTransaction => {
  const categoryId = categorizeOrdered(txn, ordered);
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
  const ordered = rulesByOrder(rules);
  const known = importedByKey(existing);
  const toImport: CashTransaction[] = [];
  const toConfirm: ImportConfirmation[] = [];
  let duplicates = 0;
  for (const row of parsed.rows) {
    const key = scopedKey(accountId, importKeyOf(row));
    const derived = scopedKey(accountId, row.derivedKey);
    const already = known.get(key) ?? known.get(derived);
    if (already) {
      duplicates++;
      if (already.status === 'pending' && row.status === 'confirmed') {
        toConfirm.push({
          id: already.id,
          importKey: importKeyOf(row),
          dateISO: row.dateISO,
        });
      }
      continue;
    }
    const txn = autoCategorized(
      transactionFromRow(row, accountId, importBatchId, makeId()),
      ordered
    );
    known.set(key, txn);
    known.set(derived, txn);
    toImport.push(txn);
  }
  return { toImport, toConfirm, duplicates, rejected: parsed.rejected };
}
