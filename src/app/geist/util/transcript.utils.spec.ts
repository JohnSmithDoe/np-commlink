import { IGeistTurn } from '../model/geist.types';
import {
  appendAnswerChunk,
  isFollowingTail,
  noteForStreamError,
  patchTurn,
} from './transcript.utils';

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

  describe('noteForStreamError', () => {
    it('reads a user abort as a stop, not a failure', () => {
      const aborted = new DOMException('stopped', 'AbortError');

      expect(noteForStreamError(aborted)).toBe('geist.note.aborted');
    });

    it('reads anything else as the geist going silent', () => {
      expect(noteForStreamError(new Error('model exploded'))).toBe(
        'geist.note.failed'
      );
      expect(noteForStreamError('not even an error')).toBe('geist.note.failed');
    });
  });

  describe('isFollowingTail', () => {
    it('follows a view parked at the bottom', () => {
      expect(
        isFollowingTail({
          scrollTop: 400,
          scrollHeight: 600,
          clientHeight: 200,
        })
      ).toBe(true);
    });

    it('still follows one chunk‘s worth of drift, which is all a render hook can see', () => {
      expect(
        isFollowingTail({
          scrollTop: 340,
          scrollHeight: 600,
          clientHeight: 200,
        })
      ).toBe(true);
    });

    it('leaves a reader who scrolled up alone', () => {
      expect(
        isFollowingTail({ scrollTop: 0, scrollHeight: 600, clientHeight: 200 })
      ).toBe(false);
    });
  });
});
