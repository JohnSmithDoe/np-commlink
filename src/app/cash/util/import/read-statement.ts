/* ─── why ─────────────────────────────────────────────────────────
 * Every row leaves here with a key, so nothing downstream has to ask
 * whether it has one. `AcctSvcrRef` is exact but OPTIONAL in the schema,
 * and a derived key is the honest substitute: same inputs, same key, so a
 * re-import recognises the row either way.
 *
 * Both kinds open with `YYYYMMDD`, because the observed `AcctSvcrRef` does —
 * nineteen digits, the booking date at the front — and a ledger whose keys
 * sort alike reads alike.
 * The resemblance stops there ON PURPOSE: a derived key carries four
 * `|`-delimited segments, so it cannot be confused with a reference no
 * matter what charset or length a bank chooses for one. Matching the
 * digits too would manufacture the collision the shape is meant to avoid.
 *
 * The occurrence counter is what makes the derived key survive genuinely
 * identical rows — two €4.20 coffees on one Tuesday are #1 and #2, not one
 * coffee. It is stable because both rows share a date, so no export range
 * can contain one without the other, and both keys number the same way.
 *
 * Keys are assigned AFTER the pages are concatenated. Counting per page
 * would restart at #1 whenever a pagination boundary fell between them.
 *
 * The account guard also lives here: the file names the account it belongs
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

const normalizeIban = (iban: string): string =>
  iban.replaceAll(/\s/g, '').toUpperCase();

const compactDate = (dateISO: string): string =>
  dateISO.slice(0, 10).replaceAll('-', '');

const derivedBase = (entry: ParsedEntry): string =>
  `${compactDate(entry.dateISO)}|${entry.amountCents}|${entry.description}`;

const withKeys = (entries: readonly ParsedEntry[]): ParsedRow[] => {
  const occurrences = new Map<string, number>();
  return entries.map((entry) => {
    if (entry.bankRef) return { ...entry, key: entry.bankRef };
    const base = derivedBase(entry);
    const occurrence = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, occurrence);
    return { ...entry, key: `${base}|${occurrence}` };
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
    parsed: { rows: withKeys(entries), rejected },
  };
}
