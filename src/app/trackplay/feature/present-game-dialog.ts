import { ModalController } from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { presentModal } from '../../@shared/util/app.modal.utils';
import { TrackplayGameEditModalComponent } from './game-edit-modal/game-edit-modal.component';
import { TrackplayId } from '../model/trackplay.types';

export const presentGameDialog = (
  modalCtrl: ModalController,
  translate: TranslateService,
  properties: { gameId?: TrackplayId; presetPlayerIds?: TrackplayId[] } = {}
): Promise<void> =>
  presentModal(
    modalCtrl,
    TrackplayGameEditModalComponent,
    translate.instant(marker('page-title.trackplay-game')),
    properties
  );
