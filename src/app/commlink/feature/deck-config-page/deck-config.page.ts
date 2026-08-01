import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonReorder,
  IonReorderGroup,
  IonToggle,
  ReorderEndCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { DeckFacade } from '../../data';
import { TAppModule, TDeckEntryId } from '../../model/deck.types';
import { reorderedIds } from '../../../@shared/util/app.utils';

/**
 * Where the user shapes their deck: which programs the grid and the side menu
 * carry, and in what order.
 *
 * It lives in `commlink` and is reached from `/settings` by a link rather than
 * living there, because `settings → commlink` is a domain violation — the page
 * that edits the deck belongs to the deck's owner.
 */
@Component({
  selector: 'app-page-deck-config',
  templateUrl: './deck-config.page.html',
  styleUrls: ['./deck-config.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonToggle,
    IonReorder,
    IonReorderGroup,
    TranslatePipe,
    PageHeaderComponent,
  ],
})
export class DeckConfigPage {
  readonly #deck = inject(DeckFacade);

  readonly modules = this.#deck.configuredModules;
  readonly entries = this.#deck.configuredEntries;
  readonly hasCustomConfig = this.#deck.hasCustomConfig;

  toggleModule(module: TAppModule): void {
    this.#deck.toggleModule(module);
  }

  toggleEntry(id: TDeckEntryId): void {
    this.#deck.toggleEntry(id);
  }

  reset(): void {
    this.#deck.reset();
  }

  reorder(event: ReorderEndCustomEvent): void {
    this.#deck.reorder(reorderedIds(event, this.entries()));
  }

  constructor() {
    addIcons({ settingsOutline });
  }
}
