import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import dayjs from 'dayjs';
import { selectSessionsByDayAndName } from '../../data';
import { chartColors } from '../../../@shared/util/chart-colors';

Chart.register(...registerables);

@Component({
  selector: 'app-sessions-chart',
  templateUrl: './sessions-chart.component.html',
  styleUrls: ['./sessions-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
})
export class SessionsChartComponent {
  readonly #raw = inject(Store).selectSignal(selectSessionsByDayAndName);
  readonly #series = chartColors().series;

  readonly hasData = computed(() =>
    this.#raw().series.some((s) => s.hours.some((h) => h > 0))
  );

  readonly chartData = computed<ChartData<'bar'>>(() => {
    const { days, series } = this.#raw();
    return {
      labels: days.map((d) => dayjs(d).format('DD.MM.')),
      datasets: series.map((s, i) => ({
        label: s.name,
        data: s.hours,
        backgroundColor: this.#series[i % this.#series.length],
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
          label: (ctx) =>
            `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(2)}h`,
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
