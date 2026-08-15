import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IonList } from '@ionic/angular/standalone';
import { provideTranslateService } from '@ngx-translate/core';
import { TrackingItem } from '../../model/tracking.types';
import { TrackingItemComponent } from './tracking-item.component';

const track = (state: TrackingItem['state']): TrackingItem => ({
  id: '1',
  name: 'Task',
  createdAt: '2026-01-01',
  state,
});

describe('TrackingItemComponent', () => {
  it('closes the sliding row before it emits, so no row is left open', async () => {
    TestBed.configureTestingModule({
      imports: [TrackingItemComponent],
      providers: [provideTranslateService(), provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TrackingItemComponent);
    const order: string[] = [];
    fixture.componentRef.setInput('item', track('running'));
    fixture.componentRef.setInput('ionList', {
      closeSlidingItems: () => {
        order.push('closed');
        return Promise.resolve(true);
      },
    } as unknown as IonList);
    const component = fixture.componentInstance;
    component.editItem.subscribe(() => order.push('emitted'));

    await component.closeAndEmit(component.editItem);

    expect(order).toEqual(['closed', 'emitted']);
  });
});
