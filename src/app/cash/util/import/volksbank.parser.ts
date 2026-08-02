import { eurToCents } from '../money.utils';
import {
  findHeaderIndex,
  germanDateToISO,
  BankParser,
  ParsedRow,
  ParseResult,
  joinDescription,
  splitLines,
  splitRow,
} from './bank-parser';

const HEADER = 'Buchungstag';
const DATE = 0;
const PAYEE = 2;
const PURPOSE = 3;
const AMOUNT = 6;

export const volksbankParser: BankParser = {
  parse(text: string): ParseResult {
    const lines = splitLines(text);
    const header = findHeaderIndex(lines, HEADER);
    if (header === -1) return { rows: [], rejected: 0 };

    const rows: ParsedRow[] = [];
    let rejected = 0;
    for (const line of lines.slice(header + 1)) {
      const cols = splitRow(line);
      const dateISO = germanDateToISO(cols[DATE] ?? '');
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
