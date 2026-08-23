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
import { DatabaseService } from '../persistence/database.service';
import { ReadBeforeWriteService } from '../persistence/read-before-write.service';
import {
  ContextBundle,
  mergeContexts,
  providePersistedContext,
} from './persisted-context.provider';

type ProbeState = { items: string[] };

const ProbeActions = createActionGroup({
  source: 'Probe',
  events: {
    load: emptyProps(),
    loaded: (probe: ProbeState | null) => ({ probe }),
    addItem: (name: string) => ({ name }),
    updateSearch: (searchQuery?: string) => ({ searchQuery }),
    updateFilter: (filterBy?: string) => ({ filterBy }),
  },
});

const SiblingActions = createActionGroup({
  source: 'Sibling',
  events: {
    load: emptyProps(),
    loaded: (sibling: ProbeState | null) => ({ sibling }),
  },
});

const probeReducer = createReducer<ProbeState>({ items: [] });
const selectProbe = createFeatureSelector<ProbeState>('probe');
const selectSibling = createFeatureSelector<ProbeState>('sibling');

const runResolver = (bundle: ContextBundle): Promise<unknown> => {
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

  const storeWith = (bundle: ContextBundle): Store => {
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

  describe('the route resolver', () => {
    it('reads on first entry and skips once the key has hydrated', async () => {
      const bundle = probeContext();
      storeWith(bundle);

      await expect(runResolver(bundle)).resolves.toBe(true);
      expect(database.load).toHaveBeenCalledTimes(1);

      await expect(runResolver(bundle)).resolves.toBe(true);
      expect(database.load).toHaveBeenCalledTimes(1);
    });

    it('retries when the first read rejected', async () => {
      const bundle = probeContext();
      storeWith(bundle);
      database.load.mockRejectedValueOnce(new Error('disk gone'));

      await runResolver(bundle);
      expect(TestBed.inject(ReadBeforeWriteService).mayPersist('probe')).toBe(
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
    TestBed.inject(ReadBeforeWriteService).recordRead('probe');

    store.dispatch(ProbeActions.addItem('a'));

    expect(database.save).toHaveBeenCalledTimes(1);
  });

  it('writes on no view-only event, though the source form claims its prefix', () => {
    const store = storeWith(probeContext());
    TestBed.inject(ReadBeforeWriteService).recordRead('probe');

    store.dispatch(ProbeActions.updateSearch('mil'));
    store.dispatch(ProbeActions.updateFilter('dairy'));
    expect(database.save).not.toHaveBeenCalled();

    store.dispatch(ProbeActions.addItem('milk'));
    expect(database.save).toHaveBeenCalledTimes(1);
  });

  it('writes on one anyway where the descriptor names it outright', () => {
    const store = storeWith(
      providePersistedContext({
        key: 'probe',
        reducer: probeReducer,
        lifecycle: ProbeActions,
        select: selectProbe,
        save: { on: [ProbeActions.updateSearch] },
      })
    );
    TestBed.inject(ReadBeforeWriteService).recordRead('probe');

    store.dispatch(ProbeActions.updateSearch('mil'));

    expect(database.save).toHaveBeenCalledTimes(1);
  });

  it('wires none when it does not, so a derived context never writes', () => {
    const store = storeWith(probeContext(false));
    TestBed.inject(ReadBeforeWriteService).recordRead('probe');

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
