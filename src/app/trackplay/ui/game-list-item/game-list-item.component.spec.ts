import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';
import { mockGame } from '../../testing/trackplay.test-data';
import { TrackplayGameListItemComponent } from './game-list-item.component';

const fakeIonList = () =>
  ({ closeSlidingItems: vi.fn().mockResolvedValue(undefined) }) as unknown as {
    closeSlidingItems: () => Promise<void>;
  } & IonList;

describe('TrackplayGameListItemComponent', () => {
  it('closes the sliding items and asks for a delete', async () => {
    TestBed.configureTestingModule({
      imports: [TrackplayGameListItemComponent],
      providers: [provideTranslateService(), provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TrackplayGameListItemComponent);
    const ionList = fakeIonList();
    fixture.componentRef.setInput('game', mockGame({ id: 'game-1' }));
    fixture.componentRef.setInput('ionList', ionList);
    let emitted = false;
    fixture.componentInstance.deleteRequested.subscribe(() => (emitted = true));

    await fixture.componentInstance.emitDelete();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });
});
