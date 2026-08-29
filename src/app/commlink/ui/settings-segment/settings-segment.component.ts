/* ─── why ─────────────────────────────────────────────────────────
 * The label is a SIBLING header, not a wrapper: `ion-item` wires no
 * `aria-labelledby`, so the association is the `labelId` this component
 * writes on both halves. The options stay projected because each picker
 * labels its own differently — two through i18n keys, the languages by
 * their own untranslated names.
 *
 * It is an `ion-list-header` because a picker's label IS its section
 * heading on this page — spelling it as a plain row is what made every
 * heading on SYSOP weigh the same as the values under it.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonItem,
  IonLabel,
  IonListHeader,
  IonSegment,
} from '@ionic/angular/standalone';
import type { SegmentCustomEvent } from '@ionic/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-settings-segment',
  templateUrl: './settings-segment.component.html',
  styleUrl: './settings-segment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItem, IonLabel, IonListHeader, IonSegment, TranslatePipe],
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
