import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import {
  IonButton,
  IonContent,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ellipse, square, triangle } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { SessionsChartComponent } from '../../smart-ui/sessions-chart/sessions-chart.component';
import { Store } from '@ngrx/store';
import {
  selectTrackingData,
  selectTrackingDataViewId,
} from '../../data/tracking.selector';
import { trackingActions } from '../../data/tracking.actions';
import { IDataItem, IonViewWillEnter } from '../../../@shared/types';
import { StatsItemComponent } from '../../ui/stats-item/stats-item.component';

@Component({
  selector: 'app-stats-page',
  templateUrl: 'stats.page.html',
  styleUrls: ['stats.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    StatsItemComponent,
    IonButton,
    IonContent,
    IonList,
    PageHeaderComponent,
    SessionsChartComponent,
    IonSelect,
    IonSelectOption,
    IonItem,
  ],
})
export class StatsPage implements IonViewWillEnter {
  readonly #store = inject(Store);

  readonly data = this.#store.selectSignal(selectTrackingData);
  readonly viewMode = this.#store.selectSignal(selectTrackingDataViewId);

  constructor() {
    addIcons({ triangle, ellipse, square });
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(trackingActions.enterPage());
  }

  shareCSV() {
    this.#store.dispatch(trackingActions.shareData());
  }

  deleteItem(item: IDataItem) {
    this.#store.dispatch(trackingActions.removeDataItem(item));
  }

  selectViewMode({ detail }: CustomEvent<{ value: string }>) {
    this.#store.dispatch(trackingActions.changeDataView(detail.value));
  }
}
