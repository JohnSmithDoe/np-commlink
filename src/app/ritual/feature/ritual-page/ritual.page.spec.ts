import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import dayjs from 'dayjs';
import { getByTestId, queryByTestId } from '../../../@shared/testing/dom';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { RitualState } from '../../model/ritual.types';
import {
  mockRitualCompletion,
  mockRitualState,
} from '../../testing/ritual.test-data';
import { RitualPage } from './ritual.page';

const doneToday = (promptId = 'water') =>
  mockRitualState({
    completions: [
      mockRitualCompletion({ promptId, completedAt: dayjs().format() }),
    ],
  });

describe('RitualPage', () => {
  let fixture: ComponentFixture<RitualPage>;
  let page: RitualPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (state: RitualState = mockRitualState()) => {
    TestBed.configureTestingModule({
      imports: [RitualPage],
      providers: [provideTestingProviders({ ritual: state })],
    });
    fixture = TestBed.createComponent(RitualPage);
    page = fixture.componentInstance;
    dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
    fixture.detectChanges();
  };

  it('offers a card while the day is open', () => {
    setup();

    expect(queryByTestId(fixture, 'ritual-card')).not.toBeNull();
    expect(queryByTestId(fixture, 'ritual-done')).toBeNull();
    expect(page.prompt()).toBeDefined();
  });

  it('keeps the card inert — the button commits the day, not the text', () => {
    setup();

    expect(getByTestId(fixture, 'ritual-card').tagName).toBe('SECTION');
    expect(queryByTestId(fixture, 'ritual-complete')).not.toBeNull();
  });

  it('shows what was finished, not only that something was', () => {
    setup(doneToday('stretch'));

    expect(queryByTestId(fixture, 'ritual-card')).toBeNull();
    expect(getByTestId(fixture, 'ritual-done-task').textContent).toContain(
      'ritual.prompt.stretch'
    );
    expect(getByTestId(fixture, 'ritual-count').textContent).toContain('1');
  });

  it('closes the day only once the card has finished leaving', () => {
    setup();
    const drawn = page.prompt().id;

    page.complete();
    expect(dispatch).not.toHaveBeenCalled();

    page.cardGone();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ promptId: drawn })
    );
  });

  it('closes the day even when no animation ever ends', () => {
    vi.useFakeTimers();
    try {
      setup();

      page.complete();
      expect(dispatch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5000);

      expect(dispatch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes the day once when the animation and the timer both land', () => {
    vi.useFakeTimers();
    try {
      setup();

      page.complete();
      page.cardGone();
      vi.advanceTimersByTime(5000);

      expect(dispatch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes the day once, however many animations end', () => {
    setup();

    page.complete();
    page.cardGone();
    page.cardGone();

    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('ignores an animation that was not the card leaving', () => {
    setup();

    page.cardGone();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('rerolls without closing the day', () => {
    setup();
    const first = page.prompt().id;

    page.reroll();

    expect(page.prompt().id).not.toBe(first);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dismisses the drawn task and deals another', () => {
    setup();
    const shown = page.prompt().id;

    page.dismiss();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ promptId: shown })
    );
    expect(page.prompt().id).not.toBe(shown);
  });

  it('hands out a bonus card without reopening the day', () => {
    setup(doneToday());
    expect(page.showCard()).toBe(false);

    page.takeBonus();
    fixture.detectChanges();

    expect(page.showCard()).toBe(true);
    expect(queryByTestId(fixture, 'ritual-card')).not.toBeNull();
  });

  it('shows a week of dots, and says in words how many are filled', () => {
    setup(doneToday());

    const dots = getByTestId(fixture, 'ritual-dots');

    expect(dots.querySelectorAll('.ritual-dots__dot').length).toBe(7);
    expect(dots.querySelectorAll('.ritual-dots__dot--on').length).toBe(1);
    expect(dots.getAttribute('aria-label')).toContain(
      'ritual.done.recent-days'
    );
  });

  it('keeps the reminder off the card page — settings are one tap away', () => {
    setup();

    expect(queryByTestId(fixture, 'ritual-settings-link')).not.toBeNull();
    expect(queryByTestId(fixture, 'ritual-reminder-toggle')).toBeNull();
  });
});
