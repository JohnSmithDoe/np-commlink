import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ITrackingItem } from '../../model/tracking.types';
import { TrackingItemComponent } from './tracking-item.component';

const track = (state: ITrackingItem['state']): ITrackingItem => ({
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
    // No detectChanges: we exercise the mapping methods, not the template (the
    // required `item`/`ionList` inputs are only read during rendering).
    component = TestBed.createComponent(
      TrackingItemComponent
    ).componentInstance;
  });

  it('maps the tracking state to a status color', () => {
    expect(component.getColor(track('running'))).toBe('success');
    expect(component.getColor(track('stopped'))).toBe('medium');
    expect(component.getColor(track('paused'))).toBe('warning');
  });

  it('maps to the opposite (toggle-target) color', () => {
    expect(component.getOppositeColor(track('running'))).toBe('warning');
    expect(component.getOppositeColor(track('stopped'))).toBe('success');
    expect(component.getOppositeColor(track('paused'))).toBe('success');
  });
});
