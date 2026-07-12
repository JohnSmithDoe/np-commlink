import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonLabel,
  IonList,
  ModalController,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { IGameType, IonViewWillEnter } from '../../../@shared/types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { TrackplayActions } from '../../data/trackplay.actions';
import { selectGameTypeList } from '../../data/trackplay.selector';
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
export class TrackplayGameTypesPage implements IonViewWillEnter {
  readonly #store = inject(Store);
  readonly #modalCtrl = inject(ModalController);

  readonly rxTypes = this.#store.selectSignal(selectGameTypeList);
  readonly defaultTypeId = DEFAULT_GAME_TYPE_ID;

  constructor() {
    addIcons({ add });
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(TrackplayActions.enterGameTypesPage());
  }

  openCreate(): void {
    void this.#openDialog();
  }

  openEdit(type: IGameType): void {
    void this.#openDialog(type.id);
  }

  deleteType(type: IGameType): void {
    this.#store.dispatch(TrackplayActions.deleteGameType(type));
  }

  async #openDialog(gameTypeId?: string): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: TrackplayGameTypeEditDialogComponent,
      componentProps: { gameTypeId },
    });
    await modal.present();
  }
}
