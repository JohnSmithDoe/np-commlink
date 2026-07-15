import { eurToCents } from '../money';
import {
  findHeaderIndex,
  germanDateToISO,
  IBankParser,
  IParsedRow,
  joinDescription,
  splitLines,
  splitRow,
} from './bank-parser';

// DKB giro export (docs/example2.csv). `;`-delimited, header first:
// Buchungsdatum;Wertstellung;Status;Zahlungspflichtige*r;Zahlungsempfänger*in;
// Verwendungszweck;Glaeubiger-ID;Mandatsreferenz;IBAN;Betrag (€)
// The counterparty is whichever of payer/payee is filled (depends on direction);
// only booked rows are imported. Betrag is the last column.
const HEADER = 'Buchungsdatum';
const DATE = 0;
const STATUS = 2;
const PAYER = 3;
const PAYEE = 4;
const PURPOSE = 5;
const AMOUNT = 9;

export const dkbParser: IBankParser = {
  bank: 'dkb',
  label: 'DKB',
  parse(text: string): IParsedRow[] {
    const lines = splitLines(text);
    const header = findHeaderIndex(lines, HEADER);
    if (header === -1) return [];

    const rows: IParsedRow[] = [];
    for (const line of lines.slice(header + 1)) {
      const cols = splitRow(line);
      const status = cols[STATUS] ?? '';
      if (status && status !== 'Gebucht') continue; // skip pending/rejected
      const dateISO = germanDateToISO(cols[DATE] ?? '');
      const amountCents = eurToCents(cols[AMOUNT] ?? '');
      if (dateISO === null || amountCents === null) continue;
      const counterparty = cols[PAYER] || cols[PAYEE] || '';
      const text = joinDescription(counterparty, cols[PURPOSE] ?? '');
      rows.push({
        dateISO,
        amountCents,
        description: text,
        rawDescription: text,
      });
    }
    return rows;
  },
};
