/* ─── why ─────────────────────────────────────────────────────────
 * This page is where three engines meet eight on-screen messages, and a
 * refusal the template has no `@case` for renders NOTHING rather than
 * failing. So every refusal a tap or a roll can produce is asserted here by
 * name — that is the claim the `@switch` depends on and nothing else checks.
 * ───────────────────────────────────────────────────────────────── */
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { BoardActions } from '../../data';
import { BoardFigure, BoardState } from '../../model/board.types';
import { buildBoard } from '../../util/board.factory';
import { placeNextAtHome } from '../../util/board.setup';
import { initialBoardState } from '../../util/trackplay.factory';
import { mockTrackplayState } from '../../testing/trackplay.test-data';
import { TrackplayBoardPage } from './board.page';

const board = buildBoard(4);

const seated = (figures: readonly BoardFigure[]): BoardState => ({
  ...initialBoardState,
  players: 4,
  figures,
});

const everyFigure = (): readonly BoardFigure[] => {
  let placed: readonly BoardFigure[] = [];
  for (let step = 0; step < board.players * board.pieces; step++) {
    placed = placeNextAtHome(board, placed);
  }
  return placed;
};

describe('TrackplayBoardPage', () => {
  let component: TrackplayBoardPage;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (boardState: BoardState = initialBoardState) => {
    TestBed.configureTestingModule({
      imports: [TrackplayBoardPage],
      providers: [
        provideTestingProviders({
          trackplay: mockTrackplayState({ board: boardState }),
        }),
      ],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(TrackplayBoardPage).componentInstance;
  };

  describe('while the board is still being set up', () => {
    it('names the refusal for a yard that belongs to somebody else', () => {
      setup();

      component.tapField('nest-1-0');

      expect(component.refused()).toBe('foreign-ground');
      expect(dispatch).not.toHaveBeenCalledWith(
        BoardActions.placeOn('nest-1-0')
      );
    });

    it('names the refusal for a field already taken', () => {
      setup(seated([{ player: 0, piece: 0, fieldId: 'track-7' }]));

      component.tapField('track-7');

      expect(component.refused()).toBe('occupied');
    });

    it('places on a free track field and clears whatever was being said', () => {
      setup();
      component.tapField('nest-1-0');

      component.tapField('track-7');

      expect(dispatch).toHaveBeenCalledWith(BoardActions.placeOn('track-7'));
      expect(component.refused()).toBeNull();
    });
  });

  describe('once every figure stands', () => {
    it('picks the field a figure is on, and lets a second tap drop it', () => {
      setup(seated(everyFigure()));

      component.tapField('nest-0-0');
      expect(component.picked()).toBe('nest-0-0');

      component.tapField('nest-0-0');
      expect(component.picked()).toBeNull();
    });

    it('ignores a tap on an empty field rather than offering a roll', () => {
      setup(seated(everyFigure()));

      component.tapField('track-7');

      expect(component.picked()).toBeNull();
    });

    it('names the refusal when the roll cannot free a figure', () => {
      setup(seated(everyFigure()));
      component.tapField('nest-0-0');

      component.moveBy(3);

      expect(component.moveRefused()).toBe('needs-six');
      expect(component.picked()).toBe('nest-0-0');
    });

    it('moves on a roll that works, and lets the field go', () => {
      setup(seated(everyFigure()));
      component.tapField('nest-0-0');

      component.moveBy(6);

      expect(dispatch).toHaveBeenCalledWith(
        BoardActions.moveFigure('nest-0-0', 6)
      );
      expect(component.picked()).toBeNull();
      expect(component.moveRefused()).toBeNull();
    });

    it('does nothing at all with no field picked', () => {
      setup(seated(everyFigure()));

      component.moveBy(6);

      expect(component.moveRefused()).toBeNull();
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('a pasted setting', () => {
    it('loads what it could read and reports what it could not', () => {
      setup();
      component.draft.set('b4 p1-p1f0 rubbish');

      component.importSetting();

      expect(dispatch).toHaveBeenCalledWith(
        BoardActions.loadSetting(4, [
          { player: 0, piece: 0, fieldId: 'start-0' },
        ])
      );
      expect(component.rejected()).toEqual(['rubbish']);
    });
  });
});
