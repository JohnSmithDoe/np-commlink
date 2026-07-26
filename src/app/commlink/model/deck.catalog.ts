import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IDeckEntry } from './deck.types';

/**
 * Every navigable destination in the app, in factory order — the single list
 * behind both the deck grid and the side menu.
 *
 * It lives in `commlink` because a domain owns the routes it *serves*, not its
 * own presentation in navigation: `groceries` has no opinion about being called
 * MARKET or sitting seventh. Per-domain manifests would also force the shell to
 * import all eleven domains eagerly, undoing the `loadChildren`-only seal.
 *
 * Order here is only the *default*; the user's `order` list overrides it, and a
 * new entry appended here lands at the end of an existing configuration.
 */
export const DECK_CATALOG: readonly IDeckEntry[] = [
  {
    id: 'commlink',
    module: 'commlink',
    icon: 'hardware-chip-outline',
    route: '/commlink',
    titleKey: marker('page-title.commlink'),
    onDeck: false,
  },
  {
    id: 'tracking',
    module: 'tracking',
    icon: 'timer-outline',
    route: '/tracking',
    titleKey: marker('page-title.tracking'),
    onDeck: true,
    source: 'tracking',
    metric: 'count',
  },
  {
    id: 'office-time',
    module: 'office-time',
    icon: 'business-outline',
    route: '/office-time',
    titleKey: marker('page-title.office-time'),
    onDeck: true,
    source: 'office-time',
    metric: 'officedays',
  },
  {
    id: 'notifications',
    module: 'notifications',
    icon: 'notifications-outline',
    route: '/notifications',
    titleKey: marker('page-title.notifications'),
    onDeck: true,
    source: 'notifications',
    metric: 'unread',
  },
  {
    id: 'barcode',
    module: 'barcode',
    icon: 'barcode-outline',
    route: '/barcode',
    titleKey: marker('page-title.barcode'),
    onDeck: true,
    status: 'online',
  },
  {
    id: 'soykaf',
    module: 'groceries',
    icon: 'restaurant-outline',
    route: '/soykaf',
    titleKey: marker('page-title.soykaf'),
    onDeck: true,
    source: 'recipes',
    metric: 'count',
  },
  {
    id: 'shopping',
    module: 'groceries',
    icon: 'cart-outline',
    route: '/groceries/shopping/_shopping',
    titleKey: marker('page-title.groceries-shopping'),
    onDeck: true,
    source: 'shopping',
    metric: 'active',
  },
  {
    id: 'storage',
    module: 'groceries',
    icon: 'file-tray-stacked-outline',
    route: '/groceries/storage/_storage',
    titleKey: marker('page-title.groceries-storage'),
    onDeck: true,
    source: 'storage',
    metric: 'low',
  },
  {
    id: 'tasks',
    module: 'tasks',
    icon: 'checkbox-outline',
    route: '/tasks/_tasks',
    titleKey: marker('page-title.tasks'),
    onDeck: true,
    source: 'tasks',
    metric: 'open',
  },
  {
    id: 'products',
    module: 'groceries',
    icon: 'pricetags-outline',
    route: '/groceries/products/_products',
    titleKey: marker('page-title.groceries-products'),
    onDeck: true,
    source: 'products',
    metric: 'count',
  },
  {
    id: 'list-settings',
    module: 'groceries',
    icon: 'options-outline',
    route: '/groceries/list-settings',
    titleKey: marker('page-title.groceries-list-settings'),
    onDeck: false,
  },
  {
    id: 'cash',
    module: 'cash',
    icon: 'wallet-outline',
    route: '/cash',
    titleKey: marker('page-title.cash'),
    onDeck: true,
    source: 'cash',
    metric: 'balance',
    currency: true,
  },
  {
    id: 'trackplay',
    module: 'trackplay',
    icon: 'dice-outline',
    route: '/trackplay',
    titleKey: marker('page-title.trackplay-games'),
    onDeck: true,
    source: 'trackplay',
    metric: 'games',
  },
  {
    id: 'settings',
    module: 'settings',
    icon: 'settings-outline',
    route: '/settings',
    titleKey: marker('page-title.settings'),
    onDeck: true,
    status: 'online',
  },
  {
    id: 'geist',
    module: 'geist',
    icon: 'sparkles-outline',
    route: '/geist',
    titleKey: marker('page-title.geist'),
    onDeck: true,
    needsLanguageModel: true,
  },
];

/**
 * The grid's full complement, hidden tiles included — the deck's status strip
 * reports what the grid *has*, not what this user shows.
 */
export const DECK_SLOT_COUNT = DECK_CATALOG.filter(
  (entry) => entry.onDeck
).length;
