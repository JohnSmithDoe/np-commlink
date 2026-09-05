import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { BoardField, BoardFigure, BoardLayout } from '../../model/board.types';
import { TrackplayId } from '../../model/trackplay.types';

interface PlacedFigure extends BoardFigure {
  x: number;
  y: number;
}

@Component({
  selector: 'app-trackplay-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  readonly layout = input.required<BoardLayout>();
  readonly label = input.required<string>();
  readonly figures = input<readonly BoardFigure[]>([]);
  readonly picking = input(false);

  readonly fieldPicked = output<TrackplayId>();

  protected readonly figureRadius = computed<number>(
    () => this.layout().radius * 0.62
  );

  protected readonly placed = computed<PlacedFigure[]>(() => {
    const spots = new Map(
      this.layout().fields.map((field) => [field.id, field])
    );

    return this.figures().flatMap((figure) => {
      const field = spots.get(figure.fieldId);
      return field ? [{ ...figure, x: field.x, y: field.y }] : [];
    });
  });

  protected cellClass(field: BoardField): string {
    const kind = `board__cell board__cell--${field.kind}`;
    return field.player === null
      ? kind
      : `${kind} board__cell--p${field.player}`;
  }

  protected pick(field: BoardField): void {
    if (this.picking()) this.fieldPicked.emit(field.id);
  }
}
