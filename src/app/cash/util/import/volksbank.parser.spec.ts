import { volksbankParser } from './volksbank.parser';

const CSV = [
  'Buchungstag;Valuta;Auftraggeber/Beguenstigter;Verwendungszweck;IBAN;BIC;Betrag;Glaeubiger-ID;Mandatsreferenz;Kundenreferenz',
  '06.01.2026;06.01.2026;Muster GmbH;Honorar Webentwicklung;DE98765432109876543210;MARKDEF1XXX;3.570,00;;;',
  '11.01.2026;11.01.2026;Hosteurope GmbH;Hosting Januar;DE11222233334444555566;DEUTDEDB001;-14,99;;;',
].join('\n');

describe('volksbankParser', () => {
  it('parses signed German amounts and joins payee + purpose', () => {
    const rows = volksbankParser.parse(CSV);
    expect(rows).toHaveLength(2);
    expect(rows[0].amountCents).toBe(357_000);
    expect(rows[0].dateISO.startsWith('2026-01-06')).toBe(true);
    expect(rows[0].description).toBe('Muster GmbH — Honorar Webentwicklung');
    expect(rows[1].amountCents).toBe(-1499);
  });

  it('tolerates a preamble above the header row', () => {
    const rows = volksbankParser.parse('Konto 123\nZeitraum Januar\n' + CSV);
    expect(rows).toHaveLength(2);
  });

  it('returns nothing when the header is absent', () => {
    expect(volksbankParser.parse('nothing;useful\n1;2')).toEqual([]);
  });
});
