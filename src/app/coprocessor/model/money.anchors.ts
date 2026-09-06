/* ─── why ─────────────────────────────────────────────────────────
 * An anchor is named for what a reader recognises, not for what is
 * technically correct: the 100 km line is `die Grenze zum Weltall`, never
 * `die Kármán-Linie`, because a name that costs a lookup is the failure this
 * whole feature exists to prevent.
 *
 * Each family is a ladder spanning every magnitude it has to serve, with no
 * gap wider than 100x between neighbours — that spacing is what guarantees
 * pickAnchor always finds a rung inside its band, and a spec asserts it.
 * Values are in the family's base unit: metres, kilograms, m², m³, seconds.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { MoneyAnchor } from './money.types';

const YEAR = 31_556_952;
const DAY = 86_400;

export const MONEY_ANCHORS: readonly MoneyAnchor[] = [
  {
    id: 'smartphone',
    family: 'length',
    value: 0.16,
    labelKey: marker('coprocessor.money.anchor.smartphone'),
  },
  {
    id: 'door',
    family: 'length',
    value: 2,
    labelKey: marker('coprocessor.money.anchor.door'),
  },
  {
    id: 'house',
    family: 'length',
    value: 8,
    labelKey: marker('coprocessor.money.anchor.house'),
  },
  {
    id: 'apartment-block',
    family: 'length',
    value: 20,
    labelKey: marker('coprocessor.money.anchor.apartment-block'),
  },
  {
    id: 'pitch-length',
    family: 'length',
    value: 105,
    labelKey: marker('coprocessor.money.anchor.pitch-length'),
  },
  {
    id: 'cologne-cathedral',
    family: 'length',
    value: 157,
    labelKey: marker('coprocessor.money.anchor.cologne-cathedral'),
  },
  {
    id: 'eiffel-tower',
    family: 'length',
    value: 330,
    labelKey: marker('coprocessor.money.anchor.eiffel-tower'),
  },
  {
    id: 'burj-khalifa',
    family: 'length',
    value: 828,
    labelKey: marker('coprocessor.money.anchor.burj-khalifa'),
  },
  {
    id: 'zugspitze',
    family: 'length',
    value: 2962,
    labelKey: marker('coprocessor.money.anchor.zugspitze'),
  },
  {
    id: 'everest',
    family: 'length',
    value: 8849,
    labelKey: marker('coprocessor.money.anchor.everest'),
  },
  {
    id: 'cruising-altitude',
    family: 'length',
    value: 11_000,
    labelKey: marker('coprocessor.money.anchor.cruising-altitude'),
  },
  {
    id: 'edge-of-space',
    family: 'length',
    value: 100_000,
    labelKey: marker('coprocessor.money.anchor.edge-of-space'),
  },
  {
    id: 'iss',
    family: 'length',
    value: 408_000,
    labelKey: marker('coprocessor.money.anchor.iss'),
  },
  {
    id: 'equator',
    family: 'length',
    value: 40_075_000,
    labelKey: marker('coprocessor.money.anchor.equator'),
  },
  {
    id: 'moon',
    family: 'length',
    value: 384_400_000,
    labelKey: marker('coprocessor.money.anchor.moon'),
  },
  {
    id: 'venus',
    family: 'length',
    value: 38e9,
    labelKey: marker('coprocessor.money.anchor.venus'),
  },
  {
    id: 'sun',
    family: 'length',
    value: 149.6e9,
    labelKey: marker('coprocessor.money.anchor.sun'),
  },

  {
    id: 'cement-bag',
    family: 'mass',
    value: 25,
    labelKey: marker('coprocessor.money.anchor.cement-bag'),
  },
  {
    id: 'piano',
    family: 'mass',
    value: 300,
    labelKey: marker('coprocessor.money.anchor.piano'),
  },
  {
    id: 'car-mass',
    family: 'mass',
    value: 1500,
    labelKey: marker('coprocessor.money.anchor.car-mass'),
  },
  {
    id: 'elephant',
    family: 'mass',
    value: 6000,
    labelKey: marker('coprocessor.money.anchor.elephant'),
  },
  {
    id: 'blue-whale',
    family: 'mass',
    value: 150_000,
    labelKey: marker('coprocessor.money.anchor.blue-whale'),
  },
  {
    id: 'a380',
    family: 'mass',
    value: 575_000,
    labelKey: marker('coprocessor.money.anchor.a380'),
  },
  {
    id: 'eiffel-tower-mass',
    family: 'mass',
    value: 10.1e6,
    labelKey: marker('coprocessor.money.anchor.eiffel-tower-mass'),
  },
  {
    id: 'golden-gate',
    family: 'mass',
    value: 800e6,
    labelKey: marker('coprocessor.money.anchor.golden-gate'),
  },

  {
    id: 'parking-space',
    family: 'area',
    value: 12,
    labelKey: marker('coprocessor.money.anchor.parking-space'),
  },
  {
    id: 'flat',
    family: 'area',
    value: 80,
    labelKey: marker('coprocessor.money.anchor.flat'),
  },
  {
    id: 'tennis-court',
    family: 'area',
    value: 261,
    labelKey: marker('coprocessor.money.anchor.tennis-court'),
  },
  {
    id: 'pitch',
    family: 'area',
    value: 7140,
    labelKey: marker('coprocessor.money.anchor.pitch'),
  },
  {
    id: 'stadium',
    family: 'area',
    value: 70_000,
    labelKey: marker('coprocessor.money.anchor.stadium'),
  },
  {
    id: 'central-park',
    family: 'area',
    value: 3.41e6,
    labelKey: marker('coprocessor.money.anchor.central-park'),
  },
  {
    id: 'munich',
    family: 'area',
    value: 310.7e6,
    labelKey: marker('coprocessor.money.anchor.munich'),
  },
  {
    id: 'saarland',
    family: 'area',
    value: 2570e6,
    labelKey: marker('coprocessor.money.anchor.saarland'),
  },

  {
    id: 'bucket',
    family: 'volume',
    value: 0.01,
    labelKey: marker('coprocessor.money.anchor.bucket'),
  },
  {
    id: 'bathtub',
    family: 'volume',
    value: 0.2,
    labelKey: marker('coprocessor.money.anchor.bathtub'),
  },
  {
    id: 'hot-tub',
    family: 'volume',
    value: 1.5,
    labelKey: marker('coprocessor.money.anchor.hot-tub'),
  },
  {
    id: 'tanker',
    family: 'volume',
    value: 30,
    labelKey: marker('coprocessor.money.anchor.tanker'),
  },
  {
    id: 'olympic-pool',
    family: 'volume',
    value: 2500,
    labelKey: marker('coprocessor.money.anchor.olympic-pool'),
  },

  {
    id: 'ad-break',
    family: 'duration',
    value: 60,
    labelKey: marker('coprocessor.money.anchor.ad-break'),
  },
  {
    id: 'news-broadcast',
    family: 'duration',
    value: 900,
    labelKey: marker('coprocessor.money.anchor.news-broadcast'),
  },
  {
    id: 'feature-film',
    family: 'duration',
    value: 7200,
    labelKey: marker('coprocessor.money.anchor.feature-film'),
  },
  {
    id: 'working-day',
    family: 'duration',
    value: 28_800,
    labelKey: marker('coprocessor.money.anchor.working-day'),
  },
  {
    id: 'working-week',
    family: 'duration',
    value: 5 * DAY,
    labelKey: marker('coprocessor.money.anchor.working-week'),
  },
  {
    id: 'annual-leave',
    family: 'duration',
    value: 30 * DAY,
    labelKey: marker('coprocessor.money.anchor.annual-leave'),
  },
  {
    id: 'pregnancy',
    family: 'duration',
    value: 0.75 * YEAR,
    labelKey: marker('coprocessor.money.anchor.pregnancy'),
  },
  {
    id: 'parliament',
    family: 'duration',
    value: 4 * YEAR,
    labelKey: marker('coprocessor.money.anchor.parliament'),
  },
  {
    id: 'reunification',
    family: 'duration',
    value: 36 * YEAR,
    labelKey: marker('coprocessor.money.anchor.reunification'),
  },
  {
    id: 'lifespan',
    family: 'duration',
    value: 75 * YEAR,
    labelKey: marker('coprocessor.money.anchor.lifespan'),
  },
  {
    id: 'common-era',
    family: 'duration',
    value: 2026 * YEAR,
    labelKey: marker('coprocessor.money.anchor.common-era'),
  },
  {
    id: 'great-pyramid',
    family: 'duration',
    value: 4600 * YEAR,
    labelKey: marker('coprocessor.money.anchor.great-pyramid'),
  },
  {
    id: 'ice-age',
    family: 'duration',
    value: 11_700 * YEAR,
    labelKey: marker('coprocessor.money.anchor.ice-age'),
  },
  {
    id: 'lascaux',
    family: 'duration',
    value: 17_000 * YEAR,
    labelKey: marker('coprocessor.money.anchor.lascaux'),
  },
  {
    id: 'homo-sapiens',
    family: 'duration',
    value: 300_000 * YEAR,
    labelKey: marker('coprocessor.money.anchor.homo-sapiens'),
  },
  {
    id: 'upright-walking',
    family: 'duration',
    value: 4e6 * YEAR,
    labelKey: marker('coprocessor.money.anchor.upright-walking'),
  },
  {
    id: 'dinosaurs',
    family: 'duration',
    value: 66e6 * YEAR,
    labelKey: marker('coprocessor.money.anchor.dinosaurs'),
  },

  {
    id: 'car-dealership',
    family: 'vehicles',
    value: 30,
    labelKey: marker('coprocessor.money.anchor.car-dealership'),
  },
  {
    id: 'company-fleet',
    family: 'vehicles',
    value: 250,
    labelKey: marker('coprocessor.money.anchor.company-fleet'),
  },
  {
    id: 'car-train',
    family: 'vehicles',
    value: 1000,
    labelKey: marker('coprocessor.money.anchor.car-train'),
  },
  {
    id: 'small-town-cars',
    family: 'vehicles',
    value: 20_000,
    labelKey: marker('coprocessor.money.anchor.small-town-cars'),
  },
  {
    id: 'munich-cars',
    family: 'vehicles',
    value: 700_000,
    labelKey: marker('coprocessor.money.anchor.munich-cars'),
  },
  {
    id: 'german-cars',
    family: 'vehicles',
    value: 49.3e6,
    labelKey: marker('coprocessor.money.anchor.german-cars'),
  },
];
