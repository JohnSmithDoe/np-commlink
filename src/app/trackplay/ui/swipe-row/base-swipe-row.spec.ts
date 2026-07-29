import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { TIonDragEvent } from '../../../@shared/model/app.types';
import { BaseSwipeRow } from './base-swipe-row';

// A fake sliding-list handle: the emit helpers only await closeSlidingItems().
const fakeIonList = () =>
  ({ closeSlidingItems: vi.fn().mockResolvedValue(undefined) }) as unknown as {
    closeSlidingItems: () => Promise<void>;
  } & IonList;

const dragEvent = (amount: number): TIonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as TIonDragEvent;

/**
 * The base is abstract and selectorless, so it is exercised through a bare host:
 * the three real rows (game, player, game type) add only their own body markup
 * and a `select*` output, which is why the swipe mechanics are spec'd once here
 * instead of three times over.
 */
@Component({ selector: 'app-swipe-row-probe', template: '' })
class SwipeRowProbeComponent extends BaseSwipeRow {}

describe('BaseSwipeRow', () => {
  let fixture: ComponentFixture<SwipeRowProbeComponent>;
  let component: SwipeRowProbeComponent;
  let ionList: ReturnType<typeof fakeIonList>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SwipeRowProbeComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(SwipeRowProbeComponent);
    component = fixture.componentInstance;
    ionList = fakeIonList();
    fixture.componentRef.setInput('ionList', ionList);
  });

  it('closes the sliding items before emitting a delete request', async () => {
    let emitted = false;
    component.deleteRequested.subscribe(() => (emitted = true));

    await component.emitDelete();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('closes the sliding items before emitting an edit request', async () => {
    let emitted = false;
    component.editRequested.subscribe(() => (emitted = true));

    await component.emitEdit();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('routes a start-side drag to delete and an end-side drag to edit', () => {
    const del = vi.spyOn(component, 'emitDelete').mockResolvedValue(undefined);
    const edit = vi.spyOn(component, 'emitEdit').mockResolvedValue(undefined);

    component.deleteOrEditOnSwipe(dragEvent(-200));
    expect(del).toHaveBeenCalledTimes(1);
    expect(edit).not.toHaveBeenCalled();

    component.deleteOrEditOnSwipe(dragEvent(200));
    expect(edit).toHaveBeenCalledTimes(1);
  });

  it('ignores a below-threshold drag', () => {
    const del = vi.spyOn(component, 'emitDelete').mockResolvedValue(undefined);
    const edit = vi.spyOn(component, 'emitEdit').mockResolvedValue(undefined);

    component.deleteOrEditOnSwipe(dragEvent(10));

    expect(del).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
  });

  // The game-types list binds `canDelete` off the built-in type: that row must
  // stay swipe-editable while refusing the delete side.
  it('deletes on a start-side drag only when deletion is allowed', () => {
    const del = vi.spyOn(component, 'emitDelete').mockResolvedValue(undefined);
    const edit = vi.spyOn(component, 'emitEdit').mockResolvedValue(undefined);

    fixture.componentRef.setInput('canDelete', false);
    component.deleteOrEditOnSwipe(dragEvent(-200));
    expect(del).not.toHaveBeenCalled();

    component.deleteOrEditOnSwipe(dragEvent(200));
    expect(edit).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('canDelete', true);
    component.deleteOrEditOnSwipe(dragEvent(-200));
    expect(del).toHaveBeenCalledTimes(1);
  });
});
