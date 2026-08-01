import { ModalController } from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { presentModal } from '../../@shared/util/app.modal.utils';
import { TrackplayGameEditModalComponent } from './game-edit-modal/game-edit-modal.component';
import { TID } from '../model/trackplay.types';

/**
 * Present the game create/edit dialog. Both entry points — the games list and a
 * player's page — opened it with a byte-identical private method, each re-stating
 * the aria-label↔title pairing `presentModal` makes mandatory, so a retitled
 * dialog could end up announced by its old name on whichever page nobody edited.
 *
 * A plain function rather than a service because `presentModal` takes its
 * controller as an argument for exactly this reason. It lives in `feature/` and
 * not in `util/` because it names a `feature` component: `type:util` may only
 * reach `model`, while this file is inside the `trackplay/feature` module and so
 * crosses no Sheriff boundary at all.
 */
export const presentGameDialog = (
  modalCtrl: ModalController,
  translate: TranslateService,
  properties: { gameId?: TID; presetPlayerIds?: TID[] } = {}
): Promise<void> =>
  presentModal(
    modalCtrl,
    TrackplayGameEditModalComponent,
    translate.instant(marker('page-title.trackplay-game')),
    properties
  );
