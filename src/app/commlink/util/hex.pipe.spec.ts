import { HexPipe } from './hex.pipe';

describe('HexPipe', () => {
  const pipe = new HexPipe();

  it('numbers slots from one, not from zero', () => {
    expect(pipe.transform(0)).toBe('0x01');
    expect(pipe.transform(1)).toBe('0x02');
  });

  it('pads to two digits and uppercases the hex', () => {
    expect(pipe.transform(8)).toBe('0x09');
    expect(pipe.transform(9)).toBe('0x0A');
    expect(pipe.transform(14)).toBe('0x0F');
  });

  it('grows past two digits rather than truncating', () => {
    expect(pipe.transform(15)).toBe('0x10');
    expect(pipe.transform(254)).toBe('0xFF');
    expect(pipe.transform(255)).toBe('0x100');
  });
});
