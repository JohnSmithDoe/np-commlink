import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TMarker, TTheme } from '../../@shared/model/app.types';
import { TDeckChrome } from './deck.catalog';
import { TAppModule } from './deck.types';

/**
 * The deck's chrome, voiced per theme — where the deck reads NOISE / ICE, a
 * plain office tool names the same slots by what they actually mean.
 *
 * The keys are spelled out rather than composed from theme + field because a
 * composed key is invisible to `i18n:extract`, which would then prune all 38 of
 * them. The one map here that nests does so on a *real* axis: the outer level is
 * the theme, and being a `Record<TTheme, TDeckChrome>` is what turns a new theme
 * into a compile error instead of raw keys in the HUD.
 */
export const DECK_CHROME_LABELS: Record<TTheme, TDeckChrome> = {
  cyberpunk: {
    grid: marker('deck.cyberpunk.chrome.grid'),
    'grid-value': marker('deck.cyberpunk.chrome.grid-value'),
    noise: marker('deck.cyberpunk.chrome.noise'),
    signal: marker('deck.cyberpunk.chrome.signal'),
    'signal-value': marker('deck.cyberpunk.chrome.signal-value'),
    kicker: marker('deck.cyberpunk.chrome.kicker'),
    res: marker('deck.cyberpunk.chrome.res'),
    firewall: marker('deck.cyberpunk.chrome.firewall'),
    'firewall-value': marker('deck.cyberpunk.chrome.firewall-value'),
    'programs-loaded': marker('deck.cyberpunk.chrome.programs-loaded'),
    nuyen: marker('deck.cyberpunk.chrome.nuyen'),
    trace: marker('deck.cyberpunk.chrome.trace'),
    'trace-value': marker('deck.cyberpunk.chrome.trace-value'),
    ice: marker('deck.cyberpunk.chrome.ice'),
    'ice-value': marker('deck.cyberpunk.chrome.ice-value'),
    uptime: marker('deck.cyberpunk.chrome.uptime'),
    'node-online': marker('deck.cyberpunk.chrome.node-online'),
    'node-standby': marker('deck.cyberpunk.chrome.node-standby'),
    'node-offline': marker('deck.cyberpunk.chrome.node-offline'),
  },
  boomer: {
    grid: marker('deck.boomer.chrome.grid'),
    'grid-value': marker('deck.boomer.chrome.grid-value'),
    noise: marker('deck.boomer.chrome.noise'),
    signal: marker('deck.boomer.chrome.signal'),
    'signal-value': marker('deck.boomer.chrome.signal-value'),
    kicker: marker('deck.boomer.chrome.kicker'),
    res: marker('deck.boomer.chrome.res'),
    firewall: marker('deck.boomer.chrome.firewall'),
    'firewall-value': marker('deck.boomer.chrome.firewall-value'),
    'programs-loaded': marker('deck.boomer.chrome.programs-loaded'),
    nuyen: marker('deck.boomer.chrome.nuyen'),
    trace: marker('deck.boomer.chrome.trace'),
    'trace-value': marker('deck.boomer.chrome.trace-value'),
    ice: marker('deck.boomer.chrome.ice'),
    'ice-value': marker('deck.boomer.chrome.ice-value'),
    uptime: marker('deck.boomer.chrome.uptime'),
    'node-online': marker('deck.boomer.chrome.node-online'),
    'node-standby': marker('deck.boomer.chrome.node-standby'),
    'node-offline': marker('deck.boomer.chrome.node-offline'),
  },
};

/** The coarse module toggles on the deck config page. */
export const DECK_MODULE_LABELS: Record<TAppModule, TMarker> = {
  commlink: marker('deck.module.commlink'),
  tracking: marker('deck.module.tracking'),
  'office-time': marker('deck.module.office-time'),
  notifications: marker('deck.module.notifications'),
  barcode: marker('deck.module.barcode'),
  groceries: marker('deck.module.groceries'),
  tasks: marker('deck.module.tasks'),
  cash: marker('deck.module.cash'),
  trackplay: marker('deck.module.trackplay'),
  geist: marker('deck.module.geist'),
  settings: marker('deck.module.settings'),
};
