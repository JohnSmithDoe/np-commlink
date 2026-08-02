import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckboxCustomEvent } from '@ionic/angular/standalone';
import { Player, TrackplayId } from '../../model/trackplay.types';
import { mockPlayer } from '../../testing/trackplay.test-data';
import { TrackplayPlayerSelectComponent } from './player-select.component';

const players: Player[] = [
  mockPlayer({ id: 'a', name: 'Alice' }),
  mockPlayer({ id: 'b', name: 'Bob' }),
  mockPlayer({ id: 'c', name: 'Carol' }),
  mockPlayer({ id: 'd', name: 'Dave' }),
];

const toggle = (checked: boolean): CheckboxCustomEvent =>
  ({ detail: { checked } }) as CheckboxCustomEvent;

describe('TrackplayPlayerSelectComponent', () => {
  let fixture: ComponentFixture<TrackplayPlayerSelectComponent>;
  let component: TrackplayPlayerSelectComponent;

  const setup = (selectedIds: TrackplayId[]) => {
    fixture.componentRef.setInput('players', players);
    fixture.componentRef.setInput('selectedIds', selectedIds);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TrackplayPlayerSelectComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(TrackplayPlayerSelectComponent);
    component = fixture.componentInstance;
  });

  it('orders selected players first (in selection order), then the rest by name', () => {
    setup(['d', 'b']);

    expect(component.orderedPlayers().map((p) => p.id)).toEqual([
      'd',
      'b',
      'a',
      'c',
    ]);
  });

  it('seeds the checked state from selectedIds', () => {
    setup(['d', 'b']);

    expect(component.isChecked('d')).toBe(true);
    expect(component.isChecked('b')).toBe(true);
    expect(component.isChecked('a')).toBe(false);
  });

  it('emits the checked ids in display order when a player is checked on', () => {
    setup(['d', 'b']);
    const emitted: TrackplayId[][] = [];
    component.selectionChange.subscribe((ids) => emitted.push(ids));

    component.onToggle('a', toggle(true));

    expect(emitted).toEqual([['d', 'b', 'a']]);
  });

  it('drops an id from the emitted selection when unchecked', () => {
    setup(['d', 'b']);
    const emitted: TrackplayId[][] = [];
    component.selectionChange.subscribe((ids) => emitted.push(ids));

    component.onToggle('b', toggle(false));

    expect(emitted).toEqual([['d']]);
  });
});
