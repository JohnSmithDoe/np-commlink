export const formatSecondsAsClock = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.trunc(totalSeconds));
  const hh = Math.trunc(safe / 3600);
  const mm = Math.trunc((safe % 3600) / 60);
  const ss = safe % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
};

// RFC 4180: wrap in quotes if the field contains comma, quote, CR or LF;
// embedded quotes are doubled.
const csvEscape = (value: unknown): string => {
  const s = value == null ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const csvRow = (fields: unknown[]): string =>
  fields.map(csvEscape).join(',');
