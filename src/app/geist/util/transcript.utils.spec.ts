import { IGeistTurn } from '../model/geist.types';
import { appendAnswerChunk, patchTurn } from './transcript.utils';

const turn = (overrides: Partial<IGeistTurn> = {}): IGeistTurn => ({
  id: 1,
  query: 'wer ist Mr. Johnson?',
  answer: '',
  streaming: true,
  note: null,
  ...overrides,
});

describe('geist transcript utils', () => {
  describe('appendAnswerChunk', () => {
    it('concatenates streamed chunks in arrival order', () => {
      const once = appendAnswerChunk([turn()], 1, 'Ein ');
      const twice = appendAnswerChunk(once, 1, 'Mittelsmann.');

      expect(twice[0].answer).toBe('Ein Mittelsmann.');
    });

    it('leaves sibling turns untouched', () => {
      const turns = [turn({ id: 1 }), turn({ id: 2, answer: 'alt' })];

      const result = appendAnswerChunk(turns, 1, 'neu');

      expect(result[1].answer).toBe('alt');
    });

    it('ignores a chunk for a turn that was purged mid-stream', () => {
      expect(appendAnswerChunk([], 1, 'verwaist')).toEqual([]);
    });
  });

  describe('patchTurn', () => {
    it('settles the addressed turn without mutating the input', () => {
      const turns = [turn()];

      const result = patchTurn(turns, 1, { streaming: false, note: 'x' });

      expect(result[0]).toEqual(
        expect.objectContaining({ streaming: false, note: 'x' })
      );
      expect(turns[0].streaming).toBe(true);
    });

    it('ignores an unknown id', () => {
      const turns = [turn({ id: 1 })];

      expect(patchTurn(turns, 99, { streaming: false })).toEqual(turns);
    });
  });
});
