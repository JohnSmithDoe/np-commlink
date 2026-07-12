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
import { IPlayer, TID } from '../../../@shared/types';

/**
 * DUMB multi-select for the game-edit dialog. Renders one checkbox per player.
 * Selected players float to the top in their existing selection order, the rest
 * follow alphabetically (the display order is frozen off the initial
 * `selectedIds`, so rows never jump while toggling). Emits the checked ids in
 * that display order, preserving selection order — a port of the legacy
 * `player-select` refresh()/onAccept ordering. Holds no store.
 */
@Component({
  selector: 'app-trackplay-player-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player-select.component.html',
  styleUrls: ['./player-select.component.scss'],
  imports: [IonList, IonItem, IonCheckbox, IonLabel],
})
export class TrackplayPlayerSelectComponent {
  readonly players = input.required<IPlayer[]>();
  readonly selectedIds = input.required<TID[]>();

  readonly selectionChange = output<TID[]>();

  // Local checked map, seeded from `selectedIds` and re-seeded if it changes.
  readonly #checked = linkedSignal<Record<TID, boolean>>(() => {
    const map: Record<TID, boolean> = {};
    for (const id of this.selectedIds()) {
      map[id] = true;
    }
    return map;
  });

  // Display order: initially-selected first (in selectedIds order), then the
  // unselected sorted by name. Depends on the (stable) inputs, not the local
  // checked map, so rows keep their place while the user toggles.
  readonly orderedPlayers = computed<IPlayer[]>(() => {
    const selected = this.selectedIds();
    const selectedSet = new Set(selected);
    return [...this.players()].sort((a, b) => {
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

  isChecked(id: TID): boolean {
    return !!this.#checked()[id];
  }

  onToggle(id: TID, ev: CheckboxCustomEvent): void {
    this.#checked.update((map) => ({ ...map, [id]: ev.detail.checked }));
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
