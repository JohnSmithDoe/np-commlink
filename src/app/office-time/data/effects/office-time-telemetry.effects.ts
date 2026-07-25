import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { createTelemetryEffect } from '../../../@shared/data/create-telemetry.effect';
import { selectDashboardStatsYear } from '../office-time/office-time.stats.selector';

// office-time reports two fields from its year stats, so it passes its own
// projector rather than the single-metric `metric(key)` helper.
const toStatsMetrics = (stats: {
  officedays: number;
  percentage: number;
}): { officedays: number; percentage: number } => ({
  officedays: stats.officedays,
  percentage: stats.percentage,
});

// Telemetry inversion (§4, CQRS): office-time *pushes* its year stats to the
// shared dashboard read-model. Imports only its own selector + the @shared
// contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class OfficeTimeTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createTelemetryEffect(
    this.#store,
    'office-time',
    selectDashboardStatsYear,
    toStatsMetrics
  );
}
