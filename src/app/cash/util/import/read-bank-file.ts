/* ─── why ─────────────────────────────────────────────────────────
 * A statement arrives as whatever the bank's download button produced: one
 * XML, several of them because the export paginates, or a zip because it
 * paginated. Extension is not the question — the ZIP magic number is, so a
 * `.zip` renamed by a phone's download manager still works.
 *
 * `fflate` loads only once someone actually picks an archive. It is the
 * one import path that needs inflate, and a bundle should not carry it for
 * the case that never happens.
 *
 * Members sort by name because pages are numbered, and a statement read
 * out of order still imports, but reads wrong in the preview.
 * ───────────────────────────────────────────────────────────────── */
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

export function decodeBankFile(bytes: ArrayBuffer | Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

const isZip = (bytes: Uint8Array): boolean =>
  ZIP_MAGIC.every((byte, index) => bytes[index] === byte);

const isXmlMember = (name: string): boolean =>
  name.toLowerCase().endsWith('.xml') && !name.startsWith('__MACOSX/');

async function unzipXml(bytes: Uint8Array): Promise<string[]> {
  const { unzipSync } = await import('fflate');
  const members = unzipSync(bytes, {
    filter: (file) => isXmlMember(file.name),
  });
  return Object.entries(members)
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([, bytes]) => decodeBankFile(bytes));
}

export async function readStatementDocuments(
  files: readonly File[]
): Promise<string[]> {
  const documents: string[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    documents.push(
      ...(isZip(bytes) ? await unzipXml(bytes) : [decodeBankFile(bytes)])
    );
  }
  return documents;
}
