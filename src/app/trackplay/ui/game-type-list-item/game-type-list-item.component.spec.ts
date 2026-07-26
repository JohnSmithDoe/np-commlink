import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { TIonDragEvent } from '../../../@shared/model/app.types';
import { mockGameType } from '../../testing/trackplay.test-data';
import { TrackplayGameTypeListItemComponent } from './game-type-list-item.component';

const fakeIonList = () =>
  ({ closeSlidingItems: vi.fn().mockResolvedValue(undefined) }) as unknown as {
    closeSlidingItems: () => Promise<void>;
  } & IonList;

const dragEvent = (amount: number): TIonDragEvent =>
  ({ detail: { amount, ratio: 0 } }) as TIonDragEvent;

describe('TrackplayGameTypeListItemComponent', () => {
  let fixture: ComponentFixture<TrackplayGameTypeListItemComponent>;
  let component: TrackplayGameTypeListItemComponent;
  let ionList: ReturnType<typeof fakeIonList>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TrackplayGameTypeListItemComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(TrackplayGameTypeListItemComponent);
    component = fixture.componentInstance;
    ionList = fakeIonList();
    fixture.componentRef.setInput('gameType', mockGameType({ id: 'skat' }));
    fixture.componentRef.setInput('ionList', ionList);
  });

  it('closes the sliding items and emits deleteType', async () => {
    let emitted = false;
    component.deleteType.subscribe(() => (emitted = true));

    await component.emitDelete();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('closes the sliding items and emits editType', async () => {
    let emitted = false;
    component.editType.subscribe(() => (emitted = true));

    await component.emitEdit();

    expect(ionList.closeSlidingItems).toHaveBeenCalled();
    expect(emitted).toBe(true);
  });

  it('deletes on a start-side drag only when deletion is allowed', () => {
    const del = vi.spyOn(component, 'emitDelete').mockResolvedValue(undefined);

    fixture.componentRef.setInput('canDelete', false);
    component.deleteOrEditOnSwipe(dragEvent(-200));
    expect(del).not.toHaveBeenCalled();

    fixture.componentRef.setInput('canDelete', true);
    component.deleteOrEditOnSwipe(dragEvent(-200));
    expect(del).toHaveBeenCalledTimes(1);
  });

  it('edits on an end-side drag regardless of canDelete', () => {
    const edit = vi.spyOn(component, 'emitEdit').mockResolvedValue(undefined);

    fixture.componentRef.setInput('canDelete', false);
    component.deleteOrEditOnSwipe(dragEvent(200));

    expect(edit).toHaveBeenCalledTimes(1);
  });
});
