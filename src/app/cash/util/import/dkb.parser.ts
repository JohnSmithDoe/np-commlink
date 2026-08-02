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

const HEADER = 'Buchungsdatum';
const DATE = 0;
const STATUS = 2;
const PAYER = 3;
const PAYEE = 4;
const PURPOSE = 5;
const AMOUNT = 9;

export const dkbParser: BankParser = {
  parse(text: string): ParseResult {
    const lines = splitLines(text);
    const header = findHeaderIndex(lines, HEADER);
    if (header === -1) return { rows: [], rejected: 0 };

    const rows: ParsedRow[] = [];
    let rejected = 0;
    for (const line of lines.slice(header + 1)) {
      const cols = splitRow(line);
      const status = cols[STATUS] ?? '';
      if (status && status !== 'Gebucht') continue; // skip pending/rejected
      const dateISO = germanDateToISO(cols[DATE] ?? '');
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
