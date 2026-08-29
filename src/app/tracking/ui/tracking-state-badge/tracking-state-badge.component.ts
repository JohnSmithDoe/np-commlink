import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  TRACKING_STATE_LABEL_KEYS,
  TrackingItemState,
} from '../../model/tracking.types';

@Component({
  selector: 'app-tracking-state-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracking-state-badge.component.html',
  styleUrl: './tracking-state-badge.component.scss',
  imports: [TranslatePipe],
})
export class TrackingStateBadgeComponent {
  readonly state = input.required<TrackingItemState>();

  readonly labelKeys = TRACKING_STATE_LABEL_KEYS;
}
