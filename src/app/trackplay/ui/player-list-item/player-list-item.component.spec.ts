import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { TIonDragEvent } from '../../../@shared/model/app.types';
import { IPlayerStats } from '../../model/trackplay.types';
import { mockPlayer } from '../../testing/trackplay.test-data';
import { TrackplayPlayerListItemComponent } from './player-list-item.component';

const fakeIonList = () =>
  ({ closeSlidingItems: vi.fn().mockResolvedValue(undefined) }) as unknown as {
    closeSlidingItems: () => Promise<void>;
  } & IonList;

const dragEvent = (amount: number): TIonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as TIonDragEvent;

const stats: IPlayerStats = { play: 3, win: 1, loss: 1, open: 1 };

describe('TrackplayPlayerListItemComponent', () => {
  let fixture: ComponentFixture<TrackplayPlayerListItemComponent>;
  let component: TrackplayPlayerListItemComponent;
  let ionList: ReturnType<typeof fakeIonList>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TrackplayPlayerListItemComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(TrackplayPlayerListItemComponent);
    component = fixture.componentInstance;
    ionList = fakeIonList();
    fixture.componentRef.setInput('player', mockPlayer({ id: 'player-1' }));
    fixture.componentRef.setInput('stats', stats);
    fixture.componentRef.setInput('ionList', ionList);
  });

  it('closes the sliding items and emits deletePlayer', async () => {
    let emitted = false;
    component.deletePlayer.subscribe(() => (emitted = true));

    await component.emitDelete();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('closes the sliding items and emits editPlayer', async () => {
    let emitted = false;
    component.editPlayer.subscribe(() => (emitted = true));

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
});
