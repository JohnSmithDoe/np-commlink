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
import { documentsOutline, ellipse, square, triangle } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { SessionsChartComponent } from '../../smart-ui/sessions-chart/sessions-chart.component';
import { TrackingListPageFacade } from '../../data';
import { IDataItem } from '../../model/tracking.types';
import { StatsItemComponent } from '../../ui/stats-item/stats-item.component';

@Component({
  selector: 'app-page-stats',
  templateUrl: 'stats.page.html',
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
export class StatsPage {
  readonly #facade = inject(TrackingListPageFacade);

  readonly sessionsByView = this.#facade.sessionsByView;
  readonly viewMode = this.#facade.viewMode;

  constructor() {
    addIcons({ triangle, ellipse, square, documentsOutline });
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
