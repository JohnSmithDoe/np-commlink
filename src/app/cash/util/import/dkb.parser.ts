import { eurToCents } from '../money.utils';
import {
  findHeaderIndex,
  germanDateToISO,
  IBankParser,
  IParsedRow,
  IParseResult,
  joinDescription,
  splitLines,
  splitRow,
} from './bank-parser';

// DKB giro export. `;`-delimited, header first:
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
  parse(text: string): IParseResult {
    const lines = splitLines(text);
    const header = findHeaderIndex(lines, HEADER);
    if (header === -1) return { rows: [], rejected: 0 };

    const rows: IParsedRow[] = [];
    let rejected = 0;
    for (const line of lines.slice(header + 1)) {
      const cols = splitRow(line);
      const status = cols[STATUS] ?? '';
      if (status && status !== 'Gebucht') continue; // skip pending/rejected
      const dateISO = germanDateToISO(cols[DATE] ?? '');
      // Explicitly German, never the UI language: a German bank's export is
      // German whatever the app is set to, and the two conventions read each
      // other's amounts as valid (`1.234` is 1234 € here, 1.23 € under `en`).
      const amountCents = eurToCents(cols[AMOUNT] ?? '', 'de');
      if (dateISO === null || amountCents === null) {
        rejected++;
        continue;
      }
      const counterparty = cols[PAYER] || cols[PAYEE] || '';
      rows.push({
        dateISO,
        amountCents,
        description: joinDescription(counterparty, cols[PURPOSE] ?? ''),
      });
    }
    return { rows, rejected };
  },
};
