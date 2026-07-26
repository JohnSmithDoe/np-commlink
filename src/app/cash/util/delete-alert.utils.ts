import { AlertOptions } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

/**
 * Options for a standard cash "confirm delete" alert: the caller's header +
 * message over the shared cancel / destructive-delete buttons. The entity keys
 * are passed in (already `marker()`-ed at the call site so the i18n extractor
 * still sees them); the `cash.action.*` button keys are registered here.
 */
export function deleteConfirmAlert(
  translate: TranslateService,
  opts: {
    headerKey: string;
    messageKey: string;
    messageParams?: Record<string, unknown>;
    onConfirm: () => void;
  }
): AlertOptions {
  return {
    header: translate.instant(opts.headerKey),
    message: translate.instant(opts.messageKey, opts.messageParams),
    buttons: [
      { text: translate.instant(marker('cash.action.cancel')), role: 'cancel' },
      {
        text: translate.instant(marker('cash.action.delete')),
        role: 'destructive',
        handler: opts.onConfirm,
      },
    ],
  };
}
