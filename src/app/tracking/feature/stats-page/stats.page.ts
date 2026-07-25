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
import { TrackingListPageFacade } from '../../data';
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
  readonly #facade = inject(TrackingListPageFacade);

  readonly data = this.#facade.data;
  readonly viewMode = this.#facade.viewMode;

  constructor() {
    addIcons({ triangle, ellipse, square });
  }

  ionViewWillEnter(): void {
    this.#facade.enterPage();
  }

  shareCSV() {
    this.#facade.shareCsv();
  }

  deleteItem(item: IDataItem) {
    this.#facade.removeDataItem(item);
  }

  selectViewMode({ detail }: CustomEvent<{ value: string }>) {
    this.#facade.changeDataView(detail.value);
  }
}
