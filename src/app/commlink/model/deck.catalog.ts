import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import { DeckEntry } from './deck.types';

export const DECK_CATALOG: readonly DeckEntry[] = [
  {
    id: 'commlink',
    module: 'commlink',
    icon: 'hardware-chip-outline',
    route: '/commlink',
    titleKey: marker('page-title.commlink'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.commlink.name'),
        descKey: marker('deck.cyberpunk.commlink.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.commlink.name'),
        descKey: marker('deck.boomer.commlink.desc'),
      },
    },
    onDeck: false,
  },
  {
    id: 'tracking',
    module: 'tracking',
    icon: 'timer-outline',
    route: '/tracking',
    titleKey: marker('page-title.tracking'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.tracking.name'),
        descKey: marker('deck.cyberpunk.tracking.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.tracking.name'),
        descKey: marker('deck.boomer.tracking.desc'),
      },
    },
    onDeck: true,
    source: 'tracking',
    metric: 'count',
    metricKey: marker('deck.metric.count'),
  },
  {
    id: 'office-time',
    module: 'office-time',
    icon: 'business-outline',
    route: '/office-time',
    titleKey: marker('page-title.office-time'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.office-time.name'),
        descKey: marker('deck.cyberpunk.office-time.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.office-time.name'),
        descKey: marker('deck.boomer.office-time.desc'),
      },
    },
    onDeck: true,
    source: 'office-time',
    metric: 'officedays',
    metricKey: marker('deck.metric.officedays'),
  },
  {
    id: 'notifications',
    module: 'notifications',
    icon: 'notifications-outline',
    route: '/notifications',
    titleKey: marker('page-title.notifications'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.notifications.name'),
        descKey: marker('deck.cyberpunk.notifications.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.notifications.name'),
        descKey: marker('deck.boomer.notifications.desc'),
      },
    },
    onDeck: true,
    source: 'notifications',
    metric: 'unread',
    metricKey: marker('deck.metric.unread'),
  },
  {
    id: 'barcode',
    module: 'barcode',
    icon: 'barcode-outline',
    route: '/barcode',
    titleKey: marker('page-title.barcode'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.barcode.name'),
        descKey: marker('deck.cyberpunk.barcode.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.barcode.name'),
        descKey: marker('deck.boomer.barcode.desc'),
      },
    },
    onDeck: true,
    status: 'online',
  },
  {
    id: 'soykaf',
    module: 'household',
    icon: 'restaurant-outline',
    route: '/soykaf',
    titleKey: marker('page-title.soykaf'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.soykaf.name'),
        descKey: marker('deck.cyberpunk.soykaf.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.soykaf.name'),
        descKey: marker('deck.boomer.soykaf.desc'),
      },
    },
    onDeck: true,
    source: 'recipes',
    metric: 'count',
    metricKey: marker('deck.metric.count'),
  },
  {
    id: 'shopping',
    module: 'household',
    icon: 'cart-outline',
    route: '/household/shopping',
    titleKey: marker('page-title.household-shopping'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.shopping.name'),
        descKey: marker('deck.cyberpunk.shopping.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.shopping.name'),
        descKey: marker('deck.boomer.shopping.desc'),
      },
    },
    onDeck: true,
    source: 'shopping',
    metric: 'active',
    metricKey: marker('deck.metric.active'),
  },
  {
    id: 'storage',
    module: 'household',
    icon: 'file-tray-stacked-outline',
    route: '/household/storage',
    titleKey: marker('page-title.household-storage'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.storage.name'),
        descKey: marker('deck.cyberpunk.storage.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.storage.name'),
        descKey: marker('deck.boomer.storage.desc'),
      },
    },
    onDeck: true,
    source: 'storage',
    metric: 'low',
    metricKey: marker('deck.metric.low'),
  },
  {
    id: 'tasks',
    module: 'tasks',
    icon: 'checkbox-outline',
    route: '/tasks/list',
    titleKey: marker('page-title.tasks'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.tasks.name'),
        descKey: marker('deck.cyberpunk.tasks.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.tasks.name'),
        descKey: marker('deck.boomer.tasks.desc'),
      },
    },
    onDeck: true,
    source: 'tasks',
    metric: 'open',
    metricKey: marker('deck.metric.open'),
  },
  {
    id: 'products',
    module: 'household',
    icon: 'pricetags-outline',
    route: '/household/products',
    titleKey: marker('page-title.household-products'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.products.name'),
        descKey: marker('deck.cyberpunk.products.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.products.name'),
        descKey: marker('deck.boomer.products.desc'),
      },
    },
    onDeck: true,
    source: 'products',
    metric: 'count',
    metricKey: marker('deck.metric.count'),
  },
  {
    id: 'cash',
    module: 'cash',
    icon: 'wallet-outline',
    route: '/cash',
    titleKey: marker('page-title.cash'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.cash.name'),
        descKey: marker('deck.cyberpunk.cash.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.cash.name'),
        descKey: marker('deck.boomer.cash.desc'),
      },
    },
    onDeck: true,
    source: 'cash',
    metric: 'balance',
    metricKey: marker('deck.metric.balance'),
    currency: true,
  },
  {
    id: 'trackplay',
    module: 'trackplay',
    icon: 'dice-outline',
    route: '/trackplay',
    titleKey: marker('page-title.trackplay-games'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.trackplay.name'),
        descKey: marker('deck.cyberpunk.trackplay.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.trackplay.name'),
        descKey: marker('deck.boomer.trackplay.desc'),
      },
    },
    onDeck: true,
    source: 'trackplay',
    metric: 'games',
    metricKey: marker('deck.metric.games'),
  },
  {
    id: 'ritual',
    module: 'ritual',
    icon: 'sunny-outline',
    route: '/ritual',
    titleKey: marker('page-title.ritual'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.ritual.name'),
        descKey: marker('deck.cyberpunk.ritual.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.ritual.name'),
        descKey: marker('deck.boomer.ritual.desc'),
      },
    },
    onDeck: true,
    source: 'ritual',
    metric: 'done',
    metricKey: marker('deck.metric.rituals'),
  },
  {
    id: 'settings',
    module: 'settings',
    icon: 'settings-outline',
    route: '/settings',
    titleKey: marker('page-title.settings'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.settings.name'),
        descKey: marker('deck.cyberpunk.settings.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.settings.name'),
        descKey: marker('deck.boomer.settings.desc'),
      },
    },
    onDeck: true,
    status: 'online',
  },
  {
    id: 'geist',
    module: 'geist',
    icon: 'sparkles-outline',
    route: '/geist',
    titleKey: marker('page-title.geist'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.geist.name'),
        descKey: marker('deck.cyberpunk.geist.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.geist.name'),
        descKey: marker('deck.boomer.geist.desc'),
      },
    },
    onDeck: true,
    needsLanguageModel: true,
  },
];

export const DECK_SLOT_COUNT = DECK_CATALOG.filter(
  (entry) => entry.onDeck
).length;

export const DECK_CHROME_FIELDS = [
  'grid',
  'grid-value',
  'noise',
  'signal',
  'signal-value',
  'kicker',
  'res',
  'firewall',
  'firewall-value',
  'programs-loaded',
  'nuyen',
  'trace',
  'trace-value',
  'ice',
  'ice-value',
  'uptime',
  'node-online',
  'node-standby',
  'node-offline',
  'empty-title',
  'empty-body',
  'empty-action',
] as const;

export type DeckChromeField = (typeof DECK_CHROME_FIELDS)[number];

export type DeckChrome = Record<DeckChromeField, Marker>;
