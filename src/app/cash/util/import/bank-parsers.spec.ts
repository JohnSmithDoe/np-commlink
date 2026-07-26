import { BANK_OPTIONS, BANK_PARSERS, parserForBank } from './bank-parsers';

// The registry only routes: each parser's own column handling is covered by
// dkb.parser.spec / volksbank.parser.spec. What is asserted here is the
// selection — an account's `bank` reaching the parser that understands it.

const DKB_CSV = [
  'Buchungsdatum;Wertstellung;Status;Zahlungspflichtige*r;Zahlungsempfänger*in;Verwendungszweck;Glaeubiger-ID;Mandatsreferenz;IBAN;Betrag (€)',
  '03.01.2026;03.01.2026;Gebucht;Muster GmbH;;Honorar;;;DE98;2.500,00',
].join('\n');

describe('bank parser registry', () => {
  it('offers a parser for every bank in the account picker', () => {
    expect(Object.keys(BANK_PARSERS).toSorted()).toEqual(
      BANK_OPTIONS.toSorted()
    );
  });

  // A parser filed under the wrong key would silently import a foreign format.
  it('files every parser under its own bank key', () => {
    for (const [bank, parser] of Object.entries(BANK_PARSERS)) {
      expect(parser.bank).toBe(bank);
    }
  });

  it('selects the parser the account bank names', () => {
    expect(parserForBank('dkb')?.label).toBe('DKB');
    expect(parserForBank('volksbank')?.label).toBe('Volksbank');
  });

  it('has no parser for a manual-only account', () => {
    expect(parserForBank(undefined)).toBeUndefined();
  });

  it('routes an export to the only parser that recognises its header', () => {
    expect(parserForBank('dkb')?.parse(DKB_CSV).rows).toHaveLength(1);
    expect(parserForBank('volksbank')?.parse(DKB_CSV).rows).toEqual([]);
  });

  it('yields no rows from a file no parser recognises', () => {
    const foreign = 'Date,Amount\n2026-01-03,25.00';
    for (const parser of Object.values(BANK_PARSERS)) {
      expect(parser.parse(foreign).rows).toEqual([]);
    }
  });
});
