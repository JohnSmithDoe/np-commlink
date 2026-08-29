import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { UndoEntry } from '../../model/undo.types';
import { NotificationsActions } from '../actions/notifications.actions';
import { UndoActions } from './undo.actions';
import { undoEffects } from './undo.effects';
import { selectUndoEntries } from './undo.selector';

const STASH = '_storage';
const SHOPPING = '_shopping';

const restoreMilk = { type: '[Shopping] add item' };
const entry: UndoEntry = { scope: STASH, name: 'Milk', action: restoreMilk };
const butter: UndoEntry = {
  scope: SHOPPING,
  name: 'Butter',
  action: { type: '[Shopping] add butter' },
};

describe('undoEffects', () => {
  let actions$: Observable<Action>;
  let store: MockStore;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [provideMockActions(() => actions$), provideMockStore()],
    });
    store = TestBed.inject(MockStore);
  };

  const emissions = (
    effect: (typeof undoEffects)[keyof typeof undoEffects]
  ): Promise<Action[]> =>
    firstValueFrom(
      TestBed.runInInjectionContext(() => effect()).pipe(toArray())
    );

  afterEach(() => store.resetSelectors());

  it('reports the delete as a grouped 5 s toast that offers no action', async () => {
    setup();
    actions$ = of(UndoActions.pushed(entry));

    expect(await emissions(undoEffects.offerUndo$)).toEqual([
      NotificationsActions.toast({
        key: 'undo.toast.deleted',
        parameters: { name: 'Milk' },
        durationMs: 5000,
        group: 'undo',
      }),
    ]);
  });

  it('runs the newest entry of the named scope and pops that one', async () => {
    setup();
    store.overrideSelector(selectUndoEntries, [entry, butter]);
    actions$ = of(UndoActions.performed(STASH));

    expect(await emissions(undoEffects.performUndo$)).toEqual([
      restoreMilk,
      UndoActions.popped(STASH),
      NotificationsActions.toast({
        key: 'undo.toast.restored',
        parameters: { name: 'Milk' },
        durationMs: 5000,
        group: 'undo',
      }),
    ]);
  });

  it('stays silent for a scope the stack does not hold', async () => {
    setup();
    store.overrideSelector(selectUndoEntries, [butter]);
    actions$ = of(UndoActions.performed(STASH));

    expect(await emissions(undoEffects.performUndo$)).toEqual([]);
  });

  it('stays silent when the stack is empty', async () => {
    setup();
    store.overrideSelector(selectUndoEntries, []);
    actions$ = of(UndoActions.performed(STASH));

    expect(await emissions(undoEffects.performUndo$)).toEqual([]);
  });
});
