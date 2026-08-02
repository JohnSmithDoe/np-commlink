import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';
import { mockGameType } from '../../testing/trackplay.test-data';
import { TrackplayGameTypeListItemComponent } from './game-type-list-item.component';

const fakeIonList = () =>
  ({ closeSlidingItems: vi.fn().mockResolvedValue(undefined) }) as unknown as {
    closeSlidingItems: () => Promise<void>;
  } & IonList;

describe('TrackplayGameTypeListItemComponent', () => {
  it('closes the sliding items and asks for a delete', async () => {
    TestBed.configureTestingModule({
      imports: [TrackplayGameTypeListItemComponent],
      providers: [provideTranslateService(), provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TrackplayGameTypeListItemComponent);
    const ionList = fakeIonList();
    fixture.componentRef.setInput('gameType', mockGameType({ id: 'skat' }));
    fixture.componentRef.setInput('ionList', ionList);
    let emitted = false;
    fixture.componentInstance.deleteRequested.subscribe(() => (emitted = true));

    await fixture.componentInstance.emitDelete();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });
});
