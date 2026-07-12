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
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { IGameConfig, ITrackplayConfig } from '../../../@shared/types';
import { TrackplayActions } from '../../data/trackplay.actions';
import {
  selectGameTypeList,
  selectTrackplayConfig,
} from '../../data/trackplay.selector';

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
  readonly #store = inject(Store);
  readonly #config = this.#store.selectSignal(selectTrackplayConfig);
  readonly rxGameTypes = this.#store.selectSignal(selectGameTypeList);

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
      this.#store.dispatch(TrackplayActions.updateGamesForPlayerConfig(config));
    } else {
      this.#store.dispatch(TrackplayActions.updateGamesConfig(config));
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
    this.#store.dispatch(
      TrackplayActions.updatePlayersConfig({ filter: value })
    );
  }

  setPlayersDir(value: 'asc' | 'desc'): void {
    this.#store.dispatch(TrackplayActions.updatePlayersConfig({ dir: value }));
  }

  setPlayersSort(value: 'name' | 'date' | 'last'): void {
    this.#store.dispatch(TrackplayActions.updatePlayersConfig({ sort: value }));
  }
}
