import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import dayjs from 'dayjs';
import { CashFacade } from '../../../data';
import { CashDetailHeaderComponent } from '../../../ui/cash-detail-header/cash-detail-header.component';
import { MoneyEurPipe } from '../../../util/formatting/money.pipe';
import { chartColors } from '../../../../@shared/util/charts/chart-colors';

Chart.register(...registerables);

@Component({
  selector: 'app-page-cash-report',
  templateUrl: './cash-report.page.html',
  styleUrls: ['./cash-report.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CashDetailHeaderComponent,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    TranslatePipe,
    MoneyEurPipe,
    BaseChartDirective,
  ],
})
export class CashReportPage {
  readonly #facade = inject(CashFacade);
  readonly #router = inject(Router);
  readonly #translate = inject(TranslateService);
  readonly #colors = chartColors();

  readonly totals = this.#facade.reportTotals;
  readonly #monthly = this.#facade.monthlyTotals;
  readonly spendByCategory = this.#facade.spendByCategory;

  readonly hasData = computed(
    () => this.#monthly().length > 0 || this.spendByCategory().length > 0
  );

  readonly monthlyData = computed<ChartData<'bar'>>(() => {
    const months = this.#monthly();
    return {
      labels: months.map((m) => dayjs(`${m.month}-01`).format('MMM YY')),
      datasets: [
        {
          label: this.#translate.instant(marker('cash.report.income')),
          data: months.map((m) => m.incomeCents / 100),
          backgroundColor: this.#colors.income,
          borderWidth: 0,
        },
        {
          label: this.#translate.instant(marker('cash.report.spend')),
          data: months.map((m) => m.spendCents / 100),
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
          data: cats.map((c) => c.cents / 100),
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

  goBack(): void {
    void this.#router.navigate(['/cash']);
  }
}
