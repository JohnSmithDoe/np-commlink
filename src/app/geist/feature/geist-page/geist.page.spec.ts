import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import {
  LanguageModelService,
  LanguageModelAvailability,
} from '../../../@shared/util/theme/language-model.service';
import { GEIST_PERSONAS } from '../../model/geist.consts';
import { GeistPage } from './geist.page';

const fakeSession = (
  gauge: { contextUsage?: number; contextWindow?: number } = {}
) => ({
  contextUsage: 0,
  contextWindow: 0,
  destroy: vi.fn(),
  ...gauge,
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const stillDownloading = () => new Promise<never>(() => {});

describe('GeistPage', () => {
  const availability = signal<LanguageModelAvailability>('probing');
  let probe: ReturnType<typeof vi.fn>;
  let createSession: ReturnType<typeof vi.fn>;

  const setup = (
    verdict: Availability = 'unavailable',
    session: object = fakeSession()
  ) => {
    availability.set(verdict);
    probe = vi.fn().mockResolvedValue(verdict);
    createSession = vi.fn().mockResolvedValue(session);
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: LanguageModelService,
          useValue: { availability, probe, createSession },
        },
      ],
    });
    return TestBed.createComponent(GeistPage);
  };

  describe('the link state machine', () => {
    it('lands on unsupported where the platform has no model', async () => {
      const page = setup('unavailable').componentInstance;

      await settle();

      expect(page.link()).toBe('unsupported');
      expect(createSession).not.toHaveBeenCalled();
    });

    it('parks on the cold-start panel while the weights still need downloading', async () => {
      const page = setup('downloadable').componentInstance;

      await settle();

      expect(page.link()).toBe('dormant');
      expect(createSession).not.toHaveBeenCalled();
    });

    it('jacks in without asking when the weights are already local', async () => {
      const page = setup('available').componentInstance;

      await settle();

      expect(page.link()).toBe('jacked-in');
      expect(createSession).toHaveBeenCalledTimes(1);
    });

    it('flatlines when creating the session fails', async () => {
      const page = setup('downloadable').componentInstance;
      await settle();
      createSession.mockRejectedValue(new Error('no wetware'));

      await page.prime();

      expect(page.link()).toBe('flatlined');
    });

    it('re-creates a cached session without showing the download panel', () => {
      const page = setup('available').componentInstance;
      createSession.mockImplementation(stillDownloading);

      void page.prime();

      expect(page.link()).toBe('reforging');
    });

    it('shows the download panel for the first, downloading open', () => {
      const page = setup('downloadable').componentInstance;
      createSession.mockImplementation(stillDownloading);

      void page.prime();

      expect(page.link()).toBe('priming');
    });

    it('restarts the download meter at zero rather than at a stale percentage', async () => {
      const page = setup('downloadable').componentInstance;
      page.primedPercent.set(40);

      await page.prime();

      expect(page.primedPercent()).toBe(0);
    });
  });

  describe('session lifetime', () => {
    it('aborts an in-flight creation when the page is destroyed', () => {
      const fixture = setup('downloadable');
      createSession.mockImplementation(stillDownloading);
      void fixture.componentInstance.prime();
      const { signal: abort } = createSession.mock.calls[0][0];

      expect(abort.aborted).toBe(false);
      fixture.destroy();

      expect(abort.aborted).toBe(true);
    });

    it('destroys a session that resolves after the page is gone', async () => {
      const session = fakeSession();
      const fixture = setup('downloadable');
      let arrive!: (value: object) => void;
      createSession.mockImplementation(
        () => new Promise((resolve) => (arrive = resolve))
      );
      void fixture.componentInstance.prime();

      fixture.destroy();
      arrive(session);
      await settle();

      expect(session.destroy).toHaveBeenCalled();
    });

    it('abandons the first creation when the user switches register mid-download', async () => {
      const fixture = setup('downloadable');
      createSession.mockImplementation(stillDownloading);
      void fixture.componentInstance.prime();
      const { signal: abandoned } = createSession.mock.calls[0][0];
      createSession.mockResolvedValue(fakeSession());

      await fixture.componentInstance.selectPersona(GEIST_PERSONAS[1]);

      expect(abandoned.aborted).toBe(true);
      expect(createSession).toHaveBeenCalledTimes(2);
    });
  });

  describe('canSend', () => {
    it('needs a live link, an idle stream and a non-blank query', () => {
      const page = setup('unavailable').componentInstance;
      page.query.set('  ');
      expect(page.canSend()).toBe(false);

      page.query.set('wer ist Mr. Johnson?');
      expect(page.canSend()).toBe(false);

      page.link.set('jacked-in');
      expect(page.canSend()).toBe(true);
    });

    it('stays false while an answer is still streaming', async () => {
      const page = setup('available').componentInstance;
      await settle();
      page.query.set('noch eine Frage');
      page.turns.set([
        { id: 1, query: 'x', answer: '', streaming: true, note: null },
      ]);

      expect(page.canSend()).toBe(false);
    });
  });

  describe('contextPercent', () => {
    it('is 0 before a session reports a window, rather than NaN', () => {
      const page = setup('unavailable').componentInstance;

      expect(page.contextPercent()).toBe(0);
    });

    it('reports the session gauge as a percentage once one exists', async () => {
      const page = setup(
        'available',
        fakeSession({ contextUsage: 512, contextWindow: 2048 })
      ).componentInstance;

      await settle();

      expect(page.contextPercent()).toBe(25);
    });
  });
});
