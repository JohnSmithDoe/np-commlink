interface Versioned<T> {
  v: number;
  data: T;
}

export type MigrationStep = (data: unknown) => unknown;

const isVersioned = (raw: unknown): raw is Versioned<unknown> =>
  typeof raw === 'object' &&
  raw !== null &&
  'v' in raw &&
  'data' in raw &&
  typeof (raw as { v: unknown }).v === 'number';

export const wrapVersioned = <T>(v: number, data: T): Versioned<T> => ({
  v,
  data,
});

export function runMigrations<T>(
  raw: unknown,
  current: number,
  ladder: MigrationStep[]
): T | null {
  if (raw === null || raw === undefined) return null;
  const stored = isVersioned(raw) ? raw.v : 1;
  let data: unknown = isVersioned(raw) ? raw.data : raw;
  for (let from = stored; from < current; from++) {
    const step = ladder[from - 1];
    if (step) data = step(data);
  }
  return data as T;
}
