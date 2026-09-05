import { createSelector } from '@ngrx/store';
import {
  BoardFigure,
  BoardLayout,
  BoardPlayerCount,
  BoardRules,
} from '../../model/board.types';
import { buildBoard } from '../../util/board.factory';
import { formatSetting } from '../../util/board.notation';
import { figureCount, nextFigure } from '../../util/board.setup';
import { selectBoard } from '../trackplay.selector';

export const selectBoardPlayers = createSelector(
  selectBoard,
  (board): BoardPlayerCount => board.players
);

export const selectBoardFigures = createSelector(
  selectBoard,
  (board): readonly BoardFigure[] => board.figures
);

export const selectBoardRules = createSelector(
  selectBoard,
  (board): BoardRules => board.rules
);

export const selectBoardLayout = createSelector(
  selectBoardPlayers,
  (players): BoardLayout => buildBoard(players)
);

export const selectFigureTotal = createSelector(
  selectBoardLayout,
  (layout): number => figureCount(layout)
);

export const selectNextFigure = createSelector(
  selectBoardLayout,
  selectBoardFigures,
  (layout, figures) => nextFigure(layout, figures)
);

export const selectBoardNotation = createSelector(
  selectBoardLayout,
  selectBoardFigures,
  (layout, figures): string => formatSetting(layout, figures)
);
