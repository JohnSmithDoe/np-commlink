/* ─── why ─────────────────────────────────────────────────────────
 * The four editors are hosted once, here, rather than by each page that
 * can open one. `ItemDialogService` holds a single request and any page
 * may raise any of them, so per-page hosting was a checklist six
 * templates long whose failure mode is a button that does nothing —
 * nothing to compile against, and nothing a gate can see.
 *
 * It also ends a duplicate: `ion-router-outlet` keeps visited pages
 * mounted, so three cash pages visited meant three live copies of the
 * same dialog element.
 * ───────────────────────────────────────────────────────────────── */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular/standalone';
import { EditCashAccountDialogComponent } from '../edit-cash-account-dialog/edit-cash-account-dialog.component';
import { EditCashRuleDialogComponent } from '../edit-cash-rule-dialog/edit-cash-rule-dialog.component';
import { EditCashScheduleDialogComponent } from '../edit-cash-schedule-dialog/edit-cash-schedule-dialog.component';
import { EditCashTransactionDialogComponent } from '../edit-cash-transaction-dialog/edit-cash-transaction-dialog.component';

@Component({
  selector: 'app-cash-shell',
  templateUrl: './cash-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonRouterOutlet,
    EditCashAccountDialogComponent,
    EditCashRuleDialogComponent,
    EditCashScheduleDialogComponent,
    EditCashTransactionDialogComponent,
  ],
})
export class CashShellComponent {}
