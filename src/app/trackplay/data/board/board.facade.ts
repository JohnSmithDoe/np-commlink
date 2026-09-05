import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BoardFieldId,
  BoardFigure,
  BoardPlayerCount,
  BoardRules,
} from '../../model/board.types';
import { BoardActions } from './board.actions';
import {
  selectBoardFigures,
  selectBoardLayout,
  selectBoardNotation,
  selectBoardPlayers,
  selectBoardRules,
  selectFigureTotal,
  selectNextFigure,
} from './board.selector';

@Injectable({ providedIn: 'root' })
export class BoardFacade {
  readonly #store = inject(Store);

  readonly players = this.#store.selectSignal(selectBoardPlayers);
  readonly figures = this.#store.selectSignal(selectBoardFigures);
  readonly rules = this.#store.selectSignal(selectBoardRules);
  readonly layout = this.#store.selectSignal(selectBoardLayout);
  readonly total = this.#store.selectSignal(selectFigureTotal);
  readonly next = this.#store.selectSignal(selectNextFigure);
  readonly notation = this.#store.selectSignal(selectBoardNotation);

  seatPlayers(players: BoardPlayerCount): void {
    this.#store.dispatch(BoardActions.seatPlayers(players));
  }

  placeOn(fieldId: BoardFieldId): void {
    this.#store.dispatch(BoardActions.placeOn(fieldId));
  }

  placeNextAtHome(): void {
    this.#store.dispatch(BoardActions.placeNextAtHome());
  }

  moveFigure(from: BoardFieldId, pips: number): void {
    this.#store.dispatch(BoardActions.moveFigure(from, pips));
  }

  loadSetting(
    players: BoardPlayerCount,
    figures: readonly BoardFigure[]
  ): void {
    this.#store.dispatch(BoardActions.loadSetting(players, figures));
  }

  setRules(rules: Partial<BoardRules>): void {
    this.#store.dispatch(BoardActions.setRules(rules));
  }

  takeBack(): void {
    this.#store.dispatch(BoardActions.takeBack());
  }

  clearBoard(): void {
    this.#store.dispatch(BoardActions.clearBoard());
  }
}
