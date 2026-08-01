import { PopoverController } from '@ionic/angular/standalone';
import {
  TrackplayListSettingsPopoverComponent,
  TSettingsMode,
} from '../smart-ui/list-settings-popover/list-settings-popover.component';

/**
 * Present the sort/filter popover for one of the three trackplay lists. All three
 * entry points had a byte-identical private method differing only in the mode
 * string, each re-stating that `event` must be forwarded for the popover to
 * anchor to its button — so a change to the presentation contract would land in
 * two of the three pages.
 *
 * A plain function taking its controller, for the same reason `presentModal` and
 * `presentGameDialog` do; it lives in `feature/` because it names a `smart-ui`
 * component, which `type:util` may not reach.
 */
export const presentListSettings = async (
  popoverCtrl: PopoverController,
  mode: TSettingsMode,
  event: Event
): Promise<void> => {
  const popover = await popoverCtrl.create({
    component: TrackplayListSettingsPopoverComponent,
    componentProps: { mode },
    event,
  });
  await popover.present();
};
