import { splitRow } from './bank-parser';
import { dkbParser } from './dkb.parser';
import { volksbankParser } from './volksbank.parser';

describe('splitRow', () => {
  it('splits a plain delimited row', () => {
    expect(splitRow('a;b;c')).toEqual(['a', 'b', 'c']);
  });

  it('keeps a delimiter that sits inside a quoted field', () => {
    // The failure this exists for: a `;` in a Verwendungszweck used to shift
    // every column right, so the amount column held a BIC and the row was
    // dropped as unparseable.
    expect(splitRow('03.01.2026;"Rechnung 12; Rest 34";-67,89')).toEqual([
      '03.01.2026',
      'Rechnung 12; Rest 34',
      '-67,89',
    ]);
  });

  it('unescapes a doubled quote inside a quoted field', () => {
    expect(splitRow('a;"say ""hi""";b')).toEqual(['a', 'say "hi"', 'b']);
  });

  it('strips the quotes from a fully quoted row', () => {
    expect(splitRow('"Buchungstag";"Valuta";"Betrag"')).toEqual([
      'Buchungstag',
      'Valuta',
      'Betrag',
    ]);
  });

  it('yields an empty field for an empty column', () => {
    expect(splitRow('a;;c')).toEqual(['a', '', 'c']);
  });
});

describe('quoted exports', () => {
  // A fully quoted export is what both banks produce once a field needs
  // escaping. Before quote-awareness the header lookup failed, `parse` returned
  // nothing, and the preview said "Keine neuen Buchungen" — reporting a
  // perfectly readable file as an empty one.
  it('finds the header and the amounts in a quoted volksbank export', () => {
    const csv = [
      '"Buchungstag";"Valuta";"Auftraggeber/Beguenstigter";"Verwendungszweck";"IBAN";"BIC";"Betrag"',
      '"06.01.2026";"06.01.2026";"Muster GmbH";"Honorar; Teil 1";"DE98";"MARKDEF1XXX";"3.570,00"',
    ].join('\n');

    const { rows, rejected } = volksbankParser.parse(csv);

    expect(rejected).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].amountCents).toBe(357_000);
    expect(rows[0].description).toBe('Muster GmbH — Honorar; Teil 1');
  });

  it('counts rows it cannot read instead of dropping them silently', () => {
    const csv = [
      'Buchungstag;Valuta;Auftraggeber/Beguenstigter;Verwendungszweck;IBAN;BIC;Betrag',
      '06.01.2026;06.01.2026;Muster GmbH;Honorar;DE98;MARKDEF1XXX;3.570,00',
      'not-a-date;;Kaputt;;;;nonsense',
    ].join('\n');

    const { rows, rejected } = volksbankParser.parse(csv);

    expect(rows).toHaveLength(1);
    expect(rejected).toBe(1);
  });

  it('does not count a pending DKB row as rejected — it was understood, then skipped', () => {
    const csv = [
      'Buchungsdatum;Wertstellung;Status;Zahlungspflichtige*r;Zahlungsempfänger*in;Verwendungszweck;Glaeubiger-ID;Mandatsreferenz;IBAN;Betrag (€)',
      '03.01.2026;03.01.2026;Gebucht;Muster GmbH;;Honorar;;;DE98;2.500,00',
      '10.01.2026;10.01.2026;Vorgemerkt;;Spotify;Abo;;;DE22;-9,99',
    ].join('\n');

    const { rows, rejected } = dkbParser.parse(csv);

    expect(rows).toHaveLength(1);
    expect(rejected).toBe(0);
  });
});
