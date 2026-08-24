import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageModelService } from '../../../@shared/data/theme/language-model.service';
import {
  LanguageModelAvailability,
  Skin,
} from '../../../@shared/model/app.types';
import { DashboardFacade, DeckFacade, ThemeService } from '../../data';
import { DECK_CATALOG } from '../../model/deck.catalog';
import { resolveLabels } from '../../util/deck.utils';
import { CommlinkPage } from './commlink.page';

const catalogPrograms = DECK_CATALOG.filter((entry) => entry.onDeck).map(
  resolveLabels('cyberpunk')
);

describe('CommlinkPage', () => {
  const availability = signal<LanguageModelAvailability>('probing');
  const skin = signal<Skin>('cyberpunk');
  const bySource = signal<
    Record<
      string,
      { metrics: Record<string, unknown>; status?: 'online' | 'standby' }
    >
  >({});

  const setup = () => {
    availability.set('probing');
    skin.set('cyberpunk');
    bySource.set({});
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideZonelessChangeDetection(),
        { provide: LanguageModelService, useValue: { availability } },
        { provide: ThemeService, useValue: { skin } },
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

  describe('onlineCount', () => {
    it('counts only the programs that are actually online', () => {
      const page = setup();
      const withoutTelemetry = page.onlineCount();

      bySource.set({ tracking: { metrics: {}, status: 'online' } });
      expect(page.onlineCount()).toBe(withoutTelemetry + 1);
    });

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

  describe('the tiles it renders', () => {
    it('carries each program’s status, badge text and status word', () => {
      const page = setup();
      bySource.set({ tracking: { metrics: { count: 7 }, status: 'online' } });

      const tile = page
        .tiles()
        .find(({ program }) => program.id === 'tracking');

      expect(tile?.status).toBe('online');
      expect(tile?.badgeText).toBe('7');
      expect(tile?.statusKey).toBe('deck.cyberpunk.chrome.node-online');
      expect(tile?.dark).toBe(false);
    });

    it('leaves the badge unset for a tile whose source reports nothing', () => {
      const page = setup();

      expect(
        page.tiles().find(({ program }) => program.id === 'notes')?.badgeText
      ).toBeNull();
    });
  });

  describe('the HUD chrome', () => {
    it('follows the active skin', () => {
      const page = setup();
      expect(page.chrome()['noise']).toBe('deck.cyberpunk.chrome.noise');

      skin.set('boomer');
      expect(page.chrome()['noise']).toBe('deck.boomer.chrome.noise');
    });
  });

  it('renders the CREDSTICK badge in the active skin’s currency', () => {
    const page = setup();
    bySource.set({ cash: { metrics: { balance: 1234 } } });
    const cashTile = () =>
      page.tiles().find(({ program }) => program.id === 'cash')?.badgeText;

    expect(cashTile()).toBe('¥ 1234 nyen');

    skin.set('boomer');
    expect(cashTile()).toContain('€');
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
      expect(page.resonanceRating()).toBe('3.0');
    });

    it('renders the real EUR balance under the boomer skin', () => {
      const page = setup();
      skin.set('boomer');
      bySource.set({ cash: { metrics: { balance: 1234 } } });

      expect(page.nuyenLabel()).toContain('1.234,00');
      expect(page.nuyenLabel()).toContain('€');
    });
  });
});
