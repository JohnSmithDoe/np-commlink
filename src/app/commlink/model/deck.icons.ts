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
  sunnyOutline,
  timerOutline,
  walletOutline,
} from 'ionicons/icons';

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
  'sunny-outline': sunnyOutline,
  'timer-outline': timerOutline,
  'wallet-outline': walletOutline,
} as const;

export type DeckIcon = keyof typeof DECK_ICONS;
