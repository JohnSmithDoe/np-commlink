/* ─── why ─────────────────────────────────────────────────────────
 * `AcctSvcrRef` is exact but OPTIONAL in the schema, so every row also
 * carries a DERIVED key — and keeps it even when the bank referenced it,
 * because a PDNG entry arrives without a reference and books later with
 * one. The exact key alone would import that spend twice.
 *
 * The `|`-delimited shape cannot be confused with a reference whatever
 * charset a bank picks for one, and the occurrence counter is what makes a
 * derived key survive genuinely identical rows: two €4.20 coffees on one
 * Tuesday are #1 and #2, not one coffee. Referenced and unreferenced rows
 * are counted in SEPARATE spaces, because numbering them together would
 * renumber a key already stored in the ledger. Counting happens after the
 * pages are concatenated, or a pagination boundary would restart it.
 *
 * The account guard lives here too: the file names the account it belongs
 * to, so importing the savings statement into the giro is answerable
 * rather than merely regrettable. An account with no IBAN ADOPTS the one
 * it reads — asking for twenty digits up front is a worse guard than none.
 * ───────────────────────────────────────────────────────────────── */
import { CamtReport, parseCamt } from './camt.parser';
import { ParsedEntry, ParsedRow, ParseResult } from './parsed-row';

export type StatementRead =
  | { kind: 'unreadable' }
  | { kind: 'wrong-account'; found: string }
  | { kind: 'ok'; iban?: string; parsed: ParseResult };

const lastClosingBalance = (
  reports: readonly CamtReport[]
): number | undefined => {
  for (const report of reports.toReversed()) {
    if (report.closingBalanceCents !== undefined) {
      return report.closingBalanceCents;
    }
  }
  return undefined;
};

const normalizeIban = (iban: string): string =>
  iban.replaceAll(/\s/g, '').toUpperCase();

const compactDate = (dateISO: string): string =>
  dateISO.slice(0, 10).replaceAll('-', '');

const derivedBase = (entry: ParsedEntry): string =>
  `${compactDate(entry.dateISO)}|${entry.amountCents}|${entry.description}`;

const withKeys = (entries: readonly ParsedEntry[]): ParsedRow[] => {
  const referenced = new Map<string, number>();
  const unreferenced = new Map<string, number>();
  return entries.map((entry) => {
    const base = derivedBase(entry);
    const tally = entry.bankRef ? referenced : unreferenced;
    const occurrence = (tally.get(base) ?? 0) + 1;
    tally.set(base, occurrence);
    return { ...entry, derivedKey: `${base}|${occurrence}` };
  });
};

export function readStatement(
  documents: readonly string[],
  expectedIban?: string
): StatementRead {
  const reports = documents
    .map((xml) => parseCamt(xml))
    .filter((report): report is CamtReport => report !== null);
  if (reports.length === 0) return { kind: 'unreadable' };

  const ibans = [
    ...new Set(
      reports.flatMap((report) =>
        report.iban ? [normalizeIban(report.iban)] : []
      )
    ),
  ];
  const expected = expectedIban ? normalizeIban(expectedIban) : ibans[0];
  const mismatch = ibans.find((iban) => iban !== expected);
  if (mismatch) return { kind: 'wrong-account', found: mismatch };

  const entries: ParsedEntry[] = [];
  let rejected = 0;
  for (const report of reports) {
    entries.push(...report.entries);
    rejected += report.rejected;
  }
  return {
    kind: 'ok',
    iban: ibans[0],
    parsed: {
      rows: withKeys(entries),
      rejected,
      closingBalanceCents: lastClosingBalance(reports),
    },
  };
}
