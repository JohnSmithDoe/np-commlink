import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DailySeries,
  selectSessionsByDayAndName,
} from '../../data/tracking.selector';
import { SessionsChartComponent } from './sessions-chart.component';

// Store-connected component: MockStore feeds the aggregated series selector and
// we assert on the derived `hasData`/`chartData` signals (not the rendered
// <canvas>, which lives in the Playwright suite).

describe('SessionsChartComponent', () => {
  let store: MockStore;

  const create = (series: DailySeries): SessionsChartComponent => {
    store.overrideSelector(selectSessionsByDayAndName, series);
    return TestBed.createComponent(SessionsChartComponent).componentInstance;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
  });

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
});
