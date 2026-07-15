import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
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
import { TranslateModule } from '@ngx-translate/core';
import { IDataItem, TIonDragEvent } from '../../../@shared/types';
import { NpTrackingTimePipe } from '../../util/np-tracking-time.pipe';
import { NpTimeFromDataItemPipe } from '../../../@shared/util/pipes/np-time-from-data-item.pipe';
import { checkItemOptionsOnDrag } from '../../../@shared/util/app.utils';

@Component({
  selector: 'app-data-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-item.component.html',
  styleUrls: ['./stats-item.component.scss'],
  imports: [
    IonItem,
    IonLabel,
    TranslateModule,
    NgTemplateOutlet,
    IonNote,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    NpTrackingTimePipe,
    NpTimeFromDataItemPipe,
  ],
})
export class StatsItemComponent implements OnInit {
  readonly item = input.required<IDataItem>();
  readonly view = input.required<string>();
  readonly ionList = input.required<IonList>();

  readonly deleteItem = output<void>();

  ngOnInit() {
    if (!this.item()) throw new Error('Item must be set');
  }

  async handleItemOptionsOnDrag(ev: TIonDragEvent) {
    switch (checkItemOptionsOnDrag(ev)) {
      case 'end':
        return this.emitDeleteItem();
    }
  }

  async emitDeleteItem() {
    await this.ionList().closeSlidingItems();
    this.deleteItem.emit();
  }
}
