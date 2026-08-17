/* ─── why ─────────────────────────────────────────────────────────
 * One parser for every bank, because camt states what a CSV makes you
 * guess: the account is named in `<Acct>`, the sign is `CdtDbtInd` rather
 * than punctuation, and amounts and dates are already machine-readable.
 * There is nothing per-bank left to configure.
 *
 * It reads at `<Ntry>`, never at `<TxDtls>`. A collective booking is ONE
 * entry holding many details and moves the balance once; importing the
 * details would count that entry as many.
 *
 * Everything matches on `localName`. Versions disagree on the namespace
 * URI, on whether `<Sts>` holds a code or wraps one, and on whether a
 * party sits under `Pty` — pinning any of it rejects half the exports.
 * ───────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import { CashTransactionStatus } from '../../model/transaction.types';
import { EntryResult, joinDescription, ParsedEntry } from './parsed-row';

export interface CamtReport extends EntryResult {
  iban?: string;
}

const ANY_NS = '*';
const REPORT_ROOTS = [
  'BkToCstmrAcctRpt',
  'BkToCstmrStmt',
  'BkToCstmrDbtCdtNtfctn',
];
const STATEMENTS = ['Rpt', 'Stmt', 'Ntfctn'];
const DECIMAL = /^(\d+)(?:\.(\d+))?$/;

const normalize = (value: string | null): string =>
  (value ?? '').replaceAll(/\s+/g, ' ').trim();

const childrenNamed = (element: Element, name: string): Element[] =>
  [...element.children].filter((child) => child.localName === name);

const descend = (
  element: Element | undefined,
  ...names: string[]
): Element | undefined => {
  let node = element;
  for (const name of names) {
    if (!node) return undefined;
    node = childrenNamed(node, name)[0];
  }
  return node;
};

const textAt = (element: Element | undefined, ...names: string[]): string =>
  normalize(descend(element, ...names)?.textContent ?? '');

const decimalToCents = (value: string): number | null => {
  const match = DECIMAL.exec(value);
  if (!match) return null;
  const [, whole, fraction = ''] = match;
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
};

const bookingDate = (entry: Element): string | null => {
  const raw =
    textAt(entry, 'BookgDt', 'Dt') ||
    textAt(entry, 'BookgDt', 'DtTm') ||
    textAt(entry, 'ValDt', 'Dt') ||
    textAt(entry, 'ValDt', 'DtTm');
  const day = dayjs(raw.slice(0, 10));
  return raw && day.isValid() ? day.format() : null;
};

const statusOf = (entry: Element): CashTransactionStatus => {
  const status = descend(entry, 'Sts');
  if (!status) return 'confirmed';
  const code = textAt(status, 'Cd') || normalize(status.textContent);
  return code === 'PDNG' ? 'pending' : 'confirmed';
};

const counterpartyOf = (details: Element[], incoming: boolean): string => {
  const role = incoming ? 'Dbtr' : 'Cdtr';
  for (const detail of details) {
    const name =
      textAt(detail, 'RltdPties', role, 'Pty', 'Nm') ||
      textAt(detail, 'RltdPties', role, 'Nm');
    if (name) return name;
  }
  return '';
};

const purposeOf = (entry: Element, details: Element[]): string => {
  const remittance = details
    .flatMap((detail) => {
      const info = descend(detail, 'RmtInf');
      return info
        ? childrenNamed(info, 'Ustrd').map((line) =>
            normalize(line.textContent)
          )
        : [];
    })
    .filter((line) => line.length > 0);
  return remittance.length > 0
    ? remittance.join(' ')
    : textAt(entry, 'AddtlNtryInf');
};

const entryFrom = (entry: Element): ParsedEntry | null => {
  const dateISO = bookingDate(entry);
  const magnitude = decimalToCents(textAt(entry, 'Amt'));
  if (dateISO === null || magnitude === null) return null;

  const incoming = textAt(entry, 'CdtDbtInd') !== 'DBIT';
  const details = childrenNamed(entry, 'NtryDtls').flatMap((group) =>
    childrenNamed(group, 'TxDtls')
  );
  return {
    dateISO,
    amountCents: incoming ? magnitude : -magnitude,
    description: joinDescription(
      counterpartyOf(details, incoming),
      purposeOf(entry, details)
    ),
    status: statusOf(entry),
    bankRef: textAt(entry, 'AcctSvcrRef') || undefined,
  };
};

const statementsIn = (document_: Document): Element[] =>
  REPORT_ROOTS.flatMap((root) => [
    ...document_.getElementsByTagNameNS(ANY_NS, root),
  ]).flatMap((report) =>
    STATEMENTS.flatMap((name) => childrenNamed(report, name))
  );

export function parseCamt(xml: string): CamtReport | null {
  const parsed = new DOMParser().parseFromString(xml, 'application/xml');
  const statements = statementsIn(parsed);
  if (statements.length === 0) return null;

  const entries: ParsedEntry[] = [];
  let rejected = 0;
  let iban: string | undefined;
  for (const statement of statements) {
    iban ??= textAt(statement, 'Acct', 'Id', 'IBAN') || undefined;
    for (const node of childrenNamed(statement, 'Ntry')) {
      const entry = entryFrom(node);
      if (entry) entries.push(entry);
      else rejected++;
    }
  }
  return { iban, entries, rejected };
}
