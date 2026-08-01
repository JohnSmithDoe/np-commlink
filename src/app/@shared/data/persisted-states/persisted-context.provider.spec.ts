import { TestBed } from '@angular/core/testing';
import {
  createActionGroup,
  createFeatureSelector,
  createReducer,
  emptyProps,
  provideStore,
  Store,
} from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { DatabaseService } from '../../util/persistence/database.service';
import { PersistedReadRegistry } from '../../util/persistence/persisted-read-registry';
import {
  mergeContexts,
  providePersistedContext,
  TContextBundle,
} from './persisted-context.provider';

type TProbeState = { items: string[] };

const ProbeActions = createActionGroup({
  source: 'Probe',
  events: {
    load: emptyProps(),
    loaded: (probe: TProbeState | null) => ({ probe }),
    addItem: (name: string) => ({ name }),
  },
});

const SiblingActions = createActionGroup({
  source: 'Sibling',
  events: {
    load: emptyProps(),
    loaded: (sibling: TProbeState | null) => ({ sibling }),
  },
});

const probeReducer = createReducer<TProbeState>({ items: [] });
const selectProbe = createFeatureSelector<TProbeState>('probe');
const selectSibling = createFeatureSelector<TProbeState>('sibling');

// The bundle exposes its resolver as an opaque `ResolveFn`, so a spec runs it the
// way the router would: inside an injection context.
const runResolver = (bundle: TContextBundle): Promise<unknown> => {
  const resolver = Object.values(bundle.resolve)[0] as () => unknown;
  return Promise.resolve(TestBed.runInInjectionContext(() => resolver()));
};

const probeContext = (save = true) =>
  providePersistedContext({
    key: 'probe',
    reducer: probeReducer,
    lifecycle: ProbeActions,
    select: selectProbe,
    ...(save ? { save: { sources: ['[Probe]'] } } : {}),
  });

const siblingContext = () =>
  providePersistedContext({
    key: 'sibling',
    reducer: probeReducer,
    lifecycle: SiblingActions,
    select: selectSibling,
  });

describe('providePersistedContext', () => {
  let database: {
    load: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  // The bundle's providers are opaque, so what it registered is only observable
  // through a store that has them: a live slice under `key` and, when the
  // descriptor declares one, a save effect that writes that key.
  const storeWith = (bundle: TContextBundle): Store => {
    database = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        provideStore(),
        { provide: DatabaseService, useValue: database },
        ...bundle.providers,
      ],
    });
    return TestBed.inject(Store);
  };

  it('keys the route resolver by the slice key, so merged contexts cannot collide', () => {
    expect(Object.keys(probeContext().resolve)).toEqual(['probe']);
  });

  // Route injectors and their state are never torn down, and the save effect is
  // the doc's only writer, so a slice that hydrated once is already current. The
  // resolver must therefore read on the FIRST entry and skip on every re-entry —
  // otherwise leaving a subtree and coming back pays a blocking read of the whole
  // doc and swaps the slice object, recomputing every selector under it.
  describe('the route resolver', () => {
    it('reads on first entry and skips once the key has hydrated', async () => {
      const bundle = probeContext();
      storeWith(bundle);

      await expect(runResolver(bundle)).resolves.toBe(true);
      expect(database.load).toHaveBeenCalledTimes(1);

      await expect(runResolver(bundle)).resolves.toBe(true);
      expect(database.load).toHaveBeenCalledTimes(1);
    });

    // A rejected read never records the key, so the retry is what stops a context
    // whose first load failed from sitting on initialState for the whole session.
    it('retries when the first read rejected', async () => {
      const bundle = probeContext();
      storeWith(bundle);
      database.load.mockRejectedValueOnce(new Error('disk gone'));

      await runResolver(bundle);
      expect(TestBed.inject(PersistedReadRegistry).mayPersist('probe')).toBe(
        false
      );

      await runResolver(bundle);
      expect(database.load).toHaveBeenCalledTimes(2);
    });
  });

  it('registers the reducer under the key its own selector reads', async () => {
    const store = storeWith(probeContext());

    expect(await firstValueFrom(store.select(selectProbe))).toEqual({
      items: [],
    });
  });

  it('wires a save effect when the descriptor declares a trigger', () => {
    const store = storeWith(probeContext());
    TestBed.inject(PersistedReadRegistry).recordRead('probe');

    store.dispatch(ProbeActions.addItem('a'));

    expect(database.save).toHaveBeenCalledTimes(1);
  });

  it('wires none when it does not, so a derived context never writes', () => {
    const store = storeWith(probeContext(false));
    TestBed.inject(PersistedReadRegistry).recordRead('probe');

    store.dispatch(ProbeActions.addItem('a'));

    expect(database.save).not.toHaveBeenCalled();
  });

  it('carries no route resolver when the context hydrates at boot', () => {
    const eager = providePersistedContext({
      key: 'probe',
      reducer: probeReducer,
      lifecycle: ProbeActions,
      select: selectProbe,
      hydrate: 'boot',
    });

    expect(eager.resolve).toEqual({});
  });

  it('merges co-registered contexts: both slices live, both resolvers keyed', async () => {
    const merged = mergeContexts(probeContext(), siblingContext());
    const store = storeWith(merged);

    expect(Object.keys(merged.resolve).toSorted()).toEqual([
      'probe',
      'sibling',
    ]);
    expect(await firstValueFrom(store.select(selectProbe))).toEqual({
      items: [],
    });
    expect(await firstValueFrom(store.select(selectSibling))).toEqual({
      items: [],
    });
  });
});
