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
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { DeckFacade } from '../../data';
import { TAppModule, TDeckEntryId } from '../../model/deck.types';
import { moveEntry } from '../../util/deck.utils';

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
    TranslateModule,
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

  /**
   * `complete(false)` leaves the DOM to Angular: the list re-renders from the
   * stored order, so letting Ionic move the node as well would apply the drop
   * twice.
   */
  reorder(event: ReorderEndCustomEvent): void {
    const { from, to } = event.detail;
    event.detail.complete(false);
    this.#deck.reorder(
      moveEntry(
        this.entries().map((entry) => entry.id),
        from,
        to
      )
    );
  }

  constructor() {
    addIcons({ settingsOutline });
  }
}
