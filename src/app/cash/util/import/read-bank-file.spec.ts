import { strToU8, zipSync } from 'fflate';
import { decodeBankFile, readStatementDocuments } from './read-bank-file';

const fileOf = (bytes: Uint8Array, name: string): File =>
  new File([bytes as BlobPart], name);

const zipOf = (members: Record<string, string>): Uint8Array =>
  zipSync(
    Object.fromEntries(
      Object.entries(members).map(([name, text]) => [name, strToU8(text)])
    )
  );

describe('decodeBankFile', () => {
  it('decodes a UTF-8 export (umlauts) on the first try', () => {
    const bytes = new TextEncoder().encode('Müller;Gebühren');
    expect(decodeBankFile(bytes)).toBe('Müller;Gebühren');
  });

  it('falls back to Windows-1252 for the ISO-8859-1 a camt declares', () => {
    const bytes = new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72]);
    expect(decodeBankFile(bytes)).toBe('Müller');
  });

  it('accepts an ArrayBuffer (what File.arrayBuffer() returns)', () => {
    const buffer = new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72]).buffer;
    expect(decodeBankFile(buffer)).toBe('Müller');
  });
});

describe('readStatementDocuments', () => {
  it('reads a plain XML pick as one document', async () => {
    const file = fileOf(strToU8('<Document/>'), 'report.xml');

    expect(await readStatementDocuments([file])).toEqual(['<Document/>']);
  });

  it('unpacks a zip and returns its XML members in page order', async () => {
    const zip = zipOf({
      'report_000002.xml': '<two/>',
      'report_000001.xml': '<one/>',
      'report_000003.xml': '<three/>',
    });

    const documents = await readStatementDocuments([fileOf(zip, 'export.zip')]);

    expect(documents).toEqual(['<one/>', '<two/>', '<three/>']);
  });

  it('orders unpadded page numbers numerically, not as strings', async () => {
    const zip = zipOf({
      'page10.xml': '<ten/>',
      'page2.xml': '<two/>',
      'page1.xml': '<one/>',
    });

    expect(await readStatementDocuments([fileOf(zip, 'export.zip')])).toEqual([
      '<one/>',
      '<two/>',
      '<ten/>',
    ]);
  });

  it('detects a zip by its magic bytes, not by the name it was saved under', async () => {
    const zip = zipOf({ 'report.xml': '<one/>' });

    expect(await readStatementDocuments([fileOf(zip, 'download')])).toEqual([
      '<one/>',
    ]);
  });

  it('skips the non-XML clutter an archiver adds', async () => {
    const zip = zipOf({
      'report.xml': '<one/>',
      'readme.txt': 'ignore me',
      '__MACOSX/report.xml': 'resource fork',
    });

    expect(await readStatementDocuments([fileOf(zip, 'export.zip')])).toEqual([
      '<one/>',
    ]);
  });

  it('rejects a truncated archive rather than importing the half it read', async () => {
    const truncated = zipOf({ 'report.xml': '<one/>' }).slice(0, 20);

    await expect(
      readStatementDocuments([fileOf(truncated, 'export.zip')])
    ).rejects.toThrow();
  });

  it('flattens a mixed pick of loose files and archives', async () => {
    const files = [
      fileOf(strToU8('<loose/>'), 'loose.xml'),
      fileOf(zipOf({ 'inner.xml': '<inner/>' }), 'export.zip'),
    ];

    expect(await readStatementDocuments(files)).toEqual([
      '<loose/>',
      '<inner/>',
    ]);
  });
});
