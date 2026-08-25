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
    id: 'stats',
    module: 'tracking',
    icon: 'documents-outline',
    route: '/data',
    titleKey: marker('page-title.data'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.stats.name'),
        descKey: marker('deck.cyberpunk.stats.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.stats.name'),
        descKey: marker('deck.boomer.stats.desc'),
      },
    },
    onDeck: true,
    status: 'online',
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
    id: 'notes',
    module: 'notes',
    icon: 'document-text-outline',
    route: '/notes',
    titleKey: marker('page-title.notes'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.notes.name'),
        descKey: marker('deck.cyberpunk.notes.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.notes.name'),
        descKey: marker('deck.boomer.notes.desc'),
      },
    },
    onDeck: true,
    source: 'notes',
    metric: 'count',
    metricKey: marker('deck.metric.count'),
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
    id: 'spending',
    module: 'cash',
    icon: 'receipt-outline',
    route: '/cash/spending',
    titleKey: marker('page-title.cash-spending'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.spending.name'),
        descKey: marker('deck.cyberpunk.spending.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.spending.name'),
        descKey: marker('deck.boomer.spending.desc'),
      },
    },
    onDeck: true,
    status: 'online',
  },
  {
    id: 'burndown',
    module: 'cash',
    icon: 'speedometer-outline',
    route: '/cash/burndown',
    titleKey: marker('page-title.cash-burndown'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.burndown.name'),
        descKey: marker('deck.cyberpunk.burndown.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.burndown.name'),
        descKey: marker('deck.boomer.burndown.desc'),
      },
    },
    onDeck: true,
    status: 'online',
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
    id: 'vitals',
    module: 'vitals',
    icon: 'pulse-outline',
    route: '/vitals',
    titleKey: marker('page-title.vitals'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.vitals.name'),
        descKey: marker('deck.cyberpunk.vitals.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.vitals.name'),
        descKey: marker('deck.boomer.vitals.desc'),
      },
    },
    onDeck: true,
    source: 'vitals',
    metric: 'count',
    metricKey: marker('deck.metric.count'),
  },
  {
    id: 'iching',
    module: 'vitals',
    icon: 'layers-outline',
    route: '/vitals/iching',
    titleKey: marker('page-title.vitals-iching'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.iching.name'),
        descKey: marker('deck.cyberpunk.iching.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.iching.name'),
        descKey: marker('deck.boomer.iching.desc'),
      },
    },
    onDeck: true,
    status: 'online',
  },
  {
    id: 'cast',
    module: 'vitals',
    icon: 'disc-outline',
    route: '/vitals/iching/cast',
    titleKey: marker('page-title.vitals-iching-cast'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.cast.name'),
        descKey: marker('deck.cyberpunk.cast.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.cast.name'),
        descKey: marker('deck.boomer.cast.desc'),
      },
    },
    onDeck: true,
    status: 'online',
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
    id: 'handbook',
    module: 'handbook',
    icon: 'book-outline',
    route: '/handbook',
    titleKey: marker('page-title.handbook'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.handbook.name'),
        descKey: marker('deck.cyberpunk.handbook.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.handbook.name'),
        descKey: marker('deck.boomer.handbook.desc'),
      },
    },
    onDeck: false,
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
    id: 'deck',
    module: 'settings',
    icon: 'grid-outline',
    route: '/commlink/deck',
    titleKey: marker('page-title.deck-config'),
    labels: {
      cyberpunk: {
        nameKey: marker('deck.cyberpunk.deck.name'),
        descKey: marker('deck.cyberpunk.deck.desc'),
      },
      boomer: {
        nameKey: marker('deck.boomer.deck.name'),
        descKey: marker('deck.boomer.deck.desc'),
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
