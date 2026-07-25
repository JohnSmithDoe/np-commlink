import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
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
import { TranslateModule } from '@ngx-translate/core';
import { IGameConfig, ITrackplayConfig } from '../../model';
import { TrackplayFacade } from '../../data';

type TSettingsMode = 'games' | 'players' | 'gamesForPlayer';

/**
 * Sort / filter settings, presented via PopoverController. `mode` (an imperative
 * componentProp) picks which list config to edit: the games list, a player's
 * games list, or the players list. Each control dispatches a partial config
 * update straight to the store — no local mirror, no explicit save. Port of the
 * legacy `game-settings` popover.
 */
@Component({
  selector: 'app-trackplay-game-settings-popover',
  templateUrl: './game-settings-popover.component.html',
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
    TranslateModule,
  ],
})
export class TrackplayGameSettingsPopoverComponent {
  readonly #facade = inject(TrackplayFacade);
  readonly #config = this.#facade.config;
  readonly rxGameTypes = this.#facade.gameTypeList;

  /** Set imperatively via `componentProps`. */
  mode: TSettingsMode = 'games';

  readonly isPlayers = computed(() => this.mode === 'players');
  readonly gamesConfig = computed<IGameConfig>(() =>
    this.mode === 'gamesForPlayer'
      ? this.#config().gamesForPlayer
      : this.#config().games
  );
  readonly playersConfig = computed<ITrackplayConfig['players']>(
    () => this.#config().players
  );

  #dispatch(config: Partial<IGameConfig>): void {
    if (this.mode === 'gamesForPlayer') {
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

  setGamesDir(value: 'asc' | 'desc'): void {
    this.#dispatch({ dir: value });
  }

  setGamesSort(value: IGameConfig['sort']): void {
    this.#dispatch({ sort: value });
  }

  setPlayersFilter(value: string): void {
    this.#facade.updatePlayersConfig({ filter: value });
  }

  setPlayersDir(value: 'asc' | 'desc'): void {
    this.#facade.updatePlayersConfig({ dir: value });
  }

  setPlayersSort(value: 'name' | 'date' | 'last'): void {
    this.#facade.updatePlayersConfig({ sort: value });
  }
}
