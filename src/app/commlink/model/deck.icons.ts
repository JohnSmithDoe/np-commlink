import {
  barcodeOutline,
  businessOutline,
  cartOutline,
  checkboxOutline,
  diceOutline,
  fileTrayStackedOutline,
  hardwareChipOutline,
  notificationsOutline,
  optionsOutline,
  pricetagsOutline,
  restaurantOutline,
  settingsOutline,
  sparklesOutline,
  timerOutline,
  walletOutline,
} from 'ionicons/icons';

/**
 * Every icon a catalog entry may name, mapped to its ionicon data.
 *
 * This map IS the source of truth: `IDeckEntry.icon` is `keyof typeof`, so a
 * catalog entry naming an icon that is not here fails to compile, and the two
 * surfaces that render the catalog register `DECK_ICONS` rather than each keeping
 * a hand-written list. They kept 15 and 14 names respectively, with nothing
 * deriving either and nothing encoding why they differed — so a new entry rendered
 * an empty glyph on whichever surface was forgotten, with no compile error and
 * nothing the a11y rules could see (the `name` binding is present either way).
 *
 * Both surfaces register the whole set. Registering an icon that this user's
 * configuration happens to hide costs a map entry, whereas registering a subset
 * costs a blank tile — and `addIcons` is additive, so the two calls cannot
 * conflict.
 */
export const DECK_ICONS = {
  'barcode-outline': barcodeOutline,
  'business-outline': businessOutline,
  'cart-outline': cartOutline,
  'checkbox-outline': checkboxOutline,
  'dice-outline': diceOutline,
  'file-tray-stacked-outline': fileTrayStackedOutline,
  'hardware-chip-outline': hardwareChipOutline,
  'notifications-outline': notificationsOutline,
  'options-outline': optionsOutline,
  'pricetags-outline': pricetagsOutline,
  'restaurant-outline': restaurantOutline,
  'settings-outline': settingsOutline,
  'sparkles-outline': sparklesOutline,
  'timer-outline': timerOutline,
  'wallet-outline': walletOutline,
} as const;

export type TDeckIcon = keyof typeof DECK_ICONS;
