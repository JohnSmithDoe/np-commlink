/**
 * Decode a bank CSV export to text, tolerating the two encodings German banks
 * ship in the wild: UTF-8 and legacy Windows-1252 (CP1252).
 *
 * The page used to read imports with `file.text()`, which always decodes UTF-8.
 * Real Volksbank exports are frequently Windows-1252, so every umlaut in the
 * free-text `Auftraggeber/Beguenstigter` + `Verwendungszweck` fields (and the €
 * sign) would mojibake — "Müller" → "M?ller", "Gebühren" → "Geb?hren".
 *
 * Heuristic: try a **strict** UTF-8 decode first; fall back to Windows-1252 when
 * the bytes aren't valid UTF-8. This is reliable for bank data because a
 * Windows-1252 file carrying any umlaut/€ contains a lone high byte (e.g. 0xFC
 * 'ü', 0x80 '€') that is invalid as standalone UTF-8, so `{ fatal: true }`
 * throws and the fallback catches it. A pure-ASCII file decodes identically
 * under both, and a genuine UTF-8 file decodes on the first try. Windows-1252
 * decoding never throws (every byte maps), so it's a safe last resort.
 */
export function decodeCsv(bytes: ArrayBuffer | Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}
