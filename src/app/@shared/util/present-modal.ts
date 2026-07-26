import { ModalController, ModalOptions } from '@ionic/angular/standalone';

/**
 * Create and present in one step. Every imperatively-presented dialog in the app
 * does exactly these two awaits, and splitting them across two statements is an
 * easy place to drop the second one — which silently never shows the modal.
 *
 * Takes the controller rather than injecting it, so it stays a plain function
 * usable from the `type:util` layer.
 */
export const presentModal = async (
  modalCtrl: ModalController,
  component: ModalOptions['component'],
  componentProps?: ModalOptions['componentProps']
): Promise<void> => {
  const modal = await modalCtrl.create({ component, componentProps });
  await modal.present();
};
