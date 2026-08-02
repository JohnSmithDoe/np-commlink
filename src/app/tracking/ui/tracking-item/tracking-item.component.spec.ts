import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
  let component: TrackingItemComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TrackingItemComponent],
      providers: [provideTranslateService(), provideZonelessChangeDetection()],
    });
    component = TestBed.createComponent(
      TrackingItemComponent
    ).componentInstance;
  });

  it('maps the tracking state to a status color', () => {
    expect(component.getColor(track('running'))).toBe('success');
    expect(component.getColor(track('stopped'))).toBe('medium');
    expect(component.getColor(track('paused'))).toBe('warning');
  });
});
