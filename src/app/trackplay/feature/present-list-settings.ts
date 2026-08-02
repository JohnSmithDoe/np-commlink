import { PopoverController } from '@ionic/angular/standalone';
import {
  TrackplayListSettingsPopoverComponent,
  SettingsMode,
} from '../smart-ui/list-settings-popover/list-settings-popover.component';

export const presentListSettings = async (
  popoverCtrl: PopoverController,
  mode: SettingsMode,
  event: Event
): Promise<void> => {
  const popover = await popoverCtrl.create({
    component: TrackplayListSettingsPopoverComponent,
    componentProps: { mode },
    event,
  });
  await popover.present();
};
