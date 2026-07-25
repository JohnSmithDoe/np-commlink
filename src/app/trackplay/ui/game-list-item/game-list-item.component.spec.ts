import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { TIonDragEvent } from '../../../@shared/model/types';
import { mockGame } from '../../testing/trackplay.test-data';
import { TrackplayGameListItemComponent } from './game-list-item.component';

// A fake sliding-list handle: the emit helpers only await closeSlidingItems().
const fakeIonList = () =>
  ({ closeSlidingItems: vi.fn().mockResolvedValue(undefined) }) as unknown as {
    closeSlidingItems: () => Promise<void>;
  } & IonList;

const dragEvent = (amount: number): TIonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as TIonDragEvent;

describe('TrackplayGameListItemComponent', () => {
  let fixture: ComponentFixture<TrackplayGameListItemComponent>;
  let component: TrackplayGameListItemComponent;
  let ionList: ReturnType<typeof fakeIonList>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TrackplayGameListItemComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(TrackplayGameListItemComponent);
    component = fixture.componentInstance;
    ionList = fakeIonList();
    fixture.componentRef.setInput('game', mockGame({ id: 'game-1' }));
    fixture.componentRef.setInput('ionList', ionList);
  });

  it('closes the sliding items and emits deleteGame', async () => {
    let emitted = false;
    component.deleteGame.subscribe(() => (emitted = true));

    await component.emitDelete();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('closes the sliding items and emits editGame', async () => {
    let emitted = false;
    component.editGame.subscribe(() => (emitted = true));

    await component.emitEdit();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('routes a start-side drag to delete and an end-side drag to edit', () => {
    const del = vi.spyOn(component, 'emitDelete').mockResolvedValue(undefined);
    const edit = vi.spyOn(component, 'emitEdit').mockResolvedValue(undefined);

    component.handleDrag(dragEvent(-200));
    expect(del).toHaveBeenCalledTimes(1);
    expect(edit).not.toHaveBeenCalled();

    component.handleDrag(dragEvent(200));
    expect(edit).toHaveBeenCalledTimes(1);
  });

  it('ignores a below-threshold drag', () => {
    const del = vi.spyOn(component, 'emitDelete').mockResolvedValue(undefined);
    const edit = vi.spyOn(component, 'emitEdit').mockResolvedValue(undefined);

    component.handleDrag(dragEvent(10));

    expect(del).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
  });
});
