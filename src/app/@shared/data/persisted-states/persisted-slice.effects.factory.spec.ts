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
import { DatabaseService } from '../../util/persistence/database.service';
import { PersistedReadRegistry } from '../../util/persistence/persisted-read-registry';
import { MigrationStep, wrapVersioned } from '../../util/persistence/versioned';
import { DashboardActions } from '../actions/dashboard.actions';
import { NotificationsActions } from '../actions/notifications.actions';
import {
  createLoadSliceEffect,
  createMetric,
  createSaveSliceEffect,
  createTelemetrySliceEffect,
} from './persisted-slice.effects.factory';

type ProbeState = { items: string[] };

const ProbeActions = createActionGroup({
  source: 'Probe',
  events: {
    load: emptyProps(),
    loaded: (probe: ProbeState | null) => ({ probe }),
    addItem: (name: string) => ({ name }),
    Tick: emptyProps(),
  },
});

const OtherActions = createActionGroup({
  source: 'Other',
  events: { 'Do Thing': emptyProps() },
});

const selectProbe = createFeatureSelector<ProbeState>('probe');

const probeState: ProbeState = { items: ['a'] };

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

  const probeTelemetry = () =>
    run(
      createTelemetrySliceEffect(
        {
          source: 'probe',
          select: selectProbe,
          metrics: (state) => createMetric('count')(state?.items.length ?? 0),
        },
        ProbeActions,
        'probe'
      )
    );

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

    it('does NOT persist twice when the mutation left the slice unchanged', async () => {
      setup();
      markProbeRead();
      actions$ = of(ProbeActions.addItem('b'), ProbeActions.addItem('b'));

      const emitted = await firstValueFrom(
        run(
          createSaveSliceEffect({ sources: ['[Probe]'] }, selectProbe, 'probe')
        ).pipe(toArray())
      );

      expect(emitted.length).toBe(1);
      expect(database.save).toHaveBeenCalledTimes(1);
    });

    it('does NOT persist before the key has been read back', async () => {
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
      markProbeRead();
      actions$ = of(ProbeActions.loaded(probeState));

      const emitted = await firstValueFrom(probeTelemetry());

      expect(emitted).toEqual(
        DashboardActions.report({ source: 'probe', metrics: { count: 1 } })
      );
    });

    it('stays silent until its own slice has hydrated', async () => {
      setup({ probe: { items: [] } });
      markProbeRead();
      actions$ = of(ProbeActions.load(), ProbeActions.addItem('x'));

      const emitted = await firstValueFrom(probeTelemetry().pipe(toArray()));

      expect(emitted).toEqual([]);
    });

    it('never reports when the slice read rejected, so the tile keeps its persisted summary', async () => {
      setup({ probe: { items: [] } });
      actions$ = of(ProbeActions.loaded(null));

      const emitted = await firstValueFrom(probeTelemetry().pipe(toArray()));

      expect(emitted).toEqual([]);
    });

    it('re-reports when the slice changes, so a tile tracks live state', () => {
      setup();
      markProbeRead();
      actions$ = of(ProbeActions.loaded(probeState));
      const store = TestBed.inject(MockStore);
      const reported: number[] = [];

      const sub = probeTelemetry().subscribe((action) =>
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
