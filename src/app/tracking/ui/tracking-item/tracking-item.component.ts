import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
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
import { TColor } from '../../../@shared/model/app.types';
import {
  ITrackingItem,
  TRACKING_STATE_LABEL_KEYS,
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
import { TimeWithUnitPipe } from '../../util/time-with-unit.pipe';

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
    TimeWithUnitPipe,
    IonList,
  ],
})
export class TrackingItemComponent {
  readonly stateLabelKeys = TRACKING_STATE_LABEL_KEYS;

  readonly item = input.required<ITrackingItem>();
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

  async emitDeleteItem() {
    await this.ionList().closeSlidingItems();
    this.deleteItem.emit();
  }

  async emitEditItem() {
    await this.ionList().closeSlidingItems();
    this.editItem.emit();
  }

  getColor(item: ITrackingItem): TColor {
    switch (item.state) {
      case 'running': {
        return 'success';
      }
      case 'stopped': {
        return 'medium';
      }
      case 'paused': {
        return 'warning';
      }
    }
  }
  async emitResetItem() {
    await this.ionList().closeSlidingItems();
    this.resetItem.emit();
  }

  protected getIcon(item: ITrackingItem) {
    return item.state === 'running' ? 'pause-outline' : 'play-outline';
  }
}
