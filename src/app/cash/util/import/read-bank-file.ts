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
 * Members sort by name because pages are numbered — NUMERICALLY, because a
 * bank that does not zero-pad puts page 10 before page 2 under an ordinary
 * string compare, and the last page read is the one whose closing balance
 * the preview checks itself against.
 * ───────────────────────────────────────────────────────────────── */
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];
const byPage = new Intl.Collator('en', { numeric: true });

const utf8 = new TextDecoder('utf-8', { fatal: true });
const windows1252 = new TextDecoder('windows-1252');

const isContinuation = (byte: number | undefined): boolean =>
  byte !== undefined && byte >= 0x80 && byte <= 0xbf;

const leadLength = (byte: number): number => {
  if (byte < 0x80) return 1;
  if (byte >= 0xc2 && byte <= 0xdf) return 2;
  if (byte >= 0xe0 && byte <= 0xef) return 3;
  return byte >= 0xf0 && byte <= 0xf4 ? 4 : 0;
};

const utf8SequenceAt = (bytes: Uint8Array, at: number): number => {
  const length = leadLength(bytes[at] ?? 0);
  for (let offset = 1; offset < length; offset++) {
    if (!isContinuation(bytes[at + offset])) return 0;
  }
  return length;
};

const utf8OrNull = (slice: Uint8Array): string | null => {
  try {
    return utf8.decode(slice);
  } catch {
    return null;
  }
};

const decodeMixed = (bytes: Uint8Array): string => {
  let text = '';
  let at = 0;
  while (at < bytes.length) {
    const length = utf8SequenceAt(bytes, at);
    const decoded =
      length > 0 ? utf8OrNull(bytes.subarray(at, at + length)) : null;
    const end = at + (decoded === null ? 1 : length);
    text += decoded ?? windows1252.decode(bytes.subarray(at, end));
    at = end;
  }
  return text;
};

export function decodeBankFile(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  try {
    return utf8.decode(view);
  } catch {
    return decodeMixed(view);
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
    .toSorted(([left], [right]) => byPage.compare(left, right))
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
