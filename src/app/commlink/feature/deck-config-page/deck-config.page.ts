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
import { AppModule, DeckEntryId } from '../../model/deck.types';
import { reorderedIds } from '../../../@shared/util/app.utils';

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

  toggleModule(module: AppModule): void {
    this.#deck.toggleModule(module);
  }

  toggleEntry(id: DeckEntryId): void {
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
