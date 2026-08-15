import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { DataItem, TrackingViewId } from '../../model/tracking.types';
import { TrackingTimePipe } from '../../util/tracking-time.pipe';
import { TimeFromDataItemPipe } from '../../util/time-from-data-item.pipe';
import { BaseSwipeRow } from '../../../@shared/ui/base-item/base-swipe-row';

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
export class StatsItemComponent extends BaseSwipeRow {
  readonly item = input.required<DataItem>();
  readonly view = input.required<TrackingViewId>();
}
