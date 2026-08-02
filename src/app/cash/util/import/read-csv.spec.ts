import { decodeCsv } from './read-csv';

describe('decodeCsv', () => {
  it('decodes pure ASCII unchanged', () => {
    const bytes = new TextEncoder().encode('Buchungstag;Betrag');
    expect(decodeCsv(bytes)).toBe('Buchungstag;Betrag');
  });

  it('decodes a UTF-8 export (umlauts) on the first try', () => {
    const bytes = new TextEncoder().encode('Müller;Gebühren');
    expect(decodeCsv(bytes)).toBe('Müller;Gebühren');
  });

  it('falls back to Windows-1252 for a legacy export (umlauts)', () => {
    const bytes = new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72]);
    expect(decodeCsv(bytes)).toBe('Müller');
  });

  it('falls back to Windows-1252 for the € sign (0x80)', () => {
    const bytes = new Uint8Array([0x43, 0x61, 0x66, 0xe9, 0x20, 0x80]);
    expect(decodeCsv(bytes)).toBe('Café €');
  });

  it('accepts an ArrayBuffer (what File.arrayBuffer() returns)', () => {
    const buffer = new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72]).buffer;
    expect(decodeCsv(buffer)).toBe('Müller');
  });
});
