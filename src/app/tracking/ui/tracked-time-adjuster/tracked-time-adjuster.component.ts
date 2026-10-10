import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  InputCustomEvent,
  IonButton,
  IonInput,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { parseNumberInput } from '../../../@shared/util/app.utils';
import { MinutesFromSecondsPipe } from '../../util/minutes-from-seconds.pipe';
import {
  TRACKED_TIME_STEPS_IN_MINUTES,
  TrackedDuration,
  trackedDuration,
} from '../../util/tracking-adjust.utils';

@Component({
  selector: 'app-tracked-time-adjuster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracked-time-adjuster.component.html',
  styleUrl: './tracked-time-adjuster.component.scss',
  imports: [IonButton, IonInput, MinutesFromSecondsPipe, TranslatePipe],
})
export class TrackedTimeAdjusterComponent {
  readonly trackedSeconds = input.required<number>();
  readonly breakSeconds = input.required<number>();
  readonly adjusted = output<number>();
  readonly durationChange = output<TrackedDuration>();

  readonly steps = TRACKED_TIME_STEPS_IN_MINUTES;
  readonly duration = computed(() => trackedDuration(this.trackedSeconds()));

  setPart(part: keyof TrackedDuration, event: InputCustomEvent) {
    this.durationChange.emit({
      ...this.duration(),
      [part]: parseNumberInput(event),
    });
  }
}
