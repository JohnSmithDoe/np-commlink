export const TEST_IBAN = 'DE81100900004711000100';
export const TEST_REF = '2026010638472910064';

interface EntryFixture {
  amount: string;
  direction: 'CRDT' | 'DBIT';
  date: string;
  name: string;
  purpose: string;
  status: 'BOOK' | 'PDNG';
  ref?: string;
}

const DEFAULT_ENTRY: EntryFixture = {
  amount: '19.99',
  direction: 'DBIT',
  date: '2026-01-06',
  name: 'REWE Markt GmbH',
  purpose: 'Einkauf',
  status: 'BOOK',
};

export function camtEntry(overrides: Partial<EntryFixture> = {}): string {
  const entry = { ...DEFAULT_ENTRY, ...overrides };
  const party = entry.direction === 'CRDT' ? 'Dbtr' : 'Cdtr';
  return [
    '<Ntry>',
    `<Amt Ccy="EUR">${entry.amount}</Amt>`,
    `<CdtDbtInd>${entry.direction}</CdtDbtInd>`,
    `<Sts><Cd>${entry.status}</Cd></Sts>`,
    `<BookgDt><Dt>${entry.date}</Dt></BookgDt>`,
    entry.ref ? `<AcctSvcrRef>${entry.ref}</AcctSvcrRef>` : '',
    '<NtryDtls><TxDtls>',
    `<RltdPties><${party}><Pty><Nm>${entry.name}</Nm></Pty></${party}></RltdPties>`,
    `<RmtInf><Ustrd>${entry.purpose}</Ustrd></RmtInf>`,
    '</TxDtls></NtryDtls>',
    '</Ntry>',
  ].join('');
}

export function camtDocument(
  entries: readonly string[],
  iban: string | undefined = TEST_IBAN
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.052.001.08">',
    '<BkToCstmrAcctRpt>',
    '<GrpHdr><MsgId>test-message</MsgId></GrpHdr>',
    '<Rpt><Id>test-report</Id>',
    iban ? `<Acct><Id><IBAN>${iban}</IBAN></Id></Acct>` : '',
    entries.join(''),
    '</Rpt>',
    '</BkToCstmrAcctRpt>',
    '</Document>',
  ].join('');
}
