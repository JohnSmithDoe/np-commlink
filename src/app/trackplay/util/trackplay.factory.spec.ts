import {
  createGame,
  createGameType,
  createPlayer,
  createRound,
} from './trackplay.factory';
import { gameTypeIdOf } from './game-type.utils';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('trackplay.factory', () => {
  describe('createRound', () => {
    it('scores nothing, so an untouched cell stays empty', () => {
      expect(createRound('r3').values).toEqual({});
    });

    it('takes its id rather than minting one', () => {
      expect(createRound('r0').id).toBe('r0');
    });
  });

  describe('createPlayer', () => {
    it('trims the name and mints an id and a stamp', () => {
      const player = createPlayer('  Bob  ');
      expect(player.name).toBe('Bob');
      expect(player.id).toMatch(UUID);
      expect(player.createdAt).toBeTruthy();
    });
  });

  describe('createGame', () => {
    it('defaults type/players/rounds/ended and trims the name', () => {
      const game = createGame('  Skat Night  ');
      expect(game.name).toBe('Skat Night');
      expect(gameTypeIdOf(game)).toBe('default');
      expect(game.playerIds).toEqual([]);
      expect(game.rounds).toEqual([]);
      expect(game.ended).toBe(false);
    });

    it('passes through an explicit type and players', () => {
      const game = createGame('G', 'skat', ['p1']);
      expect(gameTypeIdOf(game)).toBe('skat');
      expect(game.playerIds).toEqual(['p1']);
    });
  });

  describe('createGameType', () => {
    it('trims the name and carries winHigh', () => {
      const type = createGameType('  Rommé  ', false);
      expect(type.name).toBe('Rommé');
      expect(type.winHigh).toBe(false);
      expect(type.id).toMatch(UUID);
    });
  });

  it('mints a distinct uuid per createGame call — the one factory still minting', () => {
    const a = createGame('a');
    expect(a.id).toMatch(UUID);
    expect(a.id).not.toBe(createGame('b').id);
  });
});
