import { formatEur } from '../../@shared/util/formatting/money-format.utils';
import { Skin } from '../../@shared/model/app.types';

export function currencyLabel(
  skin: Skin,
  euros: number,
  locale?: string
): string {
  return skin === 'cyberpunk'
    ? `¥ ${euros} nyen`
    : formatEur(euros * 100, locale);
}
