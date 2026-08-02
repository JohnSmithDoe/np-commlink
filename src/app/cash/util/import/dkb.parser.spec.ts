import { dkbParser } from './dkb.parser';

const CSV = [
  'Buchungsdatum;Wertstellung;Status;Zahlungspflichtige*r;Zahlungsempfänger*in;Verwendungszweck;Glaeubiger-ID;Mandatsreferenz;IBAN;Betrag (€)',
  '03.01.2026;03.01.2026;Gebucht;Muster GmbH;;Honorar Januar Entwicklung;;; DE98765432109876543210;2.500,00',
  '08.01.2026;08.01.2026;Gebucht;;Amazon Business;Büromaterial Bestellung;DE35ZZZ00000314591;AMZN0001;DE11222233334444555566;-67,89',
  '10.01.2026;10.01.2026;Vorgemerkt;;Spotify;Abo;;;DE22;-9,99',
].join('\n');

describe('dkbParser', () => {
  it('reads the last-column amount and the filled counterparty (payer or payee)', () => {
    const { rows } = dkbParser.parse(CSV);
    expect(rows).toHaveLength(2);
    expect(rows[0].amountCents).toBe(250_000);
    expect(rows[0].description).toBe(
      'Muster GmbH — Honorar Januar Entwicklung'
    );
    expect(rows[1].amountCents).toBe(-6789);
    expect(rows[1].description).toBe(
      'Amazon Business — Büromaterial Bestellung'
    );
  });

  it('skips rows whose Status is not "Gebucht"', () => {
    const { rows } = dkbParser.parse(CSV);
    expect(rows.some((r) => r.description.includes('Spotify'))).toBe(false);
  });
});
