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

// Volksbank giro export. `;`-delimited, header first:
// Buchungstag;Valuta;Auftraggeber/Beguenstigter;Verwendungszweck;IBAN;BIC;Betrag;…
const HEADER = 'Buchungstag';
const DATE = 0;
const PAYEE = 2;
const PURPOSE = 3;
const AMOUNT = 6;

export const volksbankParser: IBankParser = {
  parse(text: string): IParseResult {
    const lines = splitLines(text);
    const header = findHeaderIndex(lines, HEADER);
    if (header === -1) return { rows: [], rejected: 0 };

    const rows: IParsedRow[] = [];
    let rejected = 0;
    for (const line of lines.slice(header + 1)) {
      const cols = splitRow(line);
      const dateISO = germanDateToISO(cols[DATE] ?? '');
      // Explicitly German, never the UI language: a German bank's export is
      // German whatever the app is set to, and the two conventions read each
      // other's amounts as valid (`1.234` is 1234 € here, 1.23 € under `en`).
      const amountCents = eurToCents(cols[AMOUNT] ?? '', 'de');
      if (dateISO === null || amountCents === null) {
        rejected++;
        continue;
      }
      rows.push({
        dateISO,
        amountCents,
        description: joinDescription(cols[PAYEE] ?? '', cols[PURPOSE] ?? ''),
      });
    }
    return { rows, rejected };
  },
};
