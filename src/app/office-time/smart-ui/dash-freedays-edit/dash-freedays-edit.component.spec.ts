import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { OfficeTimeActions } from '../../data/office-time/office-time.actions';
import { DashFreedaysEditComponent } from './dash-freedays-edit.component';

describe('DashFreedaysEditComponent', () => {
  let store: MockStore;
  let component: DashFreedaysEditComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashFreedaysEditComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection(), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
    component = TestBed.createComponent(
      DashFreedaysEditComponent
    ).componentInstance;
  });

  it('dispatches the selected calendar dates as freedays', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateFreeDatesFromCalender({
      detail: { value: ['2026-07-01', '2026-07-02'] },
    } as never);

    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof OfficeTimeActions.setFreedays
    >;
    expect(action.type).toBe(OfficeTimeActions.setFreedays.type);
    expect(action.freedays).toEqual(['2026-07-01', '2026-07-02']);
  });

  it('wraps a single value into an array', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateFreeDatesFromCalender({
      detail: { value: '2026-07-01' },
    } as never);

    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof OfficeTimeActions.setFreedays
    >;
    expect(action.freedays).toEqual(['2026-07-01']);
  });
});
