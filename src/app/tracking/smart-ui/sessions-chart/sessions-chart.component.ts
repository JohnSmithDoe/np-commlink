import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { TrackingFacade } from '../../data';
import { chartColors } from '../../../@shared/util/charts/chart-colors';
import {
  BASE_CHART_OPTIONS,
  COMPACT_AXIS,
  HOVER_BY_INDEX,
  LEGEND_BOTTOM,
} from '../../../@shared/util/charts/chart-options';
import { localizedDayMonth } from '../../../@shared/util/formatting/date-format.utils';
import { LanguageService } from '../../../@shared/data/theme/language.service';

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
    ...BASE_CHART_OPTIONS,
    interaction: HOVER_BY_INDEX,
    plugins: {
      legend: LEGEND_BOTTOM,
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
      x: { ...COMPACT_AXIS, stacked: true },
    },
  };
}
