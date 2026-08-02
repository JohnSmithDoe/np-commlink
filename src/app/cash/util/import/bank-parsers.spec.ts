import { BANK_PARSERS, parserForBank } from './bank-parsers';

const DKB_CSV = [
  'Buchungsdatum;Wertstellung;Status;Zahlungspflichtige*r;Zahlungsempfänger*in;Verwendungszweck;Glaeubiger-ID;Mandatsreferenz;IBAN;Betrag (€)',
  '03.01.2026;03.01.2026;Gebucht;Muster GmbH;;Honorar;;;DE98;2.500,00',
].join('\n');

describe('bank parser registry', () => {
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
