import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TrackingFacade } from '../../data';
import { DailySeries } from '../../model/tracking.types';
import { SessionsChartComponent } from './sessions-chart.component';

const create = (series: DailySeries): SessionsChartComponent => {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideMockStore(),
      provideTranslateService(),
      {
        provide: TrackingFacade,
        useValue: { sessionsByDayAndName: signal(series) },
      },
    ],
  });
  return TestBed.createComponent(SessionsChartComponent).componentInstance;
};

describe('SessionsChartComponent', () => {
  it('reports no data when every series is all-zero', () => {
    const component = create({
      days: ['2026-07-01'],
      series: [{ name: 'A', hours: [0] }],
    });
    expect(component.hasData()).toBe(false);
  });

  it('builds labelled, stacked datasets from the series', () => {
    const component = create({
      days: ['2026-07-01', '2026-07-02'],
      series: [{ name: 'A', hours: [0, 2] }],
    });

    expect(component.hasData()).toBe(true);
    const data = component.chartData();
    expect(data.labels).toEqual(['01.07.', '02.07.']);
    expect(data.datasets[0].label).toBe('A');
    expect(data.datasets[0].data).toEqual([0, 2]);
    expect(data.datasets[0].stack).toBe('sessions');
  });

  it('names the nameless remainder bucket from the bundle', () => {
    const component = create({
      days: ['2026-07-01'],
      series: [{ name: 'A', hours: [1] }, { hours: [2] }],
    });

    const data = component.chartData();
    expect(data.datasets[0].label).toBe('A');
    expect(data.datasets[1].label).toBe('tracking.chart.other');
  });
});
