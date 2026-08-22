/* ─── why ─────────────────────────────────────────────────────────
 * One parser for every bank, because camt states what a CSV makes you
 * guess. There is nothing per-bank left to configure.
 *
 * It reads at `<Ntry>`, never at `<TxDtls>`. A collective booking is ONE
 * entry holding many details and moves the balance once; importing the
 * details would count that entry as many. The structured details are read
 * from the FIRST detail that carries each field, so a batch contributes the
 * one counterparty it has rather than none.
 *
 * Everything matches on `localName`. Versions disagree on the namespace
 * URI, on whether `<Sts>` holds a code or wraps one, on whether a party sits
 * under `Pty`, and on whether a BIC is `BICFI` or `BIC` — pinning any of it
 * rejects half the exports.
 *
 * A `CdtDbtInd` that reads as neither CRDT nor DBIT REJECTS its entry rather
 * than defaulting to one: it is the one field whose failure doubles the
 * error, since a 900 debit read as a credit misses the balance by 1800.
 *
 * `<Bal>` is read for `CLBD` only — the bank's own closing figure, which is
 * both the authoritative balance and a checksum against the one summed from
 * entries.
 * ───────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import {
  CamtDetails,
  CashTransactionStatus,
} from '../../model/transaction.types';
import { EntryResult, joinDescription, ParsedEntry } from './parsed-row';

export interface CamtReport extends EntryResult {
  iban?: string;
  closingBalanceCents?: number;
}

const ANY_NS = '*';
const REPORT_ROOTS = [
  'BkToCstmrAcctRpt',
  'BkToCstmrStmt',
  'BkToCstmrDbtCdtNtfctn',
];
const STATEMENTS = ['Rpt', 'Stmt', 'Ntfctn'];
const DECIMAL = /^(\d+)(?:\.(\d+))?$/;
const CLOSING_BALANCE = 'CLBD';

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

const isoDate = (raw: string): string | null => {
  const day = dayjs(raw.slice(0, 10));
  return raw && day.isValid() ? day.format() : null;
};

const dateAt = (entry: Element, wrapper: string): string | null =>
  isoDate(textAt(entry, wrapper, 'Dt') || textAt(entry, wrapper, 'DtTm'));

const bookingDate = (entry: Element): string | null =>
  dateAt(entry, 'BookgDt') ?? dateAt(entry, 'ValDt');

const signOf = (element: Element): 1 | -1 | null => {
  const indicator = textAt(element, 'CdtDbtInd');
  if (indicator === 'CRDT') return 1;
  return indicator === 'DBIT' ? -1 : null;
};

const statusOf = (entry: Element): CashTransactionStatus => {
  const status = descend(entry, 'Sts');
  if (!status) return 'confirmed';
  const code = textAt(status, 'Cd') || normalize(status.textContent);
  return code === 'PDNG' ? 'pending' : 'confirmed';
};

const firstOf = (
  details: Element[],
  read: (detail: Element) => string
): string | undefined => {
  for (const detail of details) {
    const value = read(detail);
    if (value) return value;
  }
  return undefined;
};

const counterpartyOf = (details: Element[], incoming: boolean): string => {
  const role = incoming ? 'Dbtr' : 'Cdtr';
  return (
    firstOf(
      details,
      (detail) =>
        textAt(detail, 'RltdPties', role, 'Pty', 'Nm') ||
        textAt(detail, 'RltdPties', role, 'Nm')
    ) ?? ''
  );
};

const counterpartyIbanOf = (
  details: Element[],
  incoming: boolean
): string | undefined => {
  const account = incoming ? 'DbtrAcct' : 'CdtrAcct';
  return firstOf(details, (detail) =>
    textAt(detail, 'RltdPties', account, 'Id', 'IBAN')
  );
};

const counterpartyBicOf = (
  details: Element[],
  incoming: boolean
): string | undefined => {
  const agent = incoming ? 'DbtrAgt' : 'CdtrAgt';
  return firstOf(
    details,
    (detail) =>
      textAt(detail, 'RltdAgts', agent, 'FinInstnId', 'BICFI') ||
      textAt(detail, 'RltdAgts', agent, 'FinInstnId', 'BIC')
  );
};

const remittanceOf = (details: Element[]): string =>
  details
    .flatMap((detail) => {
      const info = descend(detail, 'RmtInf');
      return info
        ? childrenNamed(info, 'Ustrd').map((line) =>
            normalize(line.textContent)
          )
        : [];
    })
    .filter((line) => line.length > 0)
    .join(' ');

const bankTxCodeOf = (entry: Element): string | undefined =>
  textAt(entry, 'BkTxCd', 'Prtry', 'Cd') ||
  textAt(entry, 'BkTxCd', 'Domn', 'Cd') ||
  undefined;

const detailsOf = (entry: Element, incoming: boolean): CamtDetails => {
  const details = childrenNamed(entry, 'NtryDtls').flatMap((group) =>
    childrenNamed(group, 'TxDtls')
  );
  const remittance = remittanceOf(details);
  return {
    counterpartyName: counterpartyOf(details, incoming) || undefined,
    counterpartyIban: counterpartyIbanOf(details, incoming),
    counterpartyBic: counterpartyBicOf(details, incoming),
    remittanceInfo: remittance || undefined,
    endToEndId: firstOf(details, (detail) =>
      textAt(detail, 'Refs', 'EndToEndId')
    ),
    mandateId: firstOf(details, (detail) => textAt(detail, 'Refs', 'MndtId')),
    purposeCode: firstOf(details, (detail) => textAt(detail, 'Purp', 'Cd')),
    bankTxCode: bankTxCodeOf(entry),
    valueDateISO: dateAt(entry, 'ValDt') ?? undefined,
  };
};

const entryFrom = (entry: Element): ParsedEntry | null => {
  const dateISO = bookingDate(entry);
  const magnitude = decimalToCents(textAt(entry, 'Amt'));
  const sign = signOf(entry);
  if (dateISO === null || magnitude === null || sign === null) return null;

  const incoming = sign > 0;
  const details = detailsOf(entry, incoming);
  return {
    ...details,
    dateISO,
    amountCents: sign * magnitude,
    description: joinDescription(
      details.counterpartyName ?? '',
      details.remittanceInfo ?? textAt(entry, 'AddtlNtryInf')
    ),
    status: statusOf(entry),
    bankRef: textAt(entry, 'AcctSvcrRef') || undefined,
  };
};

const closingBalanceOf = (statement: Element): number | undefined => {
  for (const balance of childrenNamed(statement, 'Bal')) {
    const code =
      textAt(balance, 'Tp', 'CdOrPrtry', 'Cd') || textAt(balance, 'Tp', 'Cd');
    if (code !== CLOSING_BALANCE) continue;
    const magnitude = decimalToCents(textAt(balance, 'Amt'));
    const sign = signOf(balance);
    if (magnitude === null || sign === null) continue;
    return sign * magnitude;
  }
  return undefined;
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
  let closingBalanceCents: number | undefined;
  for (const statement of statements) {
    iban ??= textAt(statement, 'Acct', 'Id', 'IBAN') || undefined;
    closingBalanceCents = closingBalanceOf(statement) ?? closingBalanceCents;
    for (const node of childrenNamed(statement, 'Ntry')) {
      const entry = entryFrom(node);
      if (entry) entries.push(entry);
      else rejected++;
    }
  }
  return { iban, entries, rejected, closingBalanceCents };
}
