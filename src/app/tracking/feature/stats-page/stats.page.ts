import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import {
  IonButton,
  IonContent,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ellipse, square, triangle } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { SessionsChartComponent } from '../../smart-ui/sessions-chart/sessions-chart.component';
import { Store } from '@ngrx/store';
import {
  selectTrackingData,
  selectTrackingDataViewId,
  TrackingActions,
} from '../../data';
import { IDataItem } from '../../model';
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
export class StatsPage implements ViewWillEnter {
  readonly #store = inject(Store);

  readonly data = this.#store.selectSignal(selectTrackingData);
  readonly viewMode = this.#store.selectSignal(selectTrackingDataViewId);

  constructor() {
    addIcons({ triangle, ellipse, square });
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(TrackingActions.enterPage());
  }

  shareCSV() {
    this.#store.dispatch(TrackingActions.shareData());
  }

  deleteItem(item: IDataItem) {
    this.#store.dispatch(TrackingActions.removeDataItem(item));
  }

  selectViewMode({ detail }: CustomEvent<{ value: string }>) {
    this.#store.dispatch(TrackingActions.changeDataView(detail.value));
  }
}
