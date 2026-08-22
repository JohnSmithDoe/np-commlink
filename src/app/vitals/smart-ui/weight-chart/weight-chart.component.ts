/* ─── why ─────────────────────────────────────────────────────────
 * The x axis is a CATEGORY axis, so a three-week gap between two
 * readings renders as one step. A true time axis needs a chart.js date
 * adapter, and for a personal log the direction is what is read, not the
 * slope — the dates are on the labels either way.
 *
 * Whether there is a trend to draw is the page's question, asked before
 * this component is loaded at all — see `ReadingsPageFacade.hasTrend`.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { LanguageService } from '../../../@shared/data/theme/language.service';
import { chartColors } from '../../../@shared/util/charts/chart-colors';
import { localizedDayMonth } from '../../../@shared/util/formatting/date-format.utils';
import { ReadingsFacade } from '../../data';
import { formatKg, gramsToKg } from '../../util/weight.utils';

Chart.register(...registerables);

const SERIES_LABEL = marker('vitals.chart.weight');

@Component({
  selector: 'app-weight-chart',
  templateUrl: './weight-chart.component.html',
  styleUrls: ['./weight-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
})
export class WeightChartComponent {
  readonly #series = inject(ReadingsFacade).series;
  readonly #language = inject(LanguageService).language;
  readonly #translate = inject(TranslateService);
  readonly #color = chartColors().series[0];

  readonly chartData = computed<ChartData<'line'>>(() => {
    const readings = this.#series();
    return {
      labels: readings.map((reading) =>
        localizedDayMonth(reading.name, this.#language())
      ),
      datasets: [
        {
          label: this.#translate.instant(SERIES_LABEL),
          data: readings.map((reading) => gramsToKg(reading.grams)),
          borderColor: this.#color,
          backgroundColor: this.#color,
          tension: 0.25,
          pointRadius: 3,
          fill: false,
        },
      ],
    };
  });

  readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ({ dataIndex }) =>
            `${formatKg(this.#series()[dataIndex]?.grams ?? 0, this.#language())} kg`,
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: 'kg' },
        beginAtZero: false,
        ticks: { precision: 1 },
      },
      x: { ticks: { autoSkip: true, maxRotation: 0 } },
    },
  };
}
