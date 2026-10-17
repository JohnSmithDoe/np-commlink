import { Component, input, output } from '@angular/core';
import { IonButton } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-error-fallback',
  templateUrl: './error-fallback.component.html',
  styleUrl: './error-fallback.component.scss',
  imports: [IonButton, TranslatePipe],
})
export class ErrorFallbackComponent {
  readonly reason = input<string>();
  readonly retry = output<void>();
}
