/* ─── why ─────────────────────────────────────────────────────────
 * The camt fields are looked UP on one booking and MATCHED on in bulk, and
 * neither is a column: nobody scans forty IBANs. So they disclose behind one
 * control instead of widening the row, which is also why there is one layout
 * rather than a phone one and a table one.
 *
 * Rows are built from `CAMT_DETAIL_FIELDS` and skipped when absent, so a
 * manually typed booking renders nothing and this component disappears
 * rather than showing nine empty labels.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { Marker } from '../../../@shared/model/app.types';
import {
  CAMT_DETAIL_FIELDS,
  CAMT_DETAIL_LABEL_KEYS,
  CamtDetails,
} from '../../model/transaction.types';
import { localizedDate } from '../../../@shared/util/formatting/date-format.utils';

interface DetailRow {
  labelKey: Marker;
  value: string;
}

@Component({
  selector: 'app-cash-bank-details',
  templateUrl: './bank-details.component.html',
  styleUrls: ['./bank-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonNote,
    TranslatePipe,
  ],
})
export class CashBankDetailsComponent {
  readonly details = input<CamtDetails | undefined>();

  readonly rows = computed<DetailRow[]>(() => {
    const details = this.details();
    if (!details) return [];
    return CAMT_DETAIL_FIELDS.flatMap((field) => {
      const raw = details[field];
      if (!raw) return [];
      return [
        {
          labelKey: CAMT_DETAIL_LABEL_KEYS[field],
          value: field === 'valueDateISO' ? localizedDate(raw) : raw,
        },
      ];
    });
  });
}
