/* ─── why ─────────────────────────────────────────────────────────
 * Every unit converts through its quantity's base as `value * factor + offset`,
 * which is one formula for both kinds of unit that exist here: a ratio omits
 * `offset`, and temperature — the only affine quantity — supplies it.
 *
 * Fahrenheit's offset is written as the expression that produces it rather than
 * as 255.372222…, so the constant can be read against the definition instead of
 * trusted. Kelvin is the base for the same reason: it is the one temperature
 * scale whose zero is the quantity's zero, so nothing else needs an offset it
 * did not earn.
 *
 * Each quantity names the pair it opens on, and it is always a foreign unit
 * into the metric one. Centimetres into metres is mental arithmetic; pounds,
 * miles and Fahrenheit are what a reader actually reaches for a converter to
 * do, so those are the defaults rather than the tidy same-system pair.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Quantity, QuantityId, Unit } from './units.types';

const FAHRENHEIT_FACTOR = 5 / 9;

export const QUANTITIES: readonly Quantity[] = [
  {
    id: 'length',
    nameKey: marker('coprocessor.units.quantity.length'),
    defaultFrom: 'mi',
    defaultTo: 'km',
    units: [
      {
        id: 'm',
        symbol: 'm',
        nameKey: marker('coprocessor.units.unit.m'),
        factor: 1,
      },
      {
        id: 'mm',
        symbol: 'mm',
        nameKey: marker('coprocessor.units.unit.mm'),
        factor: 0.001,
      },
      {
        id: 'cm',
        symbol: 'cm',
        nameKey: marker('coprocessor.units.unit.cm'),
        factor: 0.01,
      },
      {
        id: 'km',
        symbol: 'km',
        nameKey: marker('coprocessor.units.unit.km'),
        factor: 1000,
      },
      {
        id: 'in',
        symbol: 'in',
        nameKey: marker('coprocessor.units.unit.in'),
        factor: 0.0254,
      },
      {
        id: 'ft',
        symbol: 'ft',
        nameKey: marker('coprocessor.units.unit.ft'),
        factor: 0.3048,
      },
      {
        id: 'yd',
        symbol: 'yd',
        nameKey: marker('coprocessor.units.unit.yd'),
        factor: 0.9144,
      },
      {
        id: 'mi',
        symbol: 'mi',
        nameKey: marker('coprocessor.units.unit.mi'),
        factor: 1609.344,
      },
      {
        id: 'nmi',
        symbol: 'nmi',
        nameKey: marker('coprocessor.units.unit.nmi'),
        factor: 1852,
      },
      {
        id: 'um',
        symbol: 'µm',
        nameKey: marker('coprocessor.units.unit.um'),
        factor: 1e-6,
      },
      {
        id: 'dm',
        symbol: 'dm',
        nameKey: marker('coprocessor.units.unit.dm'),
        factor: 0.1,
      },
      {
        id: 'thou',
        symbol: 'thou',
        nameKey: marker('coprocessor.units.unit.thou'),
        factor: 0.0000254,
      },
      {
        id: 'fathom',
        symbol: 'ftm',
        nameKey: marker('coprocessor.units.unit.fathom'),
        factor: 1.8288,
      },
      {
        id: 'chain',
        symbol: 'ch',
        nameKey: marker('coprocessor.units.unit.chain'),
        factor: 20.1168,
      },
      {
        id: 'furlong',
        symbol: 'fur',
        nameKey: marker('coprocessor.units.unit.furlong'),
        factor: 201.168,
      },
      {
        id: 'au',
        symbol: 'AU',
        nameKey: marker('coprocessor.units.unit.au'),
        factor: 149_597_870_700,
      },
      {
        id: 'ly',
        symbol: 'ly',
        nameKey: marker('coprocessor.units.unit.ly'),
        factor: 9_460_730_472_580_800,
      },
      {
        id: 'pc',
        symbol: 'pc',
        nameKey: marker('coprocessor.units.unit.pc'),
        factor: (149_597_870_700 * 648_000) / Math.PI,
      },
    ],
  },
  {
    id: 'mass',
    nameKey: marker('coprocessor.units.quantity.mass'),
    defaultFrom: 'lb',
    defaultTo: 'kg',
    units: [
      {
        id: 'kg',
        symbol: 'kg',
        nameKey: marker('coprocessor.units.unit.kg'),
        factor: 1,
      },
      {
        id: 'mg',
        symbol: 'mg',
        nameKey: marker('coprocessor.units.unit.mg'),
        factor: 1e-6,
      },
      {
        id: 'g',
        symbol: 'g',
        nameKey: marker('coprocessor.units.unit.g'),
        factor: 0.001,
      },
      {
        id: 't',
        symbol: 't',
        nameKey: marker('coprocessor.units.unit.t'),
        factor: 1000,
      },
      {
        id: 'oz',
        symbol: 'oz',
        nameKey: marker('coprocessor.units.unit.oz'),
        factor: 0.028349523125,
      },
      {
        id: 'lb',
        symbol: 'lb',
        nameKey: marker('coprocessor.units.unit.lb'),
        factor: 0.45359237,
      },
      {
        id: 'st',
        symbol: 'st',
        nameKey: marker('coprocessor.units.unit.st'),
        factor: 6.35029318,
      },
      {
        id: 'ton',
        symbol: 'ton',
        nameKey: marker('coprocessor.units.unit.ton'),
        factor: 907.18474,
      },
      {
        id: 'ug',
        symbol: 'µg',
        nameKey: marker('coprocessor.units.unit.ug'),
        factor: 1e-9,
      },
      {
        id: 'ct',
        symbol: 'ct',
        nameKey: marker('coprocessor.units.unit.ct'),
        factor: 0.0002,
      },
      {
        id: 'gr',
        symbol: 'gr',
        nameKey: marker('coprocessor.units.unit.gr'),
        factor: 0.00006479891,
      },
      {
        id: 'dwt',
        symbol: 'dwt',
        nameKey: marker('coprocessor.units.unit.dwt'),
        factor: 0.00155517384,
      },
      {
        id: 'ozt',
        symbol: 'oz t',
        nameKey: marker('coprocessor.units.unit.ozt'),
        factor: 0.0311034768,
      },
      {
        id: 'cwt',
        symbol: 'cwt',
        nameKey: marker('coprocessor.units.unit.cwt'),
        factor: 45.359237,
      },
      {
        id: 'longton',
        symbol: 'long ton',
        nameKey: marker('coprocessor.units.unit.longton'),
        factor: 1016.0469088,
      },
    ],
  },
  {
    id: 'temperature',
    nameKey: marker('coprocessor.units.quantity.temperature'),
    defaultFrom: 'f',
    defaultTo: 'c',
    units: [
      {
        id: 'k',
        symbol: 'K',
        nameKey: marker('coprocessor.units.unit.k'),
        factor: 1,
      },
      {
        id: 'c',
        symbol: '°C',
        nameKey: marker('coprocessor.units.unit.c'),
        factor: 1,
        offset: 273.15,
      },
      {
        id: 'f',
        symbol: '°F',
        nameKey: marker('coprocessor.units.unit.f'),
        factor: FAHRENHEIT_FACTOR,
        offset: 273.15 - 32 * FAHRENHEIT_FACTOR,
      },
      {
        id: 'r',
        symbol: '°R',
        nameKey: marker('coprocessor.units.unit.r'),
        factor: 5 / 9,
      },
      {
        id: 're',
        symbol: '°Ré',
        nameKey: marker('coprocessor.units.unit.re'),
        factor: 1.25,
        offset: 273.15,
      },
    ],
  },
  {
    id: 'volume',
    nameKey: marker('coprocessor.units.quantity.volume'),
    defaultFrom: 'gal',
    defaultTo: 'l',
    units: [
      {
        id: 'l',
        symbol: 'l',
        nameKey: marker('coprocessor.units.unit.l'),
        factor: 1,
      },
      {
        id: 'ml',
        symbol: 'ml',
        nameKey: marker('coprocessor.units.unit.ml'),
        factor: 0.001,
      },
      {
        id: 'm3',
        symbol: 'm³',
        nameKey: marker('coprocessor.units.unit.m3'),
        factor: 1000,
      },
      {
        id: 'gal',
        symbol: 'gal',
        nameKey: marker('coprocessor.units.unit.gal'),
        factor: 3.785411784,
      },
      {
        id: 'qt',
        symbol: 'qt',
        nameKey: marker('coprocessor.units.unit.qt'),
        factor: 0.946352946,
      },
      {
        id: 'floz',
        symbol: 'fl oz',
        nameKey: marker('coprocessor.units.unit.floz'),
        factor: 0.0295735295625,
      },
      {
        id: 'pt',
        symbol: 'pt',
        nameKey: marker('coprocessor.units.unit.pt'),
        factor: 0.473176473,
      },
      {
        id: 'cup',
        symbol: 'cup',
        nameKey: marker('coprocessor.units.unit.cup'),
        factor: 0.2365882365,
      },
      {
        id: 'impgal',
        symbol: 'imp gal',
        nameKey: marker('coprocessor.units.unit.impgal'),
        factor: 4.54609,
      },
      {
        id: 'cl',
        symbol: 'cl',
        nameKey: marker('coprocessor.units.unit.cl'),
        factor: 0.01,
      },
      {
        id: 'dl',
        symbol: 'dl',
        nameKey: marker('coprocessor.units.unit.dl'),
        factor: 0.1,
      },
      {
        id: 'cm3',
        symbol: 'cm³',
        nameKey: marker('coprocessor.units.unit.cm3'),
        factor: 0.001,
      },
      {
        id: 'tsp',
        symbol: 'tsp',
        nameKey: marker('coprocessor.units.unit.tsp'),
        factor: 0.00492892159375,
      },
      {
        id: 'tbsp',
        symbol: 'tbsp',
        nameKey: marker('coprocessor.units.unit.tbsp'),
        factor: 0.01478676478125,
      },
      {
        id: 'bbl',
        symbol: 'bbl',
        nameKey: marker('coprocessor.units.unit.bbl'),
        factor: 158.987294928,
      },
      {
        id: 'imppt',
        symbol: 'imp pt',
        nameKey: marker('coprocessor.units.unit.imppt'),
        factor: 0.56826125,
      },
    ],
  },
  {
    id: 'area',
    nameKey: marker('coprocessor.units.quantity.area'),
    defaultFrom: 'acre',
    defaultTo: 'ha',
    units: [
      {
        id: 'm2',
        symbol: 'm²',
        nameKey: marker('coprocessor.units.unit.m2'),
        factor: 1,
      },
      {
        id: 'cm2',
        symbol: 'cm²',
        nameKey: marker('coprocessor.units.unit.cm2'),
        factor: 0.0001,
      },
      {
        id: 'ha',
        symbol: 'ha',
        nameKey: marker('coprocessor.units.unit.ha'),
        factor: 10_000,
      },
      {
        id: 'km2',
        symbol: 'km²',
        nameKey: marker('coprocessor.units.unit.km2'),
        factor: 1e6,
      },
      {
        id: 'ft2',
        symbol: 'ft²',
        nameKey: marker('coprocessor.units.unit.ft2'),
        factor: 0.09290304,
      },
      {
        id: 'acre',
        symbol: 'ac',
        nameKey: marker('coprocessor.units.unit.acre'),
        factor: 4046.8564224,
      },
      {
        id: 'mm2',
        symbol: 'mm²',
        nameKey: marker('coprocessor.units.unit.mm2'),
        factor: 1e-6,
      },
      {
        id: 'are',
        symbol: 'a',
        nameKey: marker('coprocessor.units.unit.are'),
        factor: 100,
      },
      {
        id: 'in2',
        symbol: 'in²',
        nameKey: marker('coprocessor.units.unit.in2'),
        factor: 0.00064516,
      },
      {
        id: 'yd2',
        symbol: 'yd²',
        nameKey: marker('coprocessor.units.unit.yd2'),
        factor: 0.83612736,
      },
      {
        id: 'mi2',
        symbol: 'mi²',
        nameKey: marker('coprocessor.units.unit.mi2'),
        factor: 2_589_988.110336,
      },
    ],
  },
  {
    id: 'speed',
    nameKey: marker('coprocessor.units.quantity.speed'),
    defaultFrom: 'mph',
    defaultTo: 'kmh',
    units: [
      {
        id: 'ms',
        symbol: 'm/s',
        nameKey: marker('coprocessor.units.unit.ms'),
        factor: 1,
      },
      {
        id: 'kmh',
        symbol: 'km/h',
        nameKey: marker('coprocessor.units.unit.kmh'),
        factor: 1 / 3.6,
      },
      {
        id: 'mph',
        symbol: 'mph',
        nameKey: marker('coprocessor.units.unit.mph'),
        factor: 0.44704,
      },
      {
        id: 'kn',
        symbol: 'kn',
        nameKey: marker('coprocessor.units.unit.kn'),
        factor: 1852 / 3600,
      },
      {
        id: 'fts',
        symbol: 'ft/s',
        nameKey: marker('coprocessor.units.unit.fts'),
        factor: 0.3048,
      },
      {
        id: 'cms',
        symbol: 'cm/s',
        nameKey: marker('coprocessor.units.unit.cms'),
        factor: 0.01,
      },
      {
        id: 'lightspeed',
        symbol: 'c',
        nameKey: marker('coprocessor.units.unit.lightspeed'),
        factor: 299_792_458,
      },
    ],
  },
  {
    id: 'data',
    nameKey: marker('coprocessor.units.quantity.data'),
    defaultFrom: 'gib',
    defaultTo: 'gb',
    units: [
      {
        id: 'b',
        symbol: 'B',
        nameKey: marker('coprocessor.units.unit.b'),
        factor: 1,
      },
      {
        id: 'kb',
        symbol: 'kB',
        nameKey: marker('coprocessor.units.unit.kb'),
        factor: 1000,
      },
      {
        id: 'mb',
        symbol: 'MB',
        nameKey: marker('coprocessor.units.unit.mb'),
        factor: 1e6,
      },
      {
        id: 'gb',
        symbol: 'GB',
        nameKey: marker('coprocessor.units.unit.gb'),
        factor: 1e9,
      },
      {
        id: 'tb',
        symbol: 'TB',
        nameKey: marker('coprocessor.units.unit.tb'),
        factor: 1e12,
      },
      {
        id: 'kib',
        symbol: 'KiB',
        nameKey: marker('coprocessor.units.unit.kib'),
        factor: 1024,
      },
      {
        id: 'mib',
        symbol: 'MiB',
        nameKey: marker('coprocessor.units.unit.mib'),
        factor: 1024 ** 2,
      },
      {
        id: 'gib',
        symbol: 'GiB',
        nameKey: marker('coprocessor.units.unit.gib'),
        factor: 1024 ** 3,
      },
      {
        id: 'bit',
        symbol: 'bit',
        nameKey: marker('coprocessor.units.unit.bit'),
        factor: 1 / 8,
      },
      {
        id: 'pb',
        symbol: 'PB',
        nameKey: marker('coprocessor.units.unit.pb'),
        factor: 1e15,
      },
      {
        id: 'tib',
        symbol: 'TiB',
        nameKey: marker('coprocessor.units.unit.tib'),
        factor: 1024 ** 4,
      },
      {
        id: 'pib',
        symbol: 'PiB',
        nameKey: marker('coprocessor.units.unit.pib'),
        factor: 1024 ** 5,
      },
    ],
  },
  {
    id: 'time',
    nameKey: marker('coprocessor.units.quantity.time'),
    defaultFrom: 'd',
    defaultTo: 'h',
    units: [
      {
        id: 's',
        symbol: 's',
        nameKey: marker('coprocessor.units.unit.s'),
        factor: 1,
      },
      {
        id: 'ms',
        symbol: 'ms',
        nameKey: marker('coprocessor.units.unit.msec'),
        factor: 0.001,
      },
      {
        id: 'min',
        symbol: 'min',
        nameKey: marker('coprocessor.units.unit.min'),
        factor: 60,
      },
      {
        id: 'h',
        symbol: 'h',
        nameKey: marker('coprocessor.units.unit.h'),
        factor: 3600,
      },
      {
        id: 'd',
        symbol: 'd',
        nameKey: marker('coprocessor.units.unit.d'),
        factor: 86_400,
      },
      {
        id: 'wk',
        symbol: 'wk',
        nameKey: marker('coprocessor.units.unit.wk'),
        factor: 604_800,
      },
      {
        id: 'a',
        symbol: 'a',
        nameKey: marker('coprocessor.units.unit.a'),
        factor: 31_556_952,
      },
      {
        id: 'us',
        symbol: 'µs',
        nameKey: marker('coprocessor.units.unit.us'),
        factor: 1e-6,
      },
      {
        id: 'fortnight',
        symbol: 'fortnight',
        nameKey: marker('coprocessor.units.unit.fortnight'),
        factor: 1_209_600,
      },
      {
        id: 'mon',
        symbol: 'mon',
        nameKey: marker('coprocessor.units.unit.mon'),
        factor: 31_556_952 / 12,
      },
      {
        id: 'decade',
        symbol: 'decade',
        nameKey: marker('coprocessor.units.unit.decade'),
        factor: 315_569_520,
      },
      {
        id: 'century',
        symbol: 'century',
        nameKey: marker('coprocessor.units.unit.century'),
        factor: 3_155_695_200,
      },
    ],
  },
];

export const QUANTITY_BY_ID: Record<QuantityId, Quantity> = Object.fromEntries(
  QUANTITIES.map((quantity) => [quantity.id, quantity])
) as Record<QuantityId, Quantity>;

export const unitsNamed = (
  quantity: QuantityId,
  ids: readonly string[]
): readonly Unit[] =>
  ids.map((id) => {
    const unit = QUANTITY_BY_ID[quantity].units.find(
      (candidate) => candidate.id === id
    );
    if (!unit) throw new Error(`unknown unit ${quantity}/${id}`);
    return unit;
  });
