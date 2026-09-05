import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  BoardFieldId,
  BoardFigure,
  BoardPlayerCount,
  BoardRules,
} from '../../model/board.types';

export const BoardActions = createActionGroup({
  source: 'Trackplay Board',
  events: {
    seatPlayers: (players: BoardPlayerCount) => ({ players }),
    placeOn: (fieldId: BoardFieldId) => ({ fieldId }),
    placeNextAtHome: emptyProps(),
    moveFigure: (from: BoardFieldId, pips: number) => ({ from, pips }),
    loadSetting: (
      players: BoardPlayerCount,
      figures: readonly BoardFigure[]
    ) => ({
      players,
      figures,
    }),
    setRules: (rules: Partial<BoardRules>) => ({ rules }),
    takeBack: emptyProps(),
    clearBoard: emptyProps(),
  },
});
