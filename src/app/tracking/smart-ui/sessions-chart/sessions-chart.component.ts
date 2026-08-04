import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { TrackingFacade } from '../../data';
import { chartColors } from '../../../@shared/util/charts/chart-colors';
import { localizedDayMonth } from '../../../@shared/util/formatting/date-format.utils';
import { LanguageService } from '../../../@shared/data/theme/language.service';

Chart.register(...registerables);

const REMAINDER_LABEL = marker('tracking.chart.other');

@Component({
  selector: 'app-sessions-chart',
  templateUrl: './sessions-chart.component.html',
  styleUrls: ['./sessions-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
})
export class SessionsChartComponent {
  readonly #raw = inject(TrackingFacade).sessionsByDayAndName;
  readonly #language = inject(LanguageService).language;
  readonly #translate = inject(TranslateService);
  readonly #series = chartColors().series;

  readonly hasData = computed(() =>
    this.#raw().series.some((s) => s.hours.some((h) => h > 0))
  );

  readonly chartData = computed<ChartData<'bar'>>(() => {
    const { days, series } = this.#raw();
    return {
      labels: days.map((d) => localizedDayMonth(d, this.#language())),
      datasets: series.map((s, index) => ({
        label: s.name ?? this.#translate.instant(REMAINDER_LABEL),
        data: s.hours,
        backgroundColor: this.#series[index % this.#series.length],
        borderWidth: 0,
        stack: 'sessions',
      })),
    };
  });

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
      tooltip: {
        filter: (item) => (item.parsed.y ?? 0) > 0,
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${(context.parsed.y ?? 0).toFixed(2)}h`,
        },
      },
    },
    scales: {
      y: {
        stacked: true,
        title: { display: true, text: 'h' },
        beginAtZero: true,
        ticks: { precision: 1 },
      },
      x: {
        stacked: true,
        ticks: { autoSkip: true, maxRotation: 0 },
      },
    },
  };
}
