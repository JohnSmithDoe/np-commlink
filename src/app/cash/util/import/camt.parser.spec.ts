import {
  camtDocument,
  camtEntry,
  TEST_IBAN,
} from '../../testing/camt.test-data';
import { parseCamt } from './camt.parser';

const parseOne = (entry: string) => {
  const report = parseCamt(camtDocument([entry]));
  return report?.entries[0];
};

describe('parseCamt', () => {
  it('reads the account the report belongs to', () => {
    expect(parseCamt(camtDocument([]))?.iban).toBe(TEST_IBAN);
  });

  it('takes the sign from CdtDbtInd, not from the amount', () => {
    expect(parseOne(camtEntry({ direction: 'DBIT' }))?.amountCents).toBe(-1999);
    expect(parseOne(camtEntry({ direction: 'CRDT' }))?.amountCents).toBe(1999);
  });

  it('parses a dot-decimal amount without floating point drift', () => {
    expect(
      parseOne(camtEntry({ amount: '3570.00', direction: 'CRDT' }))?.amountCents
    ).toBe(357_000);
    expect(parseOne(camtEntry({ amount: '0.07' }))?.amountCents).toBe(-7);
  });

  it('treats a whole-euro amount with no fraction as full cents', () => {
    expect(parseOne(camtEntry({ amount: '42' }))?.amountCents).toBe(-4200);
  });

  it('names the counterparty by direction — debtor for money in', () => {
    expect(
      parseOne(camtEntry({ direction: 'CRDT', name: 'Muster GmbH' }))
        ?.description
    ).toBe('Muster GmbH — Einkauf');
  });

  it('carries AcctSvcrRef through as the bank reference', () => {
    expect(parseOne(camtEntry({ ref: 'ABC123' }))?.bankRef).toBe('ABC123');
    expect(parseOne(camtEntry())?.bankRef).toBeUndefined();
  });

  it('keeps a 19-digit reference as text, where a number would round it', () => {
    const reference = '2026043042104045000';
    const sibling = '2026043042104045001';

    expect(parseOne(camtEntry({ ref: reference }))?.bankRef).toBe(reference);
    expect(parseOne(camtEntry({ ref: sibling }))?.bankRef).toBe(sibling);
    expect(Number(sibling).toString()).toBe(reference); // two entries, one float
  });

  it('maps a PDNG entry to pending and a BOOK entry to confirmed', () => {
    expect(parseOne(camtEntry({ status: 'PDNG' }))?.status).toBe('pending');
    expect(parseOne(camtEntry({ status: 'BOOK' }))?.status).toBe('confirmed');
  });

  it('collapses the fixed-width padding a statement pads Ustrd with', () => {
    const entry = camtEntry({
      purpose: 'Kapitalertragsteuer aus    EUR       12,34 Habenzins',
    });
    expect(parseOne(entry)?.description).toBe(
      'REWE Markt GmbH — Kapitalertragsteuer aus EUR 12,34 Habenzins'
    );
  });

  it('falls back to AddtlNtryInf when the entry carries no remittance text', () => {
    const bare = [
      '<Ntry>',
      '<Amt Ccy="EUR">10.00</Amt><CdtDbtInd>DBIT</CdtDbtInd>',
      '<BookgDt><Dt>2026-01-06</Dt></BookgDt>',
      '<AddtlNtryInf>ABSCHLUSS</AddtlNtryInf>',
      '</Ntry>',
    ].join('');
    expect(parseOne(bare)?.description).toBe('ABSCHLUSS');
  });

  it('reads one row per Ntry, never one per TxDtls — a batch moves once', () => {
    const batched = [
      '<Ntry>',
      '<Amt Ccy="EUR">30.00</Amt><CdtDbtInd>DBIT</CdtDbtInd>',
      '<BookgDt><Dt>2026-01-06</Dt></BookgDt>',
      '<NtryDtls>',
      '<TxDtls><RmtInf><Ustrd>Teil A</Ustrd></RmtInf></TxDtls>',
      '<TxDtls><RmtInf><Ustrd>Teil B</Ustrd></RmtInf></TxDtls>',
      '</NtryDtls>',
      '</Ntry>',
    ].join('');
    const report = parseCamt(camtDocument([batched]));
    expect(report?.entries).toHaveLength(1);
    expect(report?.entries[0].amountCents).toBe(-3000);
    expect(report?.entries[0].description).toBe('Teil A Teil B');
  });

  it('counts an entry it cannot read instead of dropping it silently', () => {
    const broken = '<Ntry><Amt Ccy="EUR">nonsense</Amt></Ntry>';
    const report = parseCamt(camtDocument([camtEntry(), broken]));
    expect(report?.entries).toHaveLength(1);
    expect(report?.rejected).toBe(1);
  });

  it('accepts a camt.053 statement, not only the 052 report', () => {
    const statement = [
      '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">',
      '<BkToCstmrStmt><Stmt>',
      `<Acct><Id><IBAN>${TEST_IBAN}</IBAN></Id></Acct>`,
      camtEntry(),
      '</Stmt></BkToCstmrStmt></Document>',
    ].join('');
    const report = parseCamt(statement);
    expect(report?.iban).toBe(TEST_IBAN);
    expect(report?.entries).toHaveLength(1);
  });

  it('reads a version that inlines the status code instead of wrapping it', () => {
    const inlined = camtEntry().replace(
      '<Sts><Cd>BOOK</Cd></Sts>',
      '<Sts>PDNG</Sts>'
    );
    expect(parseOne(inlined)?.status).toBe('pending');
  });

  it('reads a version that omits the Pty wrapper around a party name', () => {
    const flat = camtEntry({ direction: 'CRDT' })
      .replace('<Pty><Nm>', '<Nm>')
      .replace('</Nm></Pty>', '</Nm>');
    expect(parseOne(flat)?.description).toBe('REWE Markt GmbH — Einkauf');
  });

  it('rejects a document that is not camt rather than reporting it empty', () => {
    expect(parseCamt('<html><body>nope</body></html>')).toBeNull();
    expect(parseCamt('Buchungstag;Betrag')).toBeNull();
    expect(parseCamt('')).toBeNull();
  });
});
