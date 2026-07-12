import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a game score with de-DE thousands separators (e.g. 12345 -> "12.345").
 * Replaces the legacy npTrackplay `score.pipe`. Falsy / non-finite values render
 * as "0". Used in templates as `{{ score | score }}`.
 */
@Pipe({ name: 'score' })
export class ScorePipe implements PipeTransform {
  readonly #formatter = new Intl.NumberFormat('de-DE');

  transform(value: number | null | undefined): string {
    if (!value || !Number.isFinite(value)) {
      return '0';
    }
    return this.#formatter.format(value);
  }
}
