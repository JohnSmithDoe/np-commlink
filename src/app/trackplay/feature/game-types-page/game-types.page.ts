import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonLabel,
  IonList,
  ModalController,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { IGameType } from '../../model';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { TrackplayFacade } from '../../data';
import { DEFAULT_GAME_TYPE_ID } from '../../util/trackplay.factory';
import { TrackplayGameTypeEditDialogComponent } from '../../smart-ui/game-type-edit-dialog/game-type-edit-dialog.component';
import { TrackplayGameTypeListItemComponent } from '../../ui/game-type-list-item/game-type-list-item.component';

/** Game types (Spielarten) manager: list + create/edit dialog. */
@Component({
  selector: 'app-trackplay-game-types-page',
  templateUrl: './game-types.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonList,
    IonButton,
    IonIcon,
    IonLabel,
    TranslateModule,
    PageHeaderComponent,
    TrackplayGameTypeListItemComponent,
  ],
})
export class TrackplayGameTypesPage implements ViewWillEnter {
  readonly #facade = inject(TrackplayFacade);
  readonly #modalCtrl = inject(ModalController);

  readonly rxTypes = this.#facade.gameTypeList;
  readonly defaultTypeId = DEFAULT_GAME_TYPE_ID;

  constructor() {
    addIcons({ add });
  }

  ionViewWillEnter(): void {
    this.#facade.enterGameTypesPage();
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
    const modal = await this.#modalCtrl.create({
      component: TrackplayGameTypeEditDialogComponent,
      componentProps: { gameTypeId },
    });
    await modal.present();
  }
}
