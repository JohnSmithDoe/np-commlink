import {
  ChangeDetectionStrategy,
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
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { Player, TrackplayId } from '../../model/trackplay.types';

@Component({
  selector: 'app-trackplay-player-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player-select.component.html',
  styleUrls: ['./player-select.component.scss'],
  imports: [IonList, IonItem, IonCheckbox, IonLabel],
})
export class TrackplayPlayerSelectComponent {
  readonly players = input.required<Player[]>();
  readonly selectedIds = input.required<TrackplayId[]>();

  readonly selectionChange = output<TrackplayId[]>();

  readonly #checked = linkedSignal<Record<TrackplayId, boolean>>(() => {
    const map: Record<TrackplayId, boolean> = {};
    for (const id of this.selectedIds()) {
      map[id] = true;
    }
    return map;
  });

  readonly orderedPlayers = computed<Player[]>(() => {
    const selected = this.selectedIds();
    const selectedSet = new Set(selected);
    return this.players().toSorted((a, b) => {
      const aSel = selectedSet.has(a.id);
      const bSel = selectedSet.has(b.id);
      if (aSel && bSel) {
        return selected.indexOf(a.id) - selected.indexOf(b.id);
      }
      if (aSel) return -1;
      if (bSel) return 1;
      return a.name.localeCompare(b.name);
    });
  });

  isChecked(id: TrackplayId): boolean {
    return !!this.#checked()[id];
  }

  onToggle(id: TrackplayId, event: CheckboxCustomEvent): void {
    this.#checked.update((map) => ({ ...map, [id]: event.detail.checked }));
    this.emitSelection();
  }

  private emitSelection(): void {
    const checked = this.#checked();
    const ids = this.orderedPlayers()
      .map((player) => player.id)
      .filter((id) => checked[id]);
    this.selectionChange.emit(ids);
  }
}
