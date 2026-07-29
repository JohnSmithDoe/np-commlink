import { ModalController, ModalOptions } from '@ionic/angular/standalone';

/**
 * Create and present in one step. Every imperatively-presented dialog in the app
 * does exactly these two awaits, and splitting them across two statements is an
 * easy place to drop the second one — which silently never shows the modal.
 *
 * Takes the controller rather than injecting it, so it stays a plain function
 * usable from the `type:util` layer.
 *
 * `ariaLabel` is **required and already translated**: `ion-modal` puts
 * `role="dialog"` on a shadow wrapper and derives no name at all, and
 * `htmlAttributes` is the only seam a controller-presented overlay has for one
 * (docs/ionic-a11y-practices.md R4). Callers pass the *same* key their dialog's
 * `ion-title` renders, so the name a screen reader announces and the heading a
 * sighted user reads cannot drift apart. Required rather than optional because a
 * forgotten label should be a compile error, not a silently nameless dialog.
 */
export const presentModal = async (
  modalCtrl: ModalController,
  component: ModalOptions['component'],
  ariaLabel: string,
  componentProps?: ModalOptions['componentProps']
): Promise<void> => {
  const modal = await modalCtrl.create({
    component,
    componentProps,
    htmlAttributes: { 'aria-label': ariaLabel },
  });
  await modal.present();
};
