import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { OfficeTimeActions } from '../../data';
import { DashOfficeDaysEditComponent } from './dash-office-days-edit.component';

describe('DashOfficeDaysEditComponent', () => {
  let store: MockStore;
  let component: DashOfficeDaysEditComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashOfficeDaysEditComponent],
      providers: [
        provideTranslateService(),
        provideZonelessChangeDetection(),
        provideMockStore(),
      ],
    });
    store = TestBed.inject(MockStore);
    component = TestBed.createComponent(
      DashOfficeDaysEditComponent
    ).componentInstance;
  });

  it('strips the empty slots the calendar emits and dispatches setOfficedays', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateOfficeDates({
      detail: { value: ['2026-07-01', '2026-07-02', null] },
    } as never);

    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof OfficeTimeActions.setOfficedays
    >;
    expect(action.type).toBe(OfficeTimeActions.setOfficedays.type);
    expect(action.officedays).toEqual(['2026-07-01', '2026-07-02']);
  });

  it('accepts a single (non-array) datetime value', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    component.updateOfficeDates({ detail: { value: '2026-07-01' } } as never);

    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof OfficeTimeActions.setOfficedays
    >;
    expect(action.officedays).toEqual(['2026-07-01']);
  });
});
