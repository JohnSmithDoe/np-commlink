import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TrackingFacade } from '../../data';
import { DailySeries } from '../../model/tracking.types';
import { SessionsChartComponent } from './sessions-chart.component';

// What this component does is turn a `DailySeries` into Chart.js datasets, so the
// series is handed to it directly — through the one facade signal it reads. It
// used to arrive via `overrideSelector`, which stopped being the seam when the
// series became a `computed` over the archive, the live rows AND the current day;
// reaching it through the store would now mean seeding sessions that happen to
// aggregate into the fixture, which says nothing about the mapping under test.
// (The rendered <canvas> stays in the Playwright suite either way.)

const create = (series: DailySeries): SessionsChartComponent => {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideMockStore(),
      // The axis labels go through LanguageService, which reads the bundle.
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

  // The remainder bucket arrives without a name — naming it is this component's
  // job, because the selector that pools it has no injector and so could only
  // ever hardcode one language. No bundle is loaded here, so `instant` echoes the
  // key, which is exactly the identity being asserted.
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
