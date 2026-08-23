import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

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
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { Marker } from '../../../@shared/model/app.types';
import { SessionsChartComponent } from '../../smart-ui/sessions-chart/sessions-chart.component';
import { TrackingFacade } from '../../data';
import {
  DataItem,
  TRACKING_VIEW_IDS,
  TrackingViewId,
} from '../../model/tracking.types';
import { StatsItemComponent } from '../../ui/stats-item/stats-item.component';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';

const VIEW_LABEL_KEYS: Record<TrackingViewId, Marker> = {
  raw: marker('data.page.title.raw'),
  today: marker('data.page.title.today'),
  daily: marker('data.page.title.daily'),
  monthly: marker('data.page.title.monthly'),
  all: marker('data.page.title.all'),
};

@Component({
  selector: 'app-page-stats',
  templateUrl: 'stats.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    TranslatePipe,
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
  readonly #facade = inject(TrackingFacade);

  readonly sessionsByView = this.#facade.sessionsByView;
  readonly viewMode = this.#facade.viewMode;
  readonly viewIds = TRACKING_VIEW_IDS;
  readonly viewLabelKeys = VIEW_LABEL_KEYS;

  constructor() {
    addIcons({ triangle, ellipse, square, documentsOutline });
  }

  shareCSV() {
    this.#facade.shareCsv();
  }

  deleteItem(item: DataItem) {
    this.#facade.removeDataItem(item);
  }

  selectViewMode({ detail }: CustomEvent<{ value: TrackingViewId }>) {
    this.#facade.changeDataView(detail.value);
  }
}
