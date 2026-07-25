import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  createTelemetryEffect,
  metric,
} from '../../../@shared/data/create-telemetry.effect';
import { selectNotificationsBadgeCount } from '../notifications.selector';

// Telemetry inversion (§4, CQRS): notifications *pushes* its unread count to
// the shared dashboard read-model. Imports only its own selector + the @shared
// contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class NotificationsTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createTelemetryEffect(
    this.#store,
    'notifications',
    selectNotificationsBadgeCount,
    metric('unread')
  );
}
