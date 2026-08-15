import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { IonDragEvent } from '../../model/app.types';
import { BaseSwipeRow, StartSwipeAction } from './base-swipe-row';

const fakeIonList = () =>
  ({ closeSlidingItems: vi.fn().mockResolvedValue(undefined) }) as unknown as {
    closeSlidingItems: () => Promise<void>;
  } & IonList;

const dragEvent = (amount: number): IonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as IonDragEvent;

const EDIT: StartSwipeAction = { labelKey: 'a.edit', icon: 'create' };

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
    fixture.componentRef.setInput('startSwipeAction', EDIT);
  });

  it('closes the sliding items before emitting a delete request', async () => {
    let emitted = false;
    component.deleteItem.subscribe(() => (emitted = true));

    await component.emitDeleteItem();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('closes the sliding items before emitting the start action', async () => {
    let emitted = false;
    component.startSwipe.subscribe(() => (emitted = true));

    await component.emitStartSwipe();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('routes an end-side drag to delete and a start-side drag to the start action', () => {
    const del = vi
      .spyOn(component, 'emitDeleteItem')
      .mockResolvedValue(undefined);
    const start = vi
      .spyOn(component, 'emitStartSwipe')
      .mockResolvedValue(undefined);

    component.onSwipe(dragEvent(200));
    expect(del).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();

    component.onSwipe(dragEvent(-200));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('ignores a below-threshold drag', () => {
    const del = vi
      .spyOn(component, 'emitDeleteItem')
      .mockResolvedValue(undefined);
    const start = vi
      .spyOn(component, 'emitStartSwipe')
      .mockResolvedValue(undefined);

    component.onSwipe(dragEvent(10));

    expect(del).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
  });

  it('deletes on an end-side drag only when deletion is allowed', () => {
    const del = vi
      .spyOn(component, 'emitDeleteItem')
      .mockResolvedValue(undefined);
    const start = vi
      .spyOn(component, 'emitStartSwipe')
      .mockResolvedValue(undefined);

    fixture.componentRef.setInput('canDelete', false);
    component.onSwipe(dragEvent(200));
    expect(del).not.toHaveBeenCalled();

    component.onSwipe(dragEvent(-200));
    expect(start).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('canDelete', true);
    component.onSwipe(dragEvent(200));
    expect(del).toHaveBeenCalledTimes(1);
  });

  it('stays inert on a start-side drag when the row reveals nothing there', () => {
    const start = vi
      .spyOn(component, 'emitStartSwipe')
      .mockResolvedValue(undefined);

    fixture.componentRef.setInput('startSwipeAction', undefined);
    component.onSwipe(dragEvent(-200));

    expect(start).not.toHaveBeenCalled();
  });
});
