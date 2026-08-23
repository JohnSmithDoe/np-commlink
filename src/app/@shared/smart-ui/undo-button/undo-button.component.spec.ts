import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { UndoActions } from '../../data/undo/undo.actions';
import { selectUndoTop } from '../../data/undo/undo.selector';
import { mockKernelState } from '../../testing/test-data';
import { UndoButtonComponent } from './undo-button.component';

describe('UndoButtonComponent', () => {
  let store: MockStore;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: mockKernelState() }),
      ],
    });
    store = TestBed.inject(MockStore);
    return TestBed.createComponent(UndoButtonComponent).componentInstance;
  };

  afterEach(() => store.resetSelectors());

  it('stays hidden while the stack is empty', () => {
    const component = setup();
    expect(component.canUndo()).toBe(false);
  });

  it('names the entry it would restore', () => {
    const component = setup();
    store.overrideSelector(selectUndoTop, {
      name: 'Milk',
      action: { type: '[Shopping] add item' },
    });
    store.refreshState();

    expect(component.canUndo()).toBe(true);
    expect(component.pendingName()).toBe('Milk');
  });

  it('pops the stack rather than dispatching the entry itself', () => {
    const component = setup();
    const dispatch = vi.spyOn(store, 'dispatch');
    component.undo();

    expect(dispatch).toHaveBeenCalledWith(UndoActions.performed());
  });
});
