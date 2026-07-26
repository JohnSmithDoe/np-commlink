import {
  createActionGroup,
  createFeatureSelector,
  createReducer,
  emptyProps,
} from '@ngrx/store';
import {
  mergeContexts,
  providePersistedContext,
} from './persisted-context.provider';

type TProbeState = { items: string[] };

const ProbeActions = createActionGroup({
  source: 'Probe',
  events: {
    load: emptyProps(),
    loaded: (probe: TProbeState | null) => ({ probe }),
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

const probeContext = () =>
  providePersistedContext({
    key: 'probe',
    reducer: probeReducer,
    lifecycle: ProbeActions,
    select: selectProbe,
    save: { sources: ['[Probe]'] },
  });

describe('providePersistedContext', () => {
  it('keys the route resolver by the slice key, so merged contexts cannot collide', () => {
    expect(Object.keys(probeContext().resolve)).toEqual(['probe']);
  });

  it('registers state + effects providers', () => {
    expect(probeContext().providers.length).toBeGreaterThan(0);
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

  it('merges co-registered contexts into one provider list and one resolve map', () => {
    const sibling = providePersistedContext({
      key: 'sibling',
      reducer: probeReducer,
      lifecycle: SiblingActions,
      select: selectProbe,
    });
    const merged = mergeContexts(probeContext(), sibling);

    expect(Object.keys(merged.resolve).toSorted()).toEqual([
      'probe',
      'sibling',
    ]);
    expect(merged.providers.length).toBe(
      probeContext().providers.length + sibling.providers.length
    );
  });
});
