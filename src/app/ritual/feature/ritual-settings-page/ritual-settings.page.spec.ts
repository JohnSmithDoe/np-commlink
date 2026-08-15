import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { getByTestId, queryByTestId } from '../../../@shared/testing/dom';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { RitualReminder } from '../../model/ritual.types';
import { mockRitualState } from '../../testing/ritual.test-data';
import { RitualActions } from '../../data';
import { RitualSettingsPage } from './ritual-settings.page';

describe('RitualSettingsPage', () => {
  let fixture: ComponentFixture<RitualSettingsPage>;
  let page: RitualSettingsPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (reminder: RitualReminder, dismissed: string[] = []) => {
    TestBed.configureTestingModule({
      imports: [RitualSettingsPage],
      providers: [
        ...provideTestingProviders({
          ritual: mockRitualState({ reminder, dismissed }),
        }),
      ],
    });
    fixture = TestBed.createComponent(RitualSettingsPage);
    page = fixture.componentInstance;
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    fixture.detectChanges();
  };

  it('asks for a time only once the reminder is switched on', () => {
    setup({ enabled: false, hour: 18, minute: 0 });

    expect(queryByTestId(fixture, 'ritual-reminder-toggle')).not.toBeNull();
    expect(queryByTestId(fixture, 'ritual-reminder-time')).toBeNull();
  });

  it('offers the time once the reminder is on', () => {
    setup({ enabled: true, hour: 18, minute: 0 });

    expect(queryByTestId(fixture, 'ritual-reminder-time')).not.toBeNull();
  });

  it('switches the reminder on without losing the time', () => {
    setup({ enabled: false, hour: 7, minute: 30 });

    page.toggleReminder(true);

    expect(dispatch).toHaveBeenCalledWith(
      RitualActions.setReminder({ enabled: true, hour: 7, minute: 30 })
    );
  });

  it('reads the reminder time back as a clock face', () => {
    setup({ enabled: true, hour: 7, minute: 5 });

    expect(page.reminderTime()).toBe('07:05');
  });

  it('takes a new reminder time, and ignores one it cannot read', () => {
    setup({ enabled: true, hour: 7, minute: 30 });

    page.setReminderTime('21:15');
    expect(dispatch).toHaveBeenCalledWith(
      RitualActions.setReminder({ enabled: true, hour: 21, minute: 15 })
    );

    dispatch.mockClear();
    page.setReminderTime('');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('survives a cleared time field, which reaches it as null', () => {
    setup({ enabled: true, hour: 7, minute: 30 });

    expect(() => page.setReminderTime(null)).not.toThrow();
    expect(() => page.setReminderTime(undefined)).not.toThrow();
    expect(() => page.setReminderTime(2115)).not.toThrow();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('offers to bring dismissed tasks back, with how many there are', () => {
    setup({ enabled: false, hour: 18, minute: 0 }, ['water', 'stretch']);

    const restore = getByTestId(fixture, 'ritual-restore-dismissed');

    expect(restore['disabled']).toBe(false);
    expect(restore.closest('ion-item')?.textContent).toContain(
      'ritual.dismissed.count'
    );
    expect(page.dismissedCount()).toBe(2);
  });

  it('has nothing to offer when nothing was dismissed', () => {
    setup({ enabled: false, hour: 18, minute: 0 });

    expect(getByTestId(fixture, 'ritual-restore-dismissed')['disabled']).toBe(
      true
    );
  });

  it('brings every dismissed task back at once', () => {
    setup({ enabled: false, hour: 18, minute: 0 }, ['water']);

    page.restoreAll();

    expect(dispatch).toHaveBeenCalledWith(RitualActions.restoredAll());
  });
});
