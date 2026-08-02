import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import dayjs from 'dayjs';
import { mockKernelState } from '../../../@shared/testing/test-data';
import { mockOfficeTimeState } from '../../testing/office-time.test-data';
import { OfficeTimeActions } from '../../data';
import { DashButtonComponent } from './dash-button.component';

const officeTimeWith = (officedays: dayjs.Dayjs[]) =>
  mockKernelState({ officeTime: mockOfficeTimeState({ officedays }) });

describe('DashButtonComponent', () => {
  let store: MockStore;

  const create = (todayIsOfficeDay: boolean): DashButtonComponent => {
    store.setState(officeTimeWith(todayIsOfficeDay ? [dayjs()] : []));
    return TestBed.createComponent(DashButtonComponent).componentInstance;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashButtonComponent],
      providers: [
        provideTranslateService(),
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: officeTimeWith([]) }),
      ],
    });
    store = TestBed.inject(MockStore);
  });

  it('exposes whether today is already an office day', () => {
    expect(create(true).todayIsOfficeDay()).toBe(true);
    expect(create(false).todayIsOfficeDay()).toBe(false);
  });

  it('dispatches an addOfficeTime action for today when clicked', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const component = create(false);

    component.addOfficeDay();

    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0] as unknown as ReturnType<
      typeof OfficeTimeActions.addOfficeTime
    >;
    expect(action.type).toBe(OfficeTimeActions.addOfficeTime.type);
    expect(dayjs.isDayjs(action.today)).toBe(true);
  });
});
