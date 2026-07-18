import { decodeCsv } from './read-csv';

describe('decodeCsv', () => {
  it('decodes pure ASCII unchanged', () => {
    const bytes = new TextEncoder().encode('Buchungstag;Betrag');
    expect(decodeCsv(bytes)).toBe('Buchungstag;Betrag');
  });

  it('decodes a UTF-8 export (umlauts) on the first try', () => {
    // Genuine UTF-8 bytes for the umlauts — the strict UTF-8 decode succeeds.
    const bytes = new TextEncoder().encode('Müller;Gebühren');
    expect(decodeCsv(bytes)).toBe('Müller;Gebühren');
  });

  it('falls back to Windows-1252 for a legacy export (umlauts)', () => {
    // "Müller" in CP1252: 'ü' is a lone 0xFC byte, invalid as standalone UTF-8,
    // so the strict UTF-8 decode throws and we fall back to Windows-1252.
    const bytes = new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72]);
    expect(decodeCsv(bytes)).toBe('Müller');
  });

  it('falls back to Windows-1252 for the € sign (0x80)', () => {
    // "Café €" in CP1252: 'é' = 0xE9, '€' = 0x80 — both invalid standalone UTF-8.
    const bytes = new Uint8Array([0x43, 0x61, 0x66, 0xe9, 0x20, 0x80]);
    expect(decodeCsv(bytes)).toBe('Café €');
  });

  it('accepts an ArrayBuffer (what File.arrayBuffer() returns)', () => {
    const buffer = new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72]).buffer;
    expect(decodeCsv(buffer)).toBe('Müller');
  });
});
