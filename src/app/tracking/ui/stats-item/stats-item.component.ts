import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { IonDragEvent } from '../../../@shared/model/app.types';
import { DataItem, TrackingViewId } from '../../model/tracking.types';
import { TrackingTimePipe } from '../../util/tracking-time.pipe';
import { TimeFromDataItemPipe } from '../../util/time-from-data-item.pipe';
import { revealedSideFromDrag } from '../../../@shared/util/app.utils';

@Component({
  selector: 'app-stats-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-item.component.html',
  imports: [
    IonItem,
    IonLabel,
    TranslatePipe,
    NgTemplateOutlet,
    IonNote,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    TrackingTimePipe,
    TimeFromDataItemPipe,
  ],
})
export class StatsItemComponent {
  readonly item = input.required<DataItem>();
  readonly view = input.required<TrackingViewId>();
  readonly ionList = input.required<IonList>();

  readonly deleteItem = output<void>();

  async deleteOnSwipe(event: IonDragEvent) {
    switch (revealedSideFromDrag(event)) {
      case 'end': {
        return this.emitDeleteItem();
      }
    }
  }

  async emitDeleteItem() {
    await this.ionList().closeSlidingItems();
    this.deleteItem.emit();
  }
}
