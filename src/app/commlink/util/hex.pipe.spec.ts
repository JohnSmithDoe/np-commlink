import { HexPipe } from './hex.pipe';

// No injection context needed: the transform is pure arithmetic on the index.
describe('HexPipe', () => {
  const pipe = new HexPipe();

  // The slot address is 1-based, so the top tile reads 0x01 rather than 0x00 —
  // the one user-visible claim the deck's docs make about it.
  it('numbers slots from one, not from zero', () => {
    expect(pipe.transform(0)).toBe('0x01');
    expect(pipe.transform(1)).toBe('0x02');
  });

  it('pads to two digits and uppercases the hex', () => {
    expect(pipe.transform(8)).toBe('0x09');
    expect(pipe.transform(9)).toBe('0x0A');
    expect(pipe.transform(14)).toBe('0x0F');
  });

  // The grid is 13 slots today, so this is past the end — but the address
  // follows the slot, and nothing clamps the catalogue's length.
  it('grows past two digits rather than truncating', () => {
    expect(pipe.transform(15)).toBe('0x10');
    expect(pipe.transform(254)).toBe('0xFF');
    expect(pipe.transform(255)).toBe('0x100');
  });
});
