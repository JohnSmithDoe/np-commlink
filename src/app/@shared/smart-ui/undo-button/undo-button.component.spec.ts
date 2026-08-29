import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { UndoActions } from '../../data/undo/undo.actions';
import { selectUndoEntries } from '../../data/undo/undo.selector';
import { mockKernelState } from '../../testing/test-data';
import { UndoButtonComponent } from './undo-button.component';

const STASH = '_storage';
const SHOPPING = '_shopping';

const milk = {
  scope: STASH,
  name: 'Milk',
  action: { type: '[Shopping] add item' },
};

describe('UndoButtonComponent', () => {
  let store: MockStore;

  const setup = (scope = STASH) => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: mockKernelState() }),
      ],
    });
    store = TestBed.inject(MockStore);
    const fixture = TestBed.createComponent(UndoButtonComponent);
    fixture.componentRef.setInput('scope', scope);
    return fixture.componentInstance;
  };

  afterEach(() => store.resetSelectors());

  it('stays hidden while the stack is empty', () => {
    const component = setup();
    expect(component.canUndo()).toBe(false);
  });

  it('stays hidden while nothing in the stack belongs to this list', () => {
    const component = setup(SHOPPING);
    store.overrideSelector(selectUndoEntries, [milk]);
    store.refreshState();

    expect(component.canUndo()).toBe(false);
  });

  it('names the entry it would restore', () => {
    const component = setup();
    store.overrideSelector(selectUndoEntries, [milk]);
    store.refreshState();

    expect(component.canUndo()).toBe(true);
    expect(component.pendingName()).toBe('Milk');
  });

  it('pops its own list rather than dispatching the entry itself', () => {
    const component = setup();
    const dispatch = vi.spyOn(store, 'dispatch');
    component.undo();

    expect(dispatch).toHaveBeenCalledWith(UndoActions.performed(STASH));
  });
});
