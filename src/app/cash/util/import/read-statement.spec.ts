import {
  camtDocument,
  camtEntry,
  TEST_IBAN,
  TEST_REF,
} from '../../testing/camt.test-data';
import { readStatement } from './read-statement';

const OTHER_IBAN = 'DE97100900004711000200';

describe('readStatement', () => {
  it('concatenates the pages a paginated export splits an account across', () => {
    const read = readStatement([
      camtDocument([camtEntry({ ref: 'a' }), camtEntry({ ref: 'b' })]),
      camtDocument([camtEntry({ ref: 'c' })]),
    ]);

    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') return;
    expect(read.parsed.rows.map((row) => row.key)).toEqual(['a', 'b', 'c']);
  });

  it('sums the rejected count across pages', () => {
    const broken = '<Ntry><Amt Ccy="EUR">x</Amt></Ntry>';
    const read = readStatement([
      camtDocument([broken]),
      camtDocument([broken]),
    ]);

    expect(read.kind === 'ok' && read.parsed.rejected).toBe(2);
  });

  it('derives a key for an entry the bank gave no reference', () => {
    const read = readStatement([camtDocument([camtEntry()])]);

    expect(read.kind === 'ok' && read.parsed.rows[0].key).toBe(
      '20260106|-1999|NORDKAUF Markt GmbH — Einkauf|1'
    );
  });

  it('derives the same key from the same entry, so a re-import dedups', () => {
    const first = readStatement([camtDocument([camtEntry()])]);
    const second = readStatement([camtDocument([camtEntry()])]);

    expect(first.kind === 'ok' && first.parsed.rows[0].key).toBe(
      second.kind === 'ok' ? second.parsed.rows[0].key : ''
    );
  });

  it('numbers genuinely identical entries apart instead of collapsing them', () => {
    const read = readStatement([camtDocument([camtEntry(), camtEntry()])]);

    expect(
      read.kind === 'ok' && read.parsed.rows.map((row) => row.key)
    ).toEqual([
      '20260106|-1999|NORDKAUF Markt GmbH — Einkauf|1',
      '20260106|-1999|NORDKAUF Markt GmbH — Einkauf|2',
    ]);
  });

  it('numbers across pages, not within one — a boundary must not restart at 1', () => {
    const read = readStatement([
      camtDocument([camtEntry()]),
      camtDocument([camtEntry()]),
    ]);

    expect(read.kind === 'ok' && read.parsed.rows[1].key).toContain('|2');
  });

  it('never numbers a referenced entry — the bank already made it unique', () => {
    const read = readStatement([
      camtDocument([camtEntry({ ref: 'x' }), camtEntry({ ref: 'x' })]),
    ]);

    expect(
      read.kind === 'ok' && read.parsed.rows.map((row) => row.key)
    ).toEqual(['x', 'x']);
  });

  it('uses a bank reference verbatim, so it keeps the date the bank put there', () => {
    const read = readStatement([camtDocument([camtEntry({ ref: TEST_REF })])]);

    expect(read.kind === 'ok' && read.parsed.rows[0].key).toBe(TEST_REF);
  });

  it('opens a derived key with the same YYYYMMDD a reference opens with', () => {
    const read = readStatement([camtDocument([camtEntry()])]);

    expect(read.kind === 'ok' && read.parsed.rows[0].key).toMatch(/^20260106/);
    expect(TEST_REF).toMatch(/^20260106/);
  });

  it('cannot derive a key a bank reference could equal — segments, not digits', () => {
    const read = readStatement([camtDocument([camtEntry()])]);
    const key = read.kind === 'ok' ? read.parsed.rows[0].key : '';

    expect(key.split('|')).toHaveLength(4);
    expect(TEST_REF).not.toContain('|');
  });

  it('reports the account the statement actually belongs to', () => {
    const read = readStatement([camtDocument([camtEntry()])], OTHER_IBAN);

    expect(read).toEqual({ kind: 'wrong-account', found: TEST_IBAN });
  });

  it('ignores spacing and case when comparing the IBAN', () => {
    const read = readStatement(
      [camtDocument([camtEntry()])],
      'de81 1009 0000 4711 0001 00'
    );

    expect(read.kind).toBe('ok');
  });

  it('refuses a pick that mixes two accounts, even with nothing to compare to', () => {
    const read = readStatement([
      camtDocument([camtEntry()], TEST_IBAN),
      camtDocument([camtEntry()], OTHER_IBAN),
    ]);

    expect(read).toEqual({ kind: 'wrong-account', found: OTHER_IBAN });
  });

  it('hands back the IBAN it read so an account with none can adopt it', () => {
    const read = readStatement([camtDocument([camtEntry()])]);

    expect(read.kind === 'ok' && read.iban).toBe(TEST_IBAN);
  });

  it('imports a statement that names no account rather than refusing it', () => {
    const read = readStatement([camtDocument([camtEntry()], '')]);

    expect(read.kind).toBe('ok');
    expect(read.kind === 'ok' && read.iban).toBeUndefined();
  });

  it('calls a pick with no camt document in it unreadable', () => {
    expect(readStatement(['Buchungstag;Betrag'])).toEqual({
      kind: 'unreadable',
    });
    expect(readStatement([])).toEqual({ kind: 'unreadable' });
  });

  it('reads the camt documents in a pick that also holds junk', () => {
    const read = readStatement(['not xml', camtDocument([camtEntry()])]);

    expect(read.kind === 'ok' && read.parsed.rows).toHaveLength(1);
  });
});
