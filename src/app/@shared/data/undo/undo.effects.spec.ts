import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { UndoEntry } from '../../model/undo.types';
import { NotificationsActions } from '../actions/notifications.actions';
import { UndoActions } from './undo.actions';
import { undoEffects } from './undo.effects';
import { selectUndoTop } from './undo.selector';

const restoreMilk = { type: '[Shopping] add item' };
const entry: UndoEntry = { name: 'Milk', action: restoreMilk };

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

  it('offers undo as a grouped 5 s toast naming the deleted item', async () => {
    setup();
    actions$ = of(UndoActions.pushed(entry));

    expect(await emissions(undoEffects.offerUndo$)).toEqual([
      NotificationsActions.toast({
        key: 'undo.toast.deleted',
        parameters: { name: 'Milk' },
        durationMs: 5000,
        group: 'undo',
        action: {
          labelKey: 'undo.action',
          action: UndoActions.performed(),
        },
      }),
    ]);
  });

  it('runs the top entry and then pops it', async () => {
    setup();
    store.overrideSelector(selectUndoTop, entry);
    actions$ = of(UndoActions.performed());

    expect(await emissions(undoEffects.performUndo$)).toEqual([
      restoreMilk,
      UndoActions.popped(),
    ]);
  });

  it('stays silent when the stack is empty', async () => {
    setup();
    store.overrideSelector(selectUndoTop, undefined);
    actions$ = of(UndoActions.performed());

    expect(await emissions(undoEffects.performUndo$)).toEqual([]);
  });
});
