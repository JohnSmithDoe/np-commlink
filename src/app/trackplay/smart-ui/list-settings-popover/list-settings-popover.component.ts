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
  GameConfig,
  PlayersConfig,
  TrackplayConfig,
} from '../../model/trackplay.types';
import { TrackplayFacade } from '../../data';

export type SettingsMode = 'games' | 'players' | 'gamesForPlayer';

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

  readonly #mode = signal<SettingsMode>('games');

  set mode(value: SettingsMode) {
    this.#mode.set(value);
  }

  readonly isGames = computed(() => this.#mode() === 'games');
  readonly isPlayers = computed(() => this.#mode() === 'players');
  readonly gamesConfig = computed<GameConfig>(() =>
    this.#mode() === 'gamesForPlayer'
      ? this.#config().gamesForPlayer
      : this.#config().games
  );
  readonly playersConfig = computed<TrackplayConfig['players']>(
    () => this.#config().players
  );

  #dispatch(config: Partial<GameConfig>): void {
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

  setGamesSort(value: GameConfig['sort']): void {
    this.#dispatch({ sort: value });
  }

  setPlayersFilter(value: string): void {
    this.#facade.updatePlayersConfig({ filter: value });
  }

  setPlayersDirection(value: PlayersConfig['direction']): void {
    this.#facade.updatePlayersConfig({ direction: value });
  }

  setPlayersSort(value: PlayersConfig['sort']): void {
    this.#facade.updatePlayersConfig({ sort: value });
  }
}
