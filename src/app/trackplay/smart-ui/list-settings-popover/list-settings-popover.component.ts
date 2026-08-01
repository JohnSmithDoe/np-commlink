import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import {
  IGameConfig,
  IPlayersConfig,
  ITrackplayConfig,
} from '../../model/trackplay.types';
import { TrackplayFacade } from '../../data';

export type TSettingsMode = 'games' | 'players' | 'gamesForPlayer';

/**
 * Sort / filter settings, presented via PopoverController. `mode` (an imperative
 * componentProp) picks which list config to edit: the games list, a player's
 * games list, or the players list. Each control dispatches a partial config
 * update straight to the store — no local mirror, no explicit save. Port of the
 * legacy `game-settings` popover.
 */
@Component({
  selector: 'app-trackplay-list-settings-popover',
  templateUrl: './list-settings-popover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    TranslatePipe,
  ],
})
export class TrackplayListSettingsPopoverComponent {
  readonly #facade = inject(TrackplayFacade);
  readonly #config = this.#facade.config;
  readonly rxGameTypes = this.#facade.gameTypeList;

  readonly #mode = signal<TSettingsMode>('games');

  /** Set imperatively via `componentProps`. */
  set mode(value: TSettingsMode) {
    this.#mode.set(value);
  }

  readonly isGames = computed(() => this.#mode() === 'games');
  readonly isPlayers = computed(() => this.#mode() === 'players');
  readonly gamesConfig = computed<IGameConfig>(() =>
    this.#mode() === 'gamesForPlayer'
      ? this.#config().gamesForPlayer
      : this.#config().games
  );
  readonly playersConfig = computed<ITrackplayConfig['players']>(
    () => this.#config().players
  );

  #dispatch(config: Partial<IGameConfig>): void {
    if (this.#mode() === 'gamesForPlayer') {
      this.#facade.updateGamesForPlayerConfig(config);
    } else {
      this.#facade.updateGamesConfig(config);
    }
  }

  setShowEnded(value: boolean): void {
    this.#dispatch({ showEndedGames: value });
  }

  setTypeId(value: string): void {
    this.#dispatch({ typeId: value });
  }

  setGamesFilter(value: string): void {
    this.#dispatch({ filter: value });
  }

  setGamesDirection(value: 'asc' | 'desc'): void {
    this.#dispatch({ direction: value });
  }

  setGamesSort(value: IGameConfig['sort']): void {
    this.#dispatch({ sort: value });
  }

  setPlayersFilter(value: string): void {
    this.#facade.updatePlayersConfig({ filter: value });
  }

  setPlayersDirection(value: IPlayersConfig['direction']): void {
    this.#facade.updatePlayersConfig({ direction: value });
  }

  setPlayersSort(value: IPlayersConfig['sort']): void {
    this.#facade.updatePlayersConfig({ sort: value });
  }
}
