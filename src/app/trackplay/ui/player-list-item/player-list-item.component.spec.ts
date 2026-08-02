import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';
import { PlayerStats } from '../../model/trackplay.types';
import { mockPlayer } from '../../testing/trackplay.test-data';
import { TrackplayPlayerListItemComponent } from './player-list-item.component';

const fakeIonList = () =>
  ({ closeSlidingItems: vi.fn().mockResolvedValue(undefined) }) as unknown as {
    closeSlidingItems: () => Promise<void>;
  } & IonList;

const stats: PlayerStats = { play: 3, win: 1, loss: 1, open: 1 };

describe('TrackplayPlayerListItemComponent', () => {
  it('closes the sliding items and asks for an edit', async () => {
    TestBed.configureTestingModule({
      imports: [TrackplayPlayerListItemComponent],
      providers: [provideTranslateService(), provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TrackplayPlayerListItemComponent);
    const ionList = fakeIonList();
    fixture.componentRef.setInput('player', mockPlayer({ id: 'player-1' }));
    fixture.componentRef.setInput('stats', stats);
    fixture.componentRef.setInput('ionList', ionList);
    let emitted = false;
    fixture.componentInstance.editRequested.subscribe(() => (emitted = true));

    await fixture.componentInstance.emitEdit();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });
});
