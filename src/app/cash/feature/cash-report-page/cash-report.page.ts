import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { RouterLink } from '@angular/router';
import { CashReportFacade } from '../../data';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import {
  REPORT_SCOPES,
  ReportScope,
  SCOPE_LABEL_KEYS,
} from '../../model/report.types';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { chartColors } from '../../../@shared/util/charts/chart-colors';
import { localizedShortMonthYear } from '../../../@shared/util/formatting/date-format.utils';
import { centsToEur } from '../../util/money.utils';

Chart.register(...registerables);

@Component({
  selector: 'app-page-cash-report',
  templateUrl: './cash-report.page.html',
  styleUrls: ['./cash-report.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RouterLink,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonSegment,
    IonSegmentButton,
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
    BaseChartDirective,
  ],
})
export class CashReportPage {
  readonly #facade = inject(CashReportFacade);
  readonly #translate = inject(TranslateService);
  readonly #colors = chartColors();

  readonly scopes = REPORT_SCOPES;
  readonly scopeLabelKeys = SCOPE_LABEL_KEYS;
  readonly scope = this.#facade.scope;
  readonly totals = this.#facade.totals;
  readonly #monthly = this.#facade.monthlyTotals;
  readonly spendByCategory = this.#facade.spendByCategory;
  readonly biggestExpenses = this.#facade.biggestExpenses;
  readonly spendByCounterparty = this.#facade.spendByCounterparty;
  readonly uncategorized = this.#facade.uncategorized;

  selectScope(scope: ReportScope): void {
    this.#facade.setScope(scope);
  }

  readonly hasData = computed(
    () => this.#monthly().length > 0 || this.spendByCategory().length > 0
  );

  readonly monthlyData = computed<ChartData<'bar'>>(() => {
    const months = this.#monthly();
    return {
      labels: months.map((m) => localizedShortMonthYear(`${m.month}-01`)),
      datasets: [
        {
          label: this.#translate.instant(marker('cash.report.income')),
          data: months.map((m) => centsToEur(m.incomeCents)),
          backgroundColor: this.#colors.income,
          borderWidth: 0,
        },
        {
          label: this.#translate.instant(marker('cash.report.spend')),
          data: months.map((m) => centsToEur(m.spendCents)),
          backgroundColor: this.#colors.spend,
          borderWidth: 0,
        },
      ],
    };
  });

  readonly categoryData = computed<ChartData<'doughnut'>>(() => {
    const cats = this.spendByCategory();
    const uncategorized = this.#translate.instant(
      marker('cash.report.uncategorized')
    );
    return {
      labels: cats.map((c) => c.category || uncategorized),
      datasets: [
        {
          data: cats.map((c) => centsToEur(c.cents)),
          backgroundColor: cats.map(
            (_, index) =>
              this.#colors.series[index % this.#colors.series.length]
          ),
          borderWidth: 0,
        },
      ],
    };
  });

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => `${v} €` } },
      x: { ticks: { autoSkip: true, maxRotation: 0 } },
    },
  };

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
    },
  };
}
