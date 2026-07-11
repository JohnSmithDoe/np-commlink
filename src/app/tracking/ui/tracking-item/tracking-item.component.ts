import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
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
  IonReorder,
  IonText,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ITrackingItem, TColor, TIonDragEvent } from '../../../@shared/types';
import { NpTimeFromSecondsPipe } from '../../../@shared/util/pipes/np-time-from-seconds.pipe';
import { checkItemOptionsOnDrag } from '../../../@shared/util/app.utils';
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
import { NpTimeWithUnitPipe } from '../../../@shared/util/pipes/np-time-with-unit.pipe';

marker('tracking.item.state.running');
marker('tracking.item.state.stopped');
marker('tracking.item.state.paused');

@Component({
  selector: 'app-tracking-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracking-item.component.html',
  styleUrls: ['./tracking-item.component.scss'],
  imports: [
    IonItem,
    IonLabel,
    IonReorder,
    TranslateModule,
    IonNote,
    IonText,
    DatePipe,
    NpTimeFromSecondsPipe,
    IonButtons,
    IonButton,
    IonIcon,
    IonPopover,
    NpTimeWithUnitPipe,
    IonList,
  ],
})
export class TrackingItemComponent implements OnInit {
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

  ngOnInit() {
    if (!this.item()) throw new Error('Item must be set');
  }

  async handleItemOptionsOnDrag(ev: TIonDragEvent) {
    switch (checkItemOptionsOnDrag(ev)) {
      case 'end':
        return this.emitDeleteItem();
      case 'start':
        return this.emitEditItem();
    }
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
      case 'running':
        return 'success';
      case 'stopped':
        return 'tracking';
      case 'paused':
        return 'warning';
    }
  }
  getOppositeColor(item: ITrackingItem): TColor {
    if (item.state === 'running') {
      return 'warning';
    } else {
      return 'success';
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
