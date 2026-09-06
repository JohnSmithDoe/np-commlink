import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'app-split-bar',
  templateUrl: './split-bar.component.html',
  styleUrl: './split-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class SplitBarComponent {
  readonly major = input.required<number>();
  readonly minor = input.required<number>();
  readonly label = input.required<string>();

  readonly parts = computed(() => [this.major(), this.minor()]);
}
