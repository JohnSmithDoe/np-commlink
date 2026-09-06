/* ─── why ─────────────────────────────────────────────────────────
 * `rate` is always the constant the basis line SAYS — euros per note, per
 * month, per year — never a figure derived from it, because the basis string
 * interpolates that same field. A rate of 15844 €/s with a label reading
 * "500 Mrd €/Jahr" is the drift this catalog exists to make impossible.
 * `derive` carries the conversion instead, into the family's base unit:
 * metres, kilograms, m², m³, seconds.
 *
 * `year` marks the constants that go stale. They are rendered beside the
 * number, so a reader sees how old an assumption is rather than trusting it.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Unit } from './units.types';
import { unitsNamed } from './units.catalog';
import { Marker } from '../../@shared/model/app.types';
import { DerivedUnit, MoneyGroup, MoneyReference } from './money.types';

const YEAR_SECONDS = 31_556_952;
const MONTH_SECONDS = YEAR_SECONDS / 12;
const DAY_SECONDS = 86_400;

const NOTE_500_LENGTH = 0.16;
const NOTE_500_THICKNESS = 0.00011;
const NOTE_50_VOLUME = 1.186e-6;
const COIN_1_EURO_THICKNESS = 0.00233;
const COIN_1_EURO_MASS = 0.0075;
const COIN_1_CENT_THICKNESS = 0.00167;
const PIZZA_AREA = Math.PI * 0.15 ** 2;

export const MONEY_LADDERS: Record<DerivedUnit, readonly Unit[]> = {
  length: unitsNamed('length', ['mm', 'cm', 'm', 'km']),
  mass: unitsNamed('mass', ['g', 'kg', 't']),
  area: unitsNamed('area', ['cm2', 'm2', 'km2']),
  volume: unitsNamed('volume', ['ml', 'l', 'm3']),
  duration: unitsNamed('time', ['s', 'h', 'd', 'a']),
};

export const MONEY_REFERENCES: readonly MoneyReference[] = [
  {
    id: 'counting',
    group: 'time',
    emoji: '🕐',
    labelKey: marker('coprocessor.money.label.counting'),
    basisKey: marker('coprocessor.money.basis.counting'),
    unitKey: marker('coprocessor.money.unit.counting'),
    rate: 1,
    derive: { factor: 1, unit: 'duration' },
  },
  {
    id: 'notes-laid',
    group: 'physical',
    emoji: '📏',
    labelKey: marker('coprocessor.money.label.notes-laid'),
    basisKey: marker('coprocessor.money.basis.notes-laid'),
    unitKey: marker('coprocessor.money.unit.notes-laid'),
    rate: 500,
    derive: { factor: NOTE_500_LENGTH, unit: 'length' },
  },
  {
    id: 'notes-stacked',
    group: 'physical',
    emoji: '📚',
    labelKey: marker('coprocessor.money.label.notes-stacked'),
    basisKey: marker('coprocessor.money.basis.notes-stacked'),
    unitKey: marker('coprocessor.money.unit.notes-stacked'),
    rate: 500,
    derive: { factor: NOTE_500_THICKNESS, unit: 'length' },
  },
  {
    id: 'coins-stacked',
    group: 'physical',
    emoji: '🪙',
    labelKey: marker('coprocessor.money.label.coins-stacked'),
    basisKey: marker('coprocessor.money.basis.coins-stacked'),
    unitKey: marker('coprocessor.money.unit.coins-stacked'),
    rate: 1,
    derive: { factor: COIN_1_EURO_THICKNESS, unit: 'length' },
  },
  {
    id: 'coins-weighed',
    group: 'physical',
    emoji: '⚖️',
    labelKey: marker('coprocessor.money.label.coins-weighed'),
    basisKey: marker('coprocessor.money.basis.coins-weighed'),
    unitKey: marker('coprocessor.money.unit.coins-weighed'),
    rate: 1,
    derive: { factor: COIN_1_EURO_MASS, unit: 'mass' },
  },
  {
    id: 'federal-budget',
    group: 'absurd',
    emoji: '🏛️',
    labelKey: marker('coprocessor.money.label.federal-budget'),
    basisKey: marker('coprocessor.money.basis.federal-budget'),
    unitKey: marker('coprocessor.money.unit.federal-budget'),
    rate: 500e9,
    year: 2026,
    derive: { factor: YEAR_SECONDS, unit: 'duration' },
  },
  {
    id: 'salaries',
    group: 'time',
    emoji: '💼',
    labelKey: marker('coprocessor.money.label.salaries'),
    basisKey: marker('coprocessor.money.basis.salaries'),
    unitKey: marker('coprocessor.money.unit.salaries'),
    rate: 5000,
    year: 2026,
    derive: { factor: MONTH_SECONDS, unit: 'duration' },
  },
  {
    id: 'cars',
    group: 'things',
    emoji: '🚗',
    labelKey: marker('coprocessor.money.label.cars'),
    basisKey: marker('coprocessor.money.basis.cars'),
    unitKey: marker('coprocessor.money.unit.cars'),
    rate: 30_000,
    year: 2026,
    family: 'vehicles',
  },
  {
    id: 'coffee',
    group: 'time',
    emoji: '☕',
    labelKey: marker('coprocessor.money.label.coffee'),
    basisKey: marker('coprocessor.money.basis.coffee'),
    unitKey: marker('coprocessor.money.unit.coffee'),
    rate: 4.5,
    year: 2026,
    derive: { factor: DAY_SECONDS, unit: 'duration' },
  },
  {
    id: 'bathtubs',
    group: 'absurd',
    emoji: '🛁',
    labelKey: marker('coprocessor.money.label.bathtubs'),
    basisKey: marker('coprocessor.money.basis.bathtubs'),
    unitKey: marker('coprocessor.money.unit.bathtubs'),
    rate: 50,
    derive: { factor: NOTE_50_VOLUME, unit: 'volume' },
  },
  {
    id: 'cents-stacked',
    group: 'absurd',
    emoji: '🚀',
    labelKey: marker('coprocessor.money.label.cents-stacked'),
    basisKey: marker('coprocessor.money.basis.cents-stacked'),
    unitKey: marker('coprocessor.money.unit.cents-stacked'),
    rate: 0.01,
    derive: { factor: COIN_1_CENT_THICKNESS, unit: 'length' },
  },
  {
    id: 'pizza',
    group: 'absurd',
    emoji: '🍕',
    labelKey: marker('coprocessor.money.label.pizza'),
    basisKey: marker('coprocessor.money.basis.pizza'),
    unitKey: marker('coprocessor.money.unit.pizza'),
    rate: 12,
    year: 2026,
    derive: { factor: PIZZA_AREA, unit: 'area' },
  },
];

export const MONEY_GROUPS: readonly { id: MoneyGroup; labelKey: Marker }[] = [
  { id: 'time', labelKey: marker('coprocessor.money.group.time') },
  { id: 'physical', labelKey: marker('coprocessor.money.group.physical') },
  { id: 'things', labelKey: marker('coprocessor.money.group.things') },
  { id: 'absurd', labelKey: marker('coprocessor.money.group.absurd') },
];
