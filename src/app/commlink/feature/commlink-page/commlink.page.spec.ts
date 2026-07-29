import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import {
  LanguageModelService,
  TLanguageModelAvailability,
} from '../../../@shared/util/language-model.service';
import { ThemeService } from '../../../@shared/util/theme.service';
import { TTheme } from '../../../@shared/model/app.types';
import { DashboardFacade, DeckFacade } from '../../data';
import { DECK_CATALOG } from '../../model/deck.catalog';
import { resolveLabels } from '../../util/deck.utils';
import { CommlinkPage } from './commlink.page';

// The real catalog, resolved as an unconfigured deck would resolve it — the
// page's own logic is under test, not the facade's projections.
const catalogPrograms = DECK_CATALOG.filter((entry) => entry.onDeck).map(
  resolveLabels('cyberpunk')
);

const programOf = (page: CommlinkPage, id: string) =>
  page.programs().find((program) => program.id === id)!;

describe('CommlinkPage', () => {
  const availability = signal<TLanguageModelAvailability>('probing');
  const theme = signal<TTheme>('cyberpunk');
  const bySource = signal<
    Record<
      string,
      { metrics: Record<string, unknown>; status?: 'online' | 'standby' }
    >
  >({});

  const setup = () => {
    availability.set('probing');
    theme.set('cyberpunk');
    bySource.set({});
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideZonelessChangeDetection(),
        { provide: LanguageModelService, useValue: { availability } },
        { provide: ThemeService, useValue: { theme } },
        {
          provide: DashboardFacade,
          useValue: {
            dashboardState: () => ({ bySource: bySource() }),
            notificationsUnread: () =>
              Number(bySource()['notifications']?.metrics['unread'] ?? 0),
          },
        },
        {
          provide: DeckFacade,
          useValue: {
            programs: () => catalogPrograms,
            allPrograms: () => catalogPrograms,
            slotCount: catalogPrograms.length,
          },
        },
      ],
    });
    return TestBed.createComponent(CommlinkPage).componentInstance;
  };

  describe('status', () => {
    it('reports a source-less program’s declared status', () => {
      // SIGIL, SYSOP and GEIST have no data domain, so the literal is all there
      // is to go on.
      const page = setup();
      expect(page.status(programOf(page, 'barcode'))).toBe('online');
    });

    // The tiles used to hardcode `status: 'online'`, so a cold launch where
    // nothing had reported still read "13/13 PROGRAMS LOADED".
    it('reports standby for a telemetry-backed program whose source is silent', () => {
      const page = setup();
      expect(page.status(programOf(page, 'tracking'))).toBe('standby');
    });

    it('reports what the read-model holds once the source has reported', () => {
      const page = setup();
      bySource.set({ tracking: { metrics: { count: 3 }, status: 'online' } });
      expect(page.status(programOf(page, 'tracking'))).toBe('online');
    });

    it('counts only the programs that are actually online', () => {
      const page = setup();
      expect(page.onlineCount()).toBe(2);

      bySource.set({ tracking: { metrics: {}, status: 'online' } });
      expect(page.onlineCount()).toBe(3);
    });

    // GEIST is the only capability-gated tile: Chrome's on-device model exists
    // on desktop only, so the deck must never advertise it as running on the APK.
    it.each([
      ['available', 'online'],
      ['downloadable', 'standby'],
      ['downloading', 'standby'],
      ['probing', 'standby'],
      ['unavailable', 'offline'],
    ] as const)(
      'maps a %s on-device model to a %s GEIST tile',
      (reported, expected) => {
        const page = setup();
        availability.set(reported);
        expect(page.status(programOf(page, 'geist'))).toBe(expected);
      }
    );
  });

  describe('onlineCount', () => {
    it('follows the capability, which only resolves after first paint', () => {
      const page = setup();
      const whileProbing = page.onlineCount();

      availability.set('available');
      expect(page.onlineCount()).toBe(whileProbing + 1);

      availability.set('unavailable');
      expect(page.onlineCount()).toBe(whileProbing);
    });

    it('never exceeds the declared program total', () => {
      const page = setup();
      availability.set('available');
      expect(page.onlineCount()).toBeLessThanOrEqual(page.total);
      expect(page.total).toBe(page.programs().length);
    });
  });

  describe('badge', () => {
    it('reads the configured metric off the read-model', () => {
      const page = setup();
      bySource.set({ tracking: { metrics: { count: 7 } } });
      expect(page.badge(programOf(page, 'tracking'))).toBe(7);
    });

    it('is null for a tile with no telemetry source', () => {
      const page = setup();
      expect(page.badge(programOf(page, 'barcode'))).toBeNull();
    });

    it('is null while the source has not reported yet', () => {
      const page = setup();
      expect(page.badge(programOf(page, 'tracking'))).toBeNull();
    });

    it('renders a reported zero rather than swallowing it as absent', () => {
      const page = setup();
      bySource.set({ tracking: { metrics: { count: 0 } } });
      expect(page.badge(programOf(page, 'tracking'))).toBe(0);
    });
  });

  describe('the HUD chrome', () => {
    // The deck's own copy is voiced, so it is keyed by theme exactly as the
    // codenames are — OK Boomer must not read "Rauschen" at a plain office desk.
    it('follows the active theme', () => {
      const page = setup();
      expect(page.chrome()['noise']).toBe('deck.cyberpunk.chrome.noise');

      theme.set('boomer');
      expect(page.chrome()['noise']).toBe('deck.boomer.chrome.noise');
    });

    it('names a tile’s status word in that same register', () => {
      const page = setup();
      expect(page.nodeStatusKey('standby')).toBe(
        'deck.cyberpunk.chrome.node-standby'
      );

      theme.set('boomer');
      expect(page.nodeStatusKey('standby')).toBe(
        'deck.boomer.chrome.node-standby'
      );
    });
  });

  describe('the deck clock', () => {
    afterEach(() => vi.restoreAllMocks());

    // Ionic keeps a visited route mounted for the whole session, so a 1 Hz
    // interval left running would mark this subtree dirty from behind whatever
    // page the user navigated to.
    it('runs an interval only while the deck is the visible page', () => {
      const page = setup();
      const start = vi.spyOn(globalThis, 'setInterval');
      const stop = vi.spyOn(globalThis, 'clearInterval');

      page.ionViewWillEnter();
      expect(start).toHaveBeenCalledTimes(1);

      // Ionic re-enters a page it never destroyed; a second interval would then
      // tick alongside the first for the rest of the session.
      page.ionViewWillEnter();
      expect(start).toHaveBeenCalledTimes(1);

      page.ionViewWillLeave();
      expect(stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('badgeLabel', () => {
    it('renders a plain count for a non-currency tile', () => {
      const page = setup();
      expect(page.badgeLabel(programOf(page, 'tracking'), 7)).toBe('7');
    });

    it('renders the themed currency label for the CREDSTICK (cash) tile', () => {
      const page = setup();
      expect(page.badgeLabel(programOf(page, 'cash'), 1234)).toBe(
        '¥ 1234 nyen'
      );

      theme.set('boomer');
      expect(page.badgeLabel(programOf(page, 'cash'), 1234)).toContain('€');
    });
  });

  describe('the status-strip readouts', () => {
    it('default to zero before any source reports', () => {
      const page = setup();
      expect(page.noise()).toBe(0);
      expect(page.nuyenLabel()).toBe('¥ 0 nyen');
      expect(page.resonanceRating()).toBe('0.0');
    });

    it('derive from the notifications, cash and office-time telemetry', () => {
      const page = setup();
      bySource.set({
        notifications: { metrics: { unread: 3 } },
        cash: { metrics: { balance: 42 } },
        'office-time': { metrics: { officedays: 42, percentage: 50 } },
      });

      expect(page.noise()).toBe(3);
      expect(page.nuyenLabel()).toBe('¥ 42 nyen');
      // Half the year's office-day target reads as 3.0 of a 0–6 resonance scale.
      expect(page.resonanceRating()).toBe('3.0');
    });

    it('renders the real EUR balance under the boomer theme', () => {
      const page = setup();
      theme.set('boomer');
      bySource.set({ cash: { metrics: { balance: 1234 } } });

      expect(page.nuyenLabel()).toContain('1.234,00');
      expect(page.nuyenLabel()).toContain('€');
    });
  });
});
