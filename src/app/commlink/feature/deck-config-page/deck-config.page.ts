import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonReorder,
  IonReorderGroup,
  IonSegment,
  IonSegmentButton,
  IonToggle,
  ReorderEndCustomEvent,
} from '@ionic/angular/standalone';
import { NgTemplateOutlet } from '@angular/common';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { Marker } from '../../../@shared/model/app.types';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { DeckFacade } from '../../data';
import { AppModule, DeckEntryId } from '../../model/deck.types';
import { reorderedIds } from '../../../@shared/util/app.utils';

const LENSES = ['programs', 'order'] as const;
type DeckConfigLens = (typeof LENSES)[number];

const LENS_LABEL_KEYS: Record<DeckConfigLens, Marker> = {
  programs: marker('deck.config.lens.programs'),
  order: marker('deck.config.lens.order'),
};

@Component({
  selector: 'app-page-deck-config',
  templateUrl: './deck-config.page.html',
  styleUrls: ['./deck-config.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    IonAccordion,
    IonAccordionGroup,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    IonReorder,
    IonReorderGroup,
    TranslatePipe,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
})
export class DeckConfigPage {
  readonly #deck = inject(DeckFacade);

  readonly lenses = LENSES;
  readonly lensLabelKeys = LENS_LABEL_KEYS;
  readonly lens = signal<DeckConfigLens>('programs');

  readonly shown = this.#deck.orderedPrograms;
  readonly modules = this.#deck.configuredModules;
  readonly hasCustomConfig = this.#deck.hasCustomConfig;

  selectLens(lens: string): void {
    this.lens.set(lens as DeckConfigLens);
  }

  toggleEntry(id: DeckEntryId): void {
    this.#deck.toggleEntry(id);
  }

  toggleModule(module: AppModule): void {
    this.#deck.toggleModule(module);
  }

  reset(): void {
    this.#deck.reset();
  }

  reorder(event: ReorderEndCustomEvent): void {
    this.#deck.reorderShown(reorderedIds(event, this.shown()));
  }

  constructor() {
    addIcons({ settingsOutline });
  }
}
