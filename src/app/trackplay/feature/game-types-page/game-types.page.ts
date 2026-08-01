import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonLabel,
  IonList,
  ModalController,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { IGameType } from '../../model/trackplay.types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { TrackplayFacade } from '../../data';
import { DEFAULT_GAME_TYPE_ID } from '../../util/trackplay.factory';
import { TrackplayGameTypeEditModalComponent } from '../game-type-edit-modal/game-type-edit-modal.component';
import { TrackplayGameTypeListItemComponent } from '../../ui/game-type-list-item/game-type-list-item.component';
import { presentModal } from '../../../@shared/util/app.modal.utils';

/** Game types (Spielarten) manager: list + create/edit dialog. */
@Component({
  selector: 'app-page-trackplay-game-types',
  templateUrl: './game-types.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonList,
    IonButton,
    IonIcon,
    IonLabel,
    TranslatePipe,
    PageHeaderComponent,
    TrackplayGameTypeListItemComponent,
  ],
})
export class TrackplayGameTypesPage {
  readonly #facade = inject(TrackplayFacade);
  readonly #modalCtrl = inject(ModalController);
  readonly #translate = inject(TranslateService);

  readonly rxTypes = this.#facade.gameTypeList;
  readonly defaultTypeId = DEFAULT_GAME_TYPE_ID;

  constructor() {
    addIcons({ add });
  }

  openCreate(): void {
    void this.#openDialog();
  }

  openEdit(type: IGameType): void {
    void this.#openDialog(type.id);
  }

  deleteType(type: IGameType): void {
    this.#facade.deleteGameType(type);
  }

  async #openDialog(gameTypeId?: string): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      TrackplayGameTypeEditModalComponent,
      this.#translate.instant(marker('trackplay.label.game-type')),
      { gameTypeId }
    );
  }
}
