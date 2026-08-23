import {
  camtBalance,
  camtDocument,
  camtEntry,
  TEST_COUNTERPARTY_BIC,
  TEST_COUNTERPARTY_IBAN,
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
      parseOne(camtEntry({ direction: 'CRDT', name: 'Kestrel Systems GmbH' }))
        ?.description
    ).toBe('Kestrel Systems GmbH — Einkauf');
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
      'NORDKAUF Markt GmbH — Kapitalertragsteuer aus EUR 12,34 Habenzins'
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

  it('resumes a full Ustrd line without a space, so a split IBAN survives', () => {
    const iban = 'DE00123456789012345678';
    const head = 'RECHNUNG 4711 IBAN '.padEnd(140 - 8, 'X') + iban.slice(0, 8);
    const split = [
      '<Ntry>',
      '<Amt Ccy="EUR">30.00</Amt><CdtDbtInd>DBIT</CdtDbtInd>',
      '<BookgDt><Dt>2026-01-06</Dt></BookgDt>',
      '<NtryDtls><TxDtls><RmtInf>',
      `<Ustrd>${head}</Ustrd>`,
      `<Ustrd>${iban.slice(8)} DANKE</Ustrd>`,
      '</RmtInf></TxDtls></NtryDtls>',
      '</Ntry>',
    ].join('');

    expect(head).toHaveLength(140);
    expect(parseOne(split)?.remittanceInfo).toBe(
      `${head}${iban.slice(8)} DANKE`
    );
    expect(parseOne(split)?.remittanceInfo).toContain(iban);
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
    expect(parseOne(flat)?.description).toBe('NORDKAUF Markt GmbH — Einkauf');
  });

  it('keeps the counterparty and the purpose apart, not only joined', () => {
    const entry = parseOne(
      camtEntry({
        iban: TEST_COUNTERPARTY_IBAN,
        bic: TEST_COUNTERPARTY_BIC,
      })
    );
    expect(entry?.counterpartyName).toBe('NORDKAUF Markt GmbH');
    expect(entry?.remittanceInfo).toBe('Einkauf');
    expect(entry?.counterpartyIban).toBe(TEST_COUNTERPARTY_IBAN);
    expect(entry?.counterpartyBic).toBe(TEST_COUNTERPARTY_BIC);
    expect(entry?.description).toBe('NORDKAUF Markt GmbH — Einkauf');
  });

  it('reads the counterparty account by direction — debtor for money in', () => {
    const incoming = parseOne(
      camtEntry({ direction: 'CRDT', iban: TEST_COUNTERPARTY_IBAN })
    );
    expect(incoming?.counterpartyIban).toBe(TEST_COUNTERPARTY_IBAN);
  });

  it('reads the references a rule can match on', () => {
    const entry = parseOne(
      camtEntry({
        endToEndId: 'NOTPROVIDED',
        mandateId: 'MND-00042',
        purposeCode: 'GDDS',
        bankTxCode: 'NDDT',
        valueDate: '2026-01-08',
      })
    );
    expect(entry?.endToEndId).toBe('NOTPROVIDED');
    expect(entry?.mandateId).toBe('MND-00042');
    expect(entry?.purposeCode).toBe('GDDS');
    expect(entry?.bankTxCode).toBe('NDDT');
    expect(entry?.valueDateISO).toContain('2026-01-08');
  });

  it('leaves a field absent rather than empty when the entry omits it', () => {
    const entry = parseOne(camtEntry());
    expect(entry?.counterpartyIban).toBeUndefined();
    expect(entry?.mandateId).toBeUndefined();
    expect(entry?.purposeCode).toBeUndefined();
  });

  it('reads a version that spells a BIC BIC instead of BICFI', () => {
    const older = camtEntry({ bic: TEST_COUNTERPARTY_BIC })
      .replace('<BICFI>', '<BIC>')
      .replace('</BICFI>', '</BIC>');
    expect(parseOne(older)?.counterpartyBic).toBe(TEST_COUNTERPARTY_BIC);
  });

  it('takes the structured detail from the first TxDtls that carries it', () => {
    const batched = [
      '<Ntry>',
      '<Amt Ccy="EUR">30.00</Amt><CdtDbtInd>DBIT</CdtDbtInd>',
      '<BookgDt><Dt>2026-01-06</Dt></BookgDt>',
      '<NtryDtls>',
      '<TxDtls><RmtInf><Ustrd>Teil A</Ustrd></RmtInf></TxDtls>',
      `<TxDtls><RltdPties><Cdtr><Nm>Kestrel Systems GmbH</Nm></Cdtr></RltdPties></TxDtls>`,
      '</NtryDtls>',
      '</Ntry>',
    ].join('');
    const entry = parseOne(batched);
    expect(entry?.counterpartyName).toBe('Kestrel Systems GmbH');
    expect(entry?.remittanceInfo).toBe('Teil A');
  });

  it('reads the closing balance and ignores every other balance kind', () => {
    const report = parseCamt(
      camtDocument([camtEntry()], TEST_IBAN, [
        camtBalance('100.00', 'OPBD'),
        camtBalance('1234.56', 'CLBD'),
        camtBalance('999.00', 'CLAV'),
      ])
    );
    expect(report?.closingBalanceCents).toBe(123_456);
  });

  it('signs an overdrawn closing balance from CdtDbtInd', () => {
    const report = parseCamt(
      camtDocument([], TEST_IBAN, [camtBalance('50.00', 'CLBD', 'DBIT')])
    );
    expect(report?.closingBalanceCents).toBe(-5000);
  });

  it('leaves the closing balance absent when the statement carries none', () => {
    expect(
      parseCamt(camtDocument([camtEntry()]))?.closingBalanceCents
    ).toBeUndefined();
  });

  it('rejects a document that is not camt rather than reporting it empty', () => {
    expect(parseCamt('<html><body>nope</body></html>')).toBeNull();
    expect(parseCamt('Buchungstag;Betrag')).toBeNull();
    expect(parseCamt('')).toBeNull();
  });
});
