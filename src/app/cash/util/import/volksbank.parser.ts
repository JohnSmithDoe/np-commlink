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

// Volksbank giro export (docs/example.csv). `;`-delimited, header first:
// Buchungstag;Valuta;Auftraggeber/Beguenstigter;Verwendungszweck;IBAN;BIC;Betrag;…
const HEADER = 'Buchungstag';
const DATE = 0;
const PAYEE = 2;
const PURPOSE = 3;
const AMOUNT = 6;

export const volksbankParser: IBankParser = {
  bank: 'volksbank',
  label: 'Volksbank',
  parse(text: string): IParsedRow[] {
    const lines = splitLines(text);
    const header = findHeaderIndex(lines, HEADER);
    if (header === -1) return [];

    const rows: IParsedRow[] = [];
    for (const line of lines.slice(header + 1)) {
      const cols = splitRow(line);
      const dateISO = germanDateToISO(cols[DATE] ?? '');
      const amountCents = eurToCents(cols[AMOUNT] ?? '');
      if (dateISO === null || amountCents === null) continue; // skip junk rows
      const text = joinDescription(cols[PAYEE] ?? '', cols[PURPOSE] ?? '');
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
