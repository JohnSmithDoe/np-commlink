import { AlertOptions } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export function deleteConfirmAlert(
  translate: TranslateService,
  options: {
    headerKey: string;
    messageKey: string;
    messageParams?: Record<string, unknown>;
    onConfirm: () => void;
  }
): AlertOptions {
  return {
    header: translate.instant(options.headerKey),
    message: translate.instant(options.messageKey, options.messageParams),
    buttons: [
      { text: translate.instant(marker('cash.action.cancel')), role: 'cancel' },
      {
        text: translate.instant(marker('cash.action.delete')),
        role: 'destructive',
        handler: options.onConfirm,
      },
    ],
  };
}
