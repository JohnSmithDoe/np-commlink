import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import {
  Action,
  createActionGroup,
  createFeatureSelector,
  emptyProps,
} from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { APP_VERSION } from '../../model/app.consts';
import { DatabaseService } from '../../util/db/database.service';
import { PersistedReadRegistry } from '../../util/db/persisted-read-registry';
import { MigrationStep, wrapVersioned } from '../../util/db/versioned';
import { DashboardActions } from '../actions/dashboard.actions';
import { NotificationsActions } from '../actions/notifications.actions';
import {
  createLoadSliceEffect,
  createMetric,
  createSaveSliceEffect,
  createTelemetrySliceEffect,
} from './persisted-slice.effects.factory';

type TProbeState = { items: string[] };

const ProbeActions = createActionGroup({
  source: 'Probe',
  events: {
    load: emptyProps(),
    loaded: (probe: TProbeState | null) => ({ probe }),
    addItem: (name: string) => ({ name }),
    Tick: emptyProps(),
  },
});

const OtherActions = createActionGroup({
  source: 'Other',
  events: { 'Do Thing': emptyProps() },
});

const selectProbe = createFeatureSelector<TProbeState>('probe');

const probeState: TProbeState = { items: ['a'] };

// The save effect is muted until the key has been read back once, so a spec
// driving it standalone has to stand in for the load effect that normally ran
// first.
const markProbeRead = () =>
  TestBed.inject(PersistedReadRegistry).recordRead('probe');

describe('persisted-slice effects', () => {
  let actions$: Observable<Action>;
  let database: {
    load: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  const DEFAULT_STATE = { probe: probeState };

  const setup = (initialState: object = DEFAULT_STATE) => {
    database = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: DatabaseService, useValue: database },
      ],
    });
  };

  const run = <T>(effect: () => Observable<T>): Observable<T> =>
    TestBed.runInInjectionContext(() => effect());

  describe('loadSliceEffect', () => {
    it('reads the slice key and emits loaded with the stored value', async () => {
      setup();
      database.load.mockResolvedValue(probeState);
      actions$ = of(ProbeActions.load());

      const emitted = await firstValueFrom(
        run(createLoadSliceEffect(ProbeActions, 'probe'))
      );

      expect(emitted).toEqual(ProbeActions.loaded(probeState));
      expect(database.load).toHaveBeenCalledWith('probe');
    });

    it('emits loaded(null) then a toast when the read fails, so the resolver unblocks and the user is told', async () => {
      setup();
      database.load.mockRejectedValue(new Error('storage unavailable'));
      actions$ = of(ProbeActions.load());

      const emitted = await firstValueFrom(
        run(createLoadSliceEffect(ProbeActions, 'probe')).pipe(toArray())
      );

      expect(emitted).toEqual([
        ProbeActions.loaded(null),
        NotificationsActions.toast({
          key: 'toast.storage.unavailable',
          color: 'danger',
        }),
      ]);
    });

    it('unwraps the versioned envelope through the ladder', async () => {
      // Step *application* is versioned.spec's job (it can pass an explicit
      // target version); at APP_VERSION 1 no hop exists, so what is observable
      // here is the envelope unwrap and that the ladder is threaded at all.
      setup();
      database.load.mockResolvedValue(wrapVersioned(APP_VERSION, probeState));
      const untouched: MigrationStep[] = [
        () => {
          throw new Error('no hop should run at the current version');
        },
      ];

      expect(
        await firstValueFrom(
          run(createLoadSliceEffect(ProbeActions, 'probe', untouched))
        )
      ).toEqual(ProbeActions.loaded(probeState));
    });

    it('never writes while loading', async () => {
      setup();
      database.load.mockResolvedValue(probeState);
      actions$ = of(ProbeActions.load());

      await firstValueFrom(run(createLoadSliceEffect(ProbeActions, 'probe')));

      expect(database.save).not.toHaveBeenCalled();
    });

    it('ignores actions other than its own load', async () => {
      setup();
      actions$ = of(OtherActions.doThing(), ProbeActions.addItem('x'));

      const emitted = await firstValueFrom(
        run(createLoadSliceEffect(ProbeActions, 'probe')).pipe(toArray())
      );

      expect(emitted).toEqual([]);
      expect(database.load).not.toHaveBeenCalled();
    });
  });

  describe('saveSliceEffect', () => {
    it('persists the versioned envelope on a source-prefix mutation', async () => {
      setup();
      markProbeRead();
      actions$ = of(ProbeActions.addItem('b'));

      await firstValueFrom(
        run(
          createSaveSliceEffect({ sources: ['[Probe]'] }, selectProbe, 'probe')
        )
      );

      expect(database.save).toHaveBeenCalledWith(
        'probe',
        wrapVersioned(APP_VERSION, probeState)
      );
    });

    it('does NOT persist on the load/loaded hydration lifecycle', async () => {
      // The recurring lazy-cutover invariant: hydration dispatches `[X] load`
      // while the slice is still at empty initialState, so persisting on it
      // would clobber the saved doc.
      setup();
      actions$ = of(ProbeActions.load(), ProbeActions.loaded(probeState));

      const emitted = await firstValueFrom(
        run(
          createSaveSliceEffect({ sources: ['[Probe]'] }, selectProbe, 'probe')
        ).pipe(toArray())
      );

      expect(emitted).toEqual([]);
      expect(database.save).not.toHaveBeenCalled();
    });

    it('ignores another context‘s mutations', async () => {
      setup();
      actions$ = of(OtherActions.doThing());

      const emitted = await firstValueFrom(
        run(
          createSaveSliceEffect({ sources: ['[Probe]'] }, selectProbe, 'probe')
        ).pipe(toArray())
      );

      expect(emitted).toEqual([]);
      expect(database.save).not.toHaveBeenCalled();
    });

    it('persists only the listed actions when given an explicit trigger list', async () => {
      // The high-frequency-action case (tracking's per-second tick): an explicit
      // `on` list opts out of the source-prefix sweep entirely.
      setup();
      markProbeRead();
      actions$ = of(ProbeActions.tick(), ProbeActions.addItem('b'));

      const emitted = await firstValueFrom(
        run(
          createSaveSliceEffect(
            { on: [ProbeActions.addItem] },
            selectProbe,
            'probe'
          )
        ).pipe(toArray())
      );

      expect(emitted.length).toBe(1);
      expect(database.save).toHaveBeenCalledTimes(1);
    });

    it('persists on a foreign action listed in `on` alongside its own source', async () => {
      // The cascade case (recipes persisting on `[Products] removeItem`).
      setup();
      markProbeRead();
      actions$ = of(OtherActions.doThing());

      await firstValueFrom(
        run(
          createSaveSliceEffect(
            { sources: ['[Probe]'], on: [OtherActions.doThing] },
            selectProbe,
            'probe'
          )
        )
      );

      expect(database.save).toHaveBeenCalledWith(
        'probe',
        wrapVersioned(APP_VERSION, probeState)
      );
    });

    it('does NOT persist before the key has been read back', async () => {
      // The data-loss case the registry exists for: a mutation that lands
      // before the read resolves would write initialState over the bytes on
      // disk. Applies to the eager boot window and to a read that rejected.
      setup();
      actions$ = of(ProbeActions.addItem('b'));

      const emitted = await firstValueFrom(
        run(
          createSaveSliceEffect({ sources: ['[Probe]'] }, selectProbe, 'probe')
        ).pipe(toArray())
      );

      expect(emitted).toEqual([]);
      expect(database.save).not.toHaveBeenCalled();
    });

    it('stays muted for the session when the read rejected', async () => {
      setup();
      database.load.mockRejectedValue(new Error('storage unavailable'));
      actions$ = of(ProbeActions.load());
      await firstValueFrom(
        run(createLoadSliceEffect(ProbeActions, 'probe')).pipe(toArray())
      );

      actions$ = of(ProbeActions.addItem('b'));
      await firstValueFrom(
        run(
          createSaveSliceEffect({ sources: ['[Probe]'] }, selectProbe, 'probe')
        ).pipe(toArray())
      );

      expect(database.save).not.toHaveBeenCalled();
    });

    it('persists once a successful read has opened the gate', async () => {
      // An absent key is a successful read — a fresh install must be able to
      // write its first mutation.
      setup();
      database.load.mockResolvedValue(null);
      actions$ = of(ProbeActions.load());
      await firstValueFrom(run(createLoadSliceEffect(ProbeActions, 'probe')));

      actions$ = of(ProbeActions.addItem('b'));
      await firstValueFrom(
        run(
          createSaveSliceEffect({ sources: ['[Probe]'] }, selectProbe, 'probe')
        )
      );

      expect(database.save).toHaveBeenCalledWith(
        'probe',
        wrapVersioned(APP_VERSION, probeState)
      );
    });
  });

  describe('telemetrySliceEffect', () => {
    it('reports the projected metrics under the context source', async () => {
      setup();
      actions$ = of();

      const emitted = await firstValueFrom(
        run(
          createTelemetrySliceEffect({
            source: 'probe',
            select: selectProbe,
            metrics: (state) => createMetric('count')(state?.items.length ?? 0),
          })
        )
      );

      expect(emitted).toEqual(
        DashboardActions.report({ source: 'probe', metrics: { count: 1 } })
      );
    });

    it('reports on subscription, so a lazy context flips its tile on route entry', async () => {
      setup({ probe: { items: [] } });
      actions$ = of();

      // No action dispatched at all — the store.select emission is the trigger.
      const emitted = await firstValueFrom(
        run(
          createTelemetrySliceEffect({
            source: 'probe',
            select: selectProbe,
            metrics: (state) => createMetric('count')(state?.items.length ?? 0),
          })
        )
      );

      expect(emitted).toEqual(
        DashboardActions.report({ source: 'probe', metrics: { count: 0 } })
      );
    });

    it('re-reports when the slice changes, so a tile tracks live state', () => {
      setup();
      actions$ = of();
      const store = TestBed.inject(MockStore);
      const reported: number[] = [];

      const sub = run(
        createTelemetrySliceEffect({
          source: 'probe',
          select: selectProbe,
          metrics: (state) => createMetric('count')(state?.items.length ?? 0),
        })
      ).subscribe((action) =>
        reported.push(
          (action as ReturnType<typeof DashboardActions.report>).telemetry
            .metrics['count'] as number
        )
      );

      store.setState({ probe: { items: ['a', 'b', 'c'] } });
      store.refreshState();

      expect(reported).toEqual([1, 3]);
      sub.unsubscribe();
    });
  });

  describe('metric', () => {
    it('projects one scalar under its key', () => {
      expect(createMetric('balance')(42)).toEqual({ balance: 42 });
    });
  });
});
