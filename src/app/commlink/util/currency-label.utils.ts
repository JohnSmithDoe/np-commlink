import { formatEur } from '../../@shared/util/money.utils';
import { TTheme } from '../../@shared/model/app.types';

/**
 * A telemetry balance (whole euros) as the deck would read it: cyberpunk's
 * "nyen" flavor, or the real euro amount for the plain theme. Stays in
 * `commlink/util` rather than `@shared` — only this domain needs it.
 */
export function currencyLabel(theme: TTheme, euros: number): string {
  return theme === 'cyberpunk' ? `¥ ${euros} nyen` : formatEur(euros * 100);
}
