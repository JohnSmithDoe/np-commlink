import {
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import {
  CheckboxCustomEvent,
  IonCheckbox,
  IonItem,
  IonList,
} from '@ionic/angular/standalone';
import { Player, TrackplayId } from '../../model/trackplay.types';

@Component({
  selector: 'app-trackplay-player-select',
  templateUrl: './player-select.component.html',
  styleUrls: ['./player-select.component.scss'],
  imports: [IonList, IonItem, IonCheckbox],
})
export class TrackplayPlayerSelectComponent {
  readonly #checked = linkedSignal<Record<TrackplayId, boolean>>(() => {
    const map: Record<TrackplayId, boolean> = {};
    for (const id of this.selectedIds()) {
      map[id] = true;
    }
    return map;
  });

  readonly players = input.required<Player[]>();
  readonly selectedIds = input.required<TrackplayId[]>();

  readonly selectionChange = output<TrackplayId[]>();

  readonly orderedPlayers = computed<Player[]>(() => {
    const selected = this.selectedIds();
    const selectedSet = new Set(selected);
    return this.players().toSorted((a, b) => {
      const isASel = selectedSet.has(a.id);
      const isBSel = selectedSet.has(b.id);
      if (isASel && isBSel) {
        return selected.indexOf(a.id) - selected.indexOf(b.id);
      }
      if (isASel) return -1;
      return isBSel ? 1 : a.name.localeCompare(b.name);
    });
  });

  private emitSelection(): void {
    const checked = this.#checked();
    const offered = new Set(this.players().map((player) => player.id));
    const ids = this.orderedPlayers()
      .map((player) => player.id)
      .filter((id) => checked[id]);
    const absent = this.selectedIds().filter((id) => !offered.has(id));
    this.selectionChange.emit([...ids, ...absent]);
  }

  isChecked(id: TrackplayId): boolean {
    return this.#checked()[id] === true;
  }

  onToggle(id: TrackplayId, event: CheckboxCustomEvent): void {
    this.#checked.update((map) => ({ ...map, [id]: event.detail.checked }));
    this.emitSelection();
  }
}
