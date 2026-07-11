import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { officeTimeActions } from '../../data/office-time/office-time.actions';
import {
  dayjsFromString,
  dayjsToString,
} from '../../data/office-time/office-time.utils';
import { DashOfficeDaysEditComponent } from './dash-office-days-edit.component';

describe('DashOfficeDaysEditComponent', () => {
  let store: MockStore;
  let component: DashOfficeDaysEditComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashOfficeDaysEditComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    component = TestBed.createComponent(
      DashOfficeDaysEditComponent
    ).componentInstance;
  });

  it('parses selected calendar dates and dispatches setOfficedays', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateOfficeDates({
      detail: { value: ['2026-07-01', '2026-07-02', null] },
    } as never);

    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof officeTimeActions.setOfficedays
    >;
    expect(action.type).toBe(officeTimeActions.setOfficedays.type);
    expect(action.officedays.map(dayjsToString)).toEqual([
      '2026-07-01',
      '2026-07-02',
    ]);
  });

  it('accepts a single (non-array) datetime value', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateOfficeDates({ detail: { value: '2026-07-01' } } as never);

    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof officeTimeActions.setOfficedays
    >;
    expect(action.officedays.map(dayjsToString)).toEqual(['2026-07-01']);
  });

  it('exposes the selected office days as date strings', () => {
    const fixture = TestBed.createComponent(DashOfficeDaysEditComponent);
    fixture.componentRef.setInput('officedays', [
      dayjsFromString('2026-07-01'),
      dayjsFromString('2026-07-02'),
    ]);
    expect(fixture.componentInstance.officedates()).toEqual([
      '2026-07-01',
      '2026-07-02',
    ]);
  });
});
