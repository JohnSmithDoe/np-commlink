import {
  createGame,
  createGameType,
  createPlayer,
  createRound,
} from './trackplay.factory';

describe('trackplay.factory', () => {
  describe('createRound', () => {
    it('seeds every player at 0 and records the index', () => {
      const round = createRound(3, ['p1', 'p2']);
      expect(round.values).toEqual({ p1: 0, p2: 0 });
      expect(round.idx).toBe(3);
      expect(round.name).toBe('round 3');
    });

    it('produces an empty values map with no players', () => {
      expect(createRound(0, []).values).toEqual({});
    });
  });

  describe('createPlayer', () => {
    it('trims the name and assigns an id', () => {
      const player = createPlayer('  Bob  ');
      expect(player.name).toBe('Bob');
      expect(player.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('createGame', () => {
    it('defaults type/players/rounds/ended and trims the name', () => {
      const game = createGame('  Skat Night  ');
      expect(game.name).toBe('Skat Night');
      expect(game.type).toBe('default');
      expect(game.players).toEqual([]);
      expect(game.rounds).toEqual([]);
      expect(game.ended).toBe(false);
    });

    it('passes through an explicit type and players', () => {
      const game = createGame('G', 'skat', ['p1']);
      expect(game.type).toBe('skat');
      expect(game.players).toEqual(['p1']);
    });
  });

  describe('createGameType', () => {
    it('trims the name and carries winHigh', () => {
      const type = createGameType('  Rommé  ', false);
      expect(type.name).toBe('Rommé');
      expect(type.winHigh).toBe(false);
    });
  });

  it('mints distinct ids across factory calls', () => {
    expect(createPlayer('a').id).not.toBe(createPlayer('b').id);
  });
});
