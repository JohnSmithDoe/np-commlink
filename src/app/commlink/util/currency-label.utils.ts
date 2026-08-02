import { formatEur } from '../../@shared/util/formatting/money-format.utils';
import { Theme } from '../../@shared/model/app.types';

export function currencyLabel(
  theme: Theme,
  euros: number,
  locale?: string
): string {
  return theme === 'cyberpunk'
    ? `¥ ${euros} nyen`
    : formatEur(euros * 100, locale);
}
