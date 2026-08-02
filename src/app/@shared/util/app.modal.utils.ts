import { ModalController, ModalOptions } from '@ionic/angular/standalone';

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
