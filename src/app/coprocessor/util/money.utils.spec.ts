import { MONEY_ANCHORS } from '../model/money.anchors';
import { MONEY_REFERENCES } from '../model/money.catalog';
import { AnchorFamily } from '../model/money.types';
import {
  MoneyRow,
  parseMagnitude,
  pickAnchor,
  referenceResults,
  spellAmount,
} from './money.utils';

const MILLION = 1e6;
const TRILLION = 1e12;

const row = (rows: MoneyRow[], id: string): MoneyRow => {
  const found = rows.find((candidate) => candidate.reference.id === id);
  if (!found) throw new Error(`no row ${id}`);
  return found;
};

describe('parseMagnitude', () => {
  it('reads a suffix in the active language', () => {
    expect(parseMagnitude('1,5 mrd', 'de')).toBe(1.5e9);
    expect(parseMagnitude('3 mio', 'de')).toBe(3e6);
    expect(parseMagnitude('250k', 'de')).toBe(250_000);
    expect(parseMagnitude('250k', 'en')).toBe(250_000);
  });

  it('resolves the Billion trap against the language, not a global table', () => {
    expect(parseMagnitude('1 b', 'en')).toBe(1e9);
    expect(parseMagnitude('1 bio', 'de')).toBe(1e12);
    expect(parseMagnitude('1 t', 'en')).toBe(1e12);
    expect(parseMagnitude('1 bio', 'en')).toBeNull();
    expect(parseMagnitude('1 mrd', 'en')).toBeNull();
  });

  it('reads the separators of the active language', () => {
    expect(parseMagnitude('1.500,5', 'de')).toBe(1500.5);
    expect(parseMagnitude('1,500.5', 'en')).toBe(1500.5);
  });

  it('takes a bare number', () => {
    expect(parseMagnitude('1000000', 'de')).toBe(1_000_000);
  });

  it('refuses junk', () => {
    expect(parseMagnitude('', 'de')).toBeNull();
    expect(parseMagnitude('abc', 'de')).toBeNull();
    expect(parseMagnitude('5 parsec', 'de')).toBeNull();
  });
});

describe('spellAmount', () => {
  it('names the magnitude without deciding its wording', () => {
    expect(spellAmount(1.5e9)).toEqual({
      amount: 1.5,
      magnitude: 'billion',
      plural: true,
    });
    expect(spellAmount(1e12)).toEqual({
      amount: 1,
      magnitude: 'trillion',
      plural: false,
    });
    expect(spellAmount(500).magnitude).toBe('one');
  });
});

describe('pickAnchor', () => {
  it('prefers a multiple at or above the band floor over a bigger anchor', () => {
    expect(pickAnchor(320_000_000, 'length')?.anchor.id).toBe('equator');
  });

  it('takes the largest qualifying rung', () => {
    expect(pickAnchor(2.33e9, 'length')?.anchor.id).toBe('moon');
  });

  it('keeps a near miss, because "almost exactly X" is the best line', () => {
    const eiffel = pickAnchor(320, 'length');
    expect(eiffel?.anchor.id).toBe('eiffel-tower');
    expect(eiffel?.multiple).toBeCloseTo(0.97, 2);
  });

  it('has a rung for an everyday magnitude too', () => {
    expect(pickAnchor(0.22, 'length')?.anchor.id).toBe('smartphone');
    expect(pickAnchor(7500, 'mass')?.anchor.id).toBe('elephant');
  });

  it('leaves no gap wider than 100x in any ladder', () => {
    const families = [...new Set(MONEY_ANCHORS.map((rung) => rung.family))];

    const gaps = families.flatMap((family: AnchorFamily) => {
      const rungs = MONEY_ANCHORS.filter((rung) => rung.family === family)
        .map((rung) => rung.value)
        .toSorted((a, b) => a - b);

      return rungs
        .slice(1)
        .flatMap((value, index) =>
          value / rungs[index]! > 100
            ? [`${family}: ${rungs[index]} → ${value}`]
            : []
        );
    });

    expect(gaps).toEqual([]);
  });
});

describe('referenceResults', () => {
  it('turns a million into figures a person can hold', () => {
    const rows = referenceResults(MILLION);

    const counting = row(rows, 'counting');
    expect(counting.unit?.id).toBe('d');
    expect(counting.value).toBeCloseTo(11.6, 1);

    const laid = row(rows, 'notes-laid');
    expect(laid.unit?.id).toBe('m');
    expect(laid.value).toBeCloseTo(320, 6);
    expect(laid.anchor?.anchor.id).toBe('eiffel-tower');

    const stacked = row(rows, 'notes-stacked');
    expect(stacked.unit?.id).toBe('cm');
    expect(stacked.value).toBeCloseTo(22, 6);

    const coins = row(rows, 'coins-stacked');
    expect(coins.unit?.id).toBe('km');
    expect(coins.value).toBeCloseTo(2.33, 6);

    const weighed = row(rows, 'coins-weighed');
    expect(weighed.unit?.id).toBe('t');
    expect(weighed.value).toBeCloseTo(7.5, 6);
    expect(weighed.anchor?.anchor.id).toBe('elephant');

    expect(row(rows, 'cars').value).toBeCloseTo(33.33, 2);
    expect(row(rows, 'salaries').count).toBeCloseTo(200, 6);

    const coffee = row(rows, 'coffee');
    expect(coffee.count).toBeCloseTo(222_222, 0);
    expect(coffee.unit?.id).toBe('a');
    expect(coffee.anchor?.anchor.id).toBe('lifespan');

    const cents = row(rows, 'cents-stacked');
    expect(cents.unit?.id).toBe('km');
    expect(cents.value).toBeCloseTo(167, 6);

    const pizza = row(rows, 'pizza');
    expect(pizza.unit?.id).toBe('m2');
    expect(pizza.value).toBeCloseTo(5890, 0);
  });

  it('stays readable at the scale news numbers live at', () => {
    const rows = referenceResults(TRILLION);

    const counting = row(rows, 'counting');
    expect(counting.unit?.id).toBe('a');
    expect(counting.value).toBeCloseTo(31_689, 0);
    expect(counting.anchor?.anchor.id).toBe('lascaux');

    const laid = row(rows, 'notes-laid');
    expect(laid.unit?.id).toBe('km');
    expect(laid.value).toBeCloseTo(320_000, 0);
    expect(laid.anchor?.anchor.id).toBe('equator');
    expect(laid.anchor?.multiple).toBeCloseTo(7.99, 2);

    const coins = row(rows, 'coins-stacked');
    expect(coins.anchor?.anchor.id).toBe('moon');
    expect(coins.anchor?.multiple).toBeCloseTo(6.06, 2);

    const cents = row(rows, 'cents-stacked');
    expect(cents.anchor?.anchor.id).toBe('sun');
    expect(cents.anchor?.multiple).toBeCloseTo(1.12, 2);

    expect(row(rows, 'salaries').anchor?.anchor.id).toBe('upright-walking');
    expect(row(rows, 'bathtubs').anchor?.anchor.id).toBe('olympic-pool');
    expect(row(rows, 'pizza').anchor?.anchor.id).toBe('saarland');
    expect(row(rows, 'coffee').anchor?.anchor.id).toBe('dinosaurs');
  });

  it('lands an anchor on every reference at both demo scales', () => {
    for (const amount of [MILLION, TRILLION]) {
      const anchorless = referenceResults(amount)
        .filter((candidate) => !candidate.anchor)
        .map((candidate) => `${amount}: ${candidate.reference.id}`);

      expect(anchorless).toEqual([]);
    }
  });

  it('covers every reference', () => {
    expect(referenceResults(MILLION)).toHaveLength(MONEY_REFERENCES.length);
    expect(MONEY_REFERENCES).toHaveLength(12);
  });
});
