export const TEST_IBAN = 'DE81100900004711000100';
export const TEST_REF = '2026010638472910064';
export const TEST_COUNTERPARTY_IBAN = 'DE68500105179876543210';
export const TEST_COUNTERPARTY_BIC = 'NORDDEFFXXX';

interface EntryFixture {
  amount: string;
  direction: 'CRDT' | 'DBIT';
  date: string;
  name: string;
  purpose: string;
  status: 'BOOK' | 'PDNG';
  ref?: string;
  valueDate?: string;
  iban?: string;
  bic?: string;
  endToEndId?: string;
  mandateId?: string;
  purposeCode?: string;
  bankTxCode?: string;
}

const DEFAULT_ENTRY: EntryFixture = {
  amount: '19.99',
  direction: 'DBIT',
  date: '2026-01-06',
  name: 'NORDKAUF Markt GmbH',
  purpose: 'Einkauf',
  status: 'BOOK',
};

const referencesBlock = (entry: EntryFixture): string => {
  const parts = [
    entry.endToEndId ? `<EndToEndId>${entry.endToEndId}</EndToEndId>` : '',
    entry.mandateId ? `<MndtId>${entry.mandateId}</MndtId>` : '',
  ].filter((part) => part.length > 0);
  return parts.length > 0 ? `<Refs>${parts.join('')}</Refs>` : '';
};

export function camtEntry(overrides: Partial<EntryFixture> = {}): string {
  const entry = { ...DEFAULT_ENTRY, ...overrides };
  const party = entry.direction === 'CRDT' ? 'Dbtr' : 'Cdtr';
  const agent = entry.direction === 'CRDT' ? 'DbtrAgt' : 'CdtrAgt';
  return [
    '<Ntry>',
    `<Amt Ccy="EUR">${entry.amount}</Amt>`,
    `<CdtDbtInd>${entry.direction}</CdtDbtInd>`,
    `<Sts><Cd>${entry.status}</Cd></Sts>`,
    `<BookgDt><Dt>${entry.date}</Dt></BookgDt>`,
    entry.valueDate ? `<ValDt><Dt>${entry.valueDate}</Dt></ValDt>` : '',
    entry.ref ? `<AcctSvcrRef>${entry.ref}</AcctSvcrRef>` : '',
    entry.bankTxCode
      ? `<BkTxCd><Prtry><Cd>${entry.bankTxCode}</Cd></Prtry></BkTxCd>`
      : '',
    '<NtryDtls><TxDtls>',
    referencesBlock(entry),
    `<RltdPties><${party}><Pty><Nm>${entry.name}</Nm></Pty></${party}>`,
    entry.iban
      ? `<${party}Acct><Id><IBAN>${entry.iban}</IBAN></Id></${party}Acct>`
      : '',
    '</RltdPties>',
    entry.bic
      ? `<RltdAgts><${agent}><FinInstnId><BICFI>${entry.bic}</BICFI></FinInstnId></${agent}></RltdAgts>`
      : '',
    entry.purposeCode ? `<Purp><Cd>${entry.purposeCode}</Cd></Purp>` : '',
    `<RmtInf><Ustrd>${entry.purpose}</Ustrd></RmtInf>`,
    '</TxDtls></NtryDtls>',
    '</Ntry>',
  ].join('');
}

export function camtBalance(
  amount: string,
  code = 'CLBD',
  direction: 'CRDT' | 'DBIT' = 'CRDT'
): string {
  return [
    '<Bal>',
    `<Tp><CdOrPrtry><Cd>${code}</Cd></CdOrPrtry></Tp>`,
    `<Amt Ccy="EUR">${amount}</Amt>`,
    `<CdtDbtInd>${direction}</CdtDbtInd>`,
    '</Bal>',
  ].join('');
}

export function camtDocument(
  entries: readonly string[],
  iban: string | undefined = TEST_IBAN,
  balances: readonly string[] = []
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.052.001.08">',
    '<BkToCstmrAcctRpt>',
    '<GrpHdr><MsgId>test-message</MsgId></GrpHdr>',
    '<Rpt><Id>test-report</Id>',
    iban ? `<Acct><Id><IBAN>${iban}</IBAN></Id></Acct>` : '',
    balances.join(''),
    entries.join(''),
    '</Rpt>',
    '</BkToCstmrAcctRpt>',
    '</Document>',
  ].join('');
}
