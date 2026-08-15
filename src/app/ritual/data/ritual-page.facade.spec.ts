import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TodayService } from '../../@shared/data/services/today.service';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import {
  mockRitualCompletion,
  mockRitualState,
} from '../testing/ritual.test-data';
import { RitualPageFacade } from './ritual-page.facade';

describe('RitualPageFacade', () => {
  let facade: RitualPageFacade;
  let today: ReturnType<typeof signal<string>>;

  const setup = (day = '2026-07-20', completions: string[] = []) => {
    today = signal(day);
    TestBed.configureTestingModule({
      providers: [
        ...provideTestingProviders({
          ritual: mockRitualState({
            completions: completions.map((completedAt) =>
              mockRitualCompletion({ completedAt })
            ),
          }),
        }),
        { provide: TodayService, useValue: { today } },
      ],
    });
    facade = TestBed.inject(RitualPageFacade);
  };

  it('draws a task while the day is open', () => {
    setup();

    expect(facade.prompt()).toBeDefined();
    expect(facade.dayClosed()).toBe(false);
  });

  it('closes the day on a completion made today', () => {
    setup('2026-07-20', ['2026-07-20T08:00:00.000']);

    expect(facade.dayClosed()).toBe(true);
  });

  it('opens the new day on a different task than the last one closed on', () => {
    setup('2026-07-20', ['2026-07-20T08:00:00.000']);
    const yesterdays = facade.prompt().id;

    today.set('2026-07-21');

    expect(facade.dayClosed()).toBe(false);
    expect(facade.prompt().id).not.toBe(yesterdays);
  });

  it('keeps a reroll until the day itself moves on', () => {
    setup();
    facade.draw();
    const rerolled = facade.prompt().id;

    expect(facade.prompt().id).toBe(rerolled);

    today.set('2026-07-21');

    expect(facade.prompt().id).not.toBe(rerolled);
  });
});
