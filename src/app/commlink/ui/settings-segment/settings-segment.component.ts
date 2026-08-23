/* ─── why ─────────────────────────────────────────────────────────
 * The label is a SIBLING item, not a wrapper: `ion-item` wires no
 * `aria-labelledby`, so the association is the `labelId` this component
 * writes on both halves. The options stay projected because each picker
 * labels its own differently — two through i18n keys, the languages by
 * their own untranslated names.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonItem, IonLabel, IonSegment } from '@ionic/angular/standalone';
import type { SegmentCustomEvent } from '@ionic/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-segment',
  templateUrl: './settings-segment.component.html',
  styleUrl: './settings-segment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItem, IonLabel, IonSegment, TranslatePipe],
})
export class SettingsSegmentComponent {
  readonly labelKey = input.required<string>();
  readonly labelId = input.required<string>();
  readonly value = input.required<string>();

  readonly valueChange = output<string>();

  pick(event: SegmentCustomEvent): void {
    this.valueChange.emit(String(event.detail.value));
  }
}
