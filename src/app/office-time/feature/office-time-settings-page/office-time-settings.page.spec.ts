import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { queryByTestId } from '../../../@shared/testing/dom';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { OfficeTimeActions } from '../../data';
import { OfficeReminder } from '../../model/office-time.types';
import { mockOfficeTimeState } from '../../testing/office-time.test-data';
import { OfficeTimeSettingsPage } from './office-time-settings.page';

describe('OfficeTimeSettingsPage', () => {
  let fixture: ComponentFixture<OfficeTimeSettingsPage>;
  let page: OfficeTimeSettingsPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (reminder: OfficeReminder) => {
    TestBed.configureTestingModule({
      imports: [OfficeTimeSettingsPage],
      providers: [
        ...provideTestingProviders({
          officeTime: mockOfficeTimeState({ reminder }),
        }),
      ],
    });
    fixture = TestBed.createComponent(OfficeTimeSettingsPage);
    page = fixture.componentInstance;
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    fixture.detectChanges();
  };

  it('asks for a time only once the reminder is switched on', () => {
    setup({ enabled: false, hour: 9, minute: 0 });

    expect(queryByTestId(fixture, 'office-reminder-toggle')).not.toBeNull();
    expect(queryByTestId(fixture, 'office-reminder-time')).toBeNull();
  });

  it('offers the time once the reminder is on', () => {
    setup({ enabled: true, hour: 9, minute: 0 });

    expect(queryByTestId(fixture, 'office-reminder-time')).not.toBeNull();
  });

  it('switches the reminder off without losing the time', () => {
    setup({ enabled: true, hour: 8, minute: 30 });

    page.toggleReminder(false);

    expect(dispatch).toHaveBeenCalledWith(
      OfficeTimeActions.setReminder({ enabled: false, hour: 8, minute: 30 })
    );
  });

  it('reads the reminder time back as a clock face', () => {
    setup({ enabled: true, hour: 7, minute: 5 });

    expect(page.reminderTime()).toBe('07:05');
  });

  it('takes a new reminder time, and ignores one it cannot read', () => {
    setup({ enabled: true, hour: 9, minute: 0 });

    page.setReminderTime('08:45');
    expect(dispatch).toHaveBeenCalledWith(
      OfficeTimeActions.setReminder({ enabled: true, hour: 8, minute: 45 })
    );

    dispatch.mockClear();
    page.setReminderTime('');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('survives a cleared time field, which reaches it as null', () => {
    setup({ enabled: true, hour: 9, minute: 0 });

    expect(() => page.setReminderTime(null)).not.toThrow();
    expect(() => page.setReminderTime(undefined)).not.toThrow();
    expect(() => page.setReminderTime(845)).not.toThrow();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
