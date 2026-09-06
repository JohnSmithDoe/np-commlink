import { QUANTITIES, QUANTITY_BY_ID, unitsNamed } from '../model/units.catalog';
import { Unit } from '../model/units.types';
import { convert, formatNumber, humanize } from './convert.utils';

const at = (quantity: Parameters<typeof unitsNamed>[0], id: string): Unit =>
  unitsNamed(quantity, [id])[0]!;

const ratio = (
  quantity: Parameters<typeof unitsNamed>[0],
  from: string,
  to: string
): number => convert(1, at(quantity, from), at(quantity, to));

describe('convert', () => {
  it('leaves a unit converted to itself alone', () => {
    const metre = at('length', 'm');
    expect(convert(42, metre, metre)).toBe(42);
  });

  it('converts a plain ratio and back', () => {
    const m = at('length', 'm');
    const ft = at('length', 'ft');
    expect(convert(1, m, ft)).toBeCloseTo(3.28084, 5);
    expect(convert(convert(1, m, ft), ft, m)).toBeCloseTo(1, 10);
  });

  it('converts the affine quantity in both directions', () => {
    const c = at('temperature', 'c');
    const f = at('temperature', 'f');
    const k = at('temperature', 'k');

    expect(convert(0, c, f)).toBeCloseTo(32, 10);
    expect(convert(100, c, f)).toBeCloseTo(212, 10);
    expect(convert(-40, c, f)).toBeCloseTo(-40, 10);
    expect(convert(0, c, k)).toBeCloseTo(273.15, 10);
    expect(convert(convert(36.6, c, f), f, c)).toBeCloseTo(36.6, 10);
  });
});

describe('formatNumber', () => {
  it('drops float noise instead of exposing it', () => {
    expect(formatNumber(0.1 + 0.2, 'en')).toBe('0.3');
  });

  it('keeps a small magnitude that toFixed would flatten', () => {
    expect(formatNumber(0.000001, 'en')).toBe('0.000001');
  });
});

describe('humanize', () => {
  const lengths = unitsNamed('length', ['mm', 'cm', 'm', 'km']);

  it('prefers the largest unit that keeps the number readable', () => {
    expect(humanize(320, lengths).unit.id).toBe('m');
    expect(humanize(320_000_000, lengths).unit.id).toBe('km');
    expect(humanize(0.22, lengths).unit.id).toBe('cm');

    const tonnes = humanize(7500, unitsNamed('mass', ['g', 'kg', 't']));
    expect(tonnes.unit.id).toBe('t');
    expect(tonnes.value).toBeCloseTo(7.5, 10);
  });

  it('falls back to the largest unit when everything overflows', () => {
    expect(humanize(1e15, lengths).unit.id).toBe('km');
  });

  it('reads only the ladder it is given, not a whole quantity', () => {
    const everything = QUANTITY_BY_ID['length'].units;
    expect(humanize(320_000_000, everything).unit.id).toBe('nmi');
    expect(humanize(320_000_000, lengths).unit.id).toBe('km');
  });
});

describe('the unit table', () => {
  it('defines every imperial length off the international inch', () => {
    expect(ratio('length', 'in', 'cm')).toBeCloseTo(2.54, 12);
    expect(ratio('length', 'ft', 'in')).toBeCloseTo(12, 12);
    expect(ratio('length', 'yd', 'ft')).toBeCloseTo(3, 12);
    expect(ratio('length', 'fathom', 'ft')).toBeCloseTo(6, 12);
    expect(ratio('length', 'chain', 'yd')).toBeCloseTo(22, 12);
    expect(ratio('length', 'furlong', 'chain')).toBeCloseTo(10, 12);
    expect(ratio('length', 'mi', 'furlong')).toBeCloseTo(8, 12);
    expect(ratio('length', 'thou', 'in')).toBeCloseTo(0.001, 12);
    expect(ratio('length', 'nmi', 'm')).toBe(1852);
  });

  it('uses the exact astronomical definitions', () => {
    expect(ratio('length', 'au', 'm')).toBe(149_597_870_700);
    expect(ratio('length', 'ly', 'm')).toBe(9_460_730_472_580_800);
    expect(ratio('length', 'pc', 'ly')).toBeCloseTo(3.26156, 5);
  });

  it('defines every imperial mass off the international pound', () => {
    expect(ratio('mass', 'lb', 'g')).toBeCloseTo(453.59237, 9);
    expect(ratio('mass', 'lb', 'oz')).toBeCloseTo(16, 12);
    expect(ratio('mass', 'st', 'lb')).toBeCloseTo(14, 12);
    expect(ratio('mass', 'cwt', 'lb')).toBeCloseTo(100, 9);
    expect(ratio('mass', 'ton', 'lb')).toBeCloseTo(2000, 9);
    expect(ratio('mass', 'longton', 'lb')).toBeCloseTo(2240, 9);
    expect(ratio('mass', 'ozt', 'dwt')).toBeCloseTo(20, 12);
    expect(ratio('mass', 'dwt', 'gr')).toBeCloseTo(24, 12);
    expect(ratio('mass', 'ct', 'g')).toBeCloseTo(0.2, 12);
  });

  it('defines the US liquid measures off the gallon', () => {
    expect(ratio('volume', 'gal', 'qt')).toBeCloseTo(4, 12);
    expect(ratio('volume', 'qt', 'pt')).toBeCloseTo(2, 12);
    expect(ratio('volume', 'pt', 'cup')).toBeCloseTo(2, 12);
    expect(ratio('volume', 'cup', 'floz')).toBeCloseTo(8, 12);
    expect(ratio('volume', 'tbsp', 'tsp')).toBeCloseTo(3, 12);
    expect(ratio('volume', 'bbl', 'gal')).toBeCloseTo(42, 9);
    expect(ratio('volume', 'impgal', 'imppt')).toBeCloseTo(8, 12);
    expect(ratio('volume', 'm3', 'l')).toBeCloseTo(1000, 12);
  });

  it('defines the imperial areas off their lengths', () => {
    expect(ratio('area', 'in2', 'cm2')).toBeCloseTo(6.4516, 12);
    expect(ratio('area', 'yd2', 'ft2')).toBeCloseTo(9, 12);
    expect(ratio('area', 'acre', 'yd2')).toBeCloseTo(4840, 9);
    expect(ratio('area', 'mi2', 'acre')).toBeCloseTo(640, 6);
    expect(ratio('area', 'ha', 'are')).toBeCloseTo(100, 12);
  });

  it('gets the two other temperature scales right', () => {
    const r = at('temperature', 'r');
    const re = at('temperature', 're');
    const c = at('temperature', 'c');
    const k = at('temperature', 'k');

    expect(convert(0, r, k)).toBeCloseTo(0, 12);
    expect(convert(491.67, r, k)).toBeCloseTo(273.15, 10);
    expect(convert(80, re, c)).toBeCloseTo(100, 10);
    expect(convert(0, re, c)).toBeCloseTo(0, 10);
  });

  it('separates decimal from binary data units', () => {
    expect(ratio('data', 'kib', 'b')).toBe(1024);
    expect(ratio('data', 'gib', 'b')).toBe(1024 ** 3);
    expect(ratio('data', 'gb', 'b')).toBe(1e9);
    expect(ratio('data', 'b', 'bit')).toBeCloseTo(8, 12);
  });

  it('relates the speeds to their lengths and times', () => {
    expect(ratio('speed', 'kmh', 'ms')).toBeCloseTo(1 / 3.6, 12);
    expect(ratio('speed', 'kn', 'kmh')).toBeCloseTo(1.852, 12);
    expect(ratio('speed', 'mph', 'fts')).toBeCloseTo(5280 / 3600, 12);
    expect(ratio('speed', 'lightspeed', 'ms')).toBe(299_792_458);
  });

  it('keeps its calendar units consistent with one another', () => {
    expect(ratio('time', 'fortnight', 'd')).toBeCloseTo(14, 12);
    expect(ratio('time', 'wk', 'd')).toBeCloseTo(7, 12);
    expect(ratio('time', 'a', 'mon')).toBeCloseTo(12, 9);
    expect(ratio('time', 'decade', 'a')).toBeCloseTo(10, 9);
    expect(ratio('time', 'century', 'decade')).toBeCloseTo(10, 9);
  });

  it('opens each quantity on a pair worth converting', () => {
    for (const quantity of QUANTITIES) {
      const ids = quantity.units.map((candidate) => candidate.id);
      expect(ids).toContain(quantity.defaultFrom);
      expect(ids).toContain(quantity.defaultTo);
      expect(quantity.defaultFrom).not.toBe(quantity.defaultTo);
    }
  });
});
