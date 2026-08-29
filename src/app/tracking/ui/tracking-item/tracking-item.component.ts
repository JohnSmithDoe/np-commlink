import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  OutputEmitterRef,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPopover,
  IonText,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  TRACKING_STATE_COLOR,
  TRACKING_STATE_LABEL_KEYS,
  TRACKING_TOGGLE_ICON,
  TrackingItem,
} from '../../model/tracking.types';
import { MinutesFromSecondsPipe } from '../../util/minutes-from-seconds.pipe';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  createOutline,
  ellipsisVertical,
  pauseOutline,
  pauseSharp,
  playOutline,
  playSharp,
  refreshOutline,
  stopOutline,
  stopSharp,
  trashOutline,
} from 'ionicons/icons';
import { TrackingTimePipe } from '../../util/tracking-time.pipe';
import { TrackingStateBadgeComponent } from '../tracking-state-badge/tracking-state-badge.component';

marker('tracking.item.action.start');
marker('tracking.item.action.pause');

@Component({
  selector: 'app-tracking-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracking-item.component.html',
  styleUrls: ['./tracking-item.component.scss'],
  imports: [
    IonItem,
    IonLabel,
    TranslatePipe,
    IonNote,
    IonText,
    DatePipe,
    MinutesFromSecondsPipe,
    IonButtons,
    IonButton,
    IonIcon,
    IonPopover,
    TrackingTimePipe,
    TrackingStateBadgeComponent,
    IonList,
  ],
})
export class TrackingItemComponent {
  readonly stateLabelKeys = TRACKING_STATE_LABEL_KEYS;
  readonly stateColor = TRACKING_STATE_COLOR;
  readonly toggleIcon = TRACKING_TOGGLE_ICON;

  readonly item = input.required<TrackingItem>();
  readonly ionList = input.required<IonList>();

  readonly selectItem = output<void>();
  readonly deleteItem = output<void>();
  readonly editItem = output<void>();
  readonly resetItem = output<void>();

  constructor() {
    addIcons({
      createOutline,
      playOutline,
      stopOutline,
      pauseOutline,
      playSharp,
      stopSharp,
      pauseSharp,
      trashOutline,
      closeOutline,
      ellipsisVertical,
      refreshOutline,
    });
  }

  async closeAndEmit(action: OutputEmitterRef<void>) {
    await this.ionList().closeSlidingItems();
    action.emit();
  }
}
