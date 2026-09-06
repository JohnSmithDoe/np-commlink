/* ─── why ─────────────────────────────────────────────────────────
 * `incomplete` and `syntax` are separate because the result line is live. An
 * expression that has simply not been finished yet — `12*(3+` — is the normal
 * state of every keystroke before the last one, and reporting it as an error
 * paints red through the whole act of typing. Running out of input where a
 * primary or a `)` was expected is `incomplete`; a token that is actually
 * there and wrong is `syntax`, and only that one is worth showing.
 *
 * Division tests the right operand for zero rather than the result for
 * Infinity, so `0/0` answers `divide-by-zero` instead of `not-finite`.
 * ───────────────────────────────────────────────────────────────── */
type EvalFailure =
  'empty' | 'incomplete' | 'syntax' | 'divide-by-zero' | 'not-finite';

type EvalResult =
  { ok: true; value: number } | { ok: false; reason: EvalFailure };

type Token =
  { kind: 'number'; value: number } | { kind: 'symbol'; value: string };

const OPERATORS = '+-*/()';
const NORMALISED: Record<string, string> = {
  '×': '*',
  '·': '*',
  '÷': '/',
  '−': '-',
  '–': '-',
  ',': '.',
};

class BailError extends Error {
  constructor(readonly reason: EvalFailure) {
    super(reason);
    this.name = 'BailError';
  }
}

const charAt = (source: string, index: number): string => {
  const raw = source.charAt(index);
  return NORMALISED[raw] ?? raw;
};

const tokenize = (source: string): Token[] => {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = charAt(source, index);

    if (char === ' ' || char === '\t') {
      index += 1;
    } else if (OPERATORS.includes(char)) {
      tokens.push({ kind: 'symbol', value: char });
      index += 1;
    } else if (/[0-9.]/.test(char)) {
      let digits = '';
      while (index < source.length) {
        const next = charAt(source, index);
        if (!/[0-9.]/.test(next)) break;
        digits += next;
        index += 1;
      }
      const value = Number(digits);
      if (!Number.isFinite(value)) throw new BailError('syntax');
      tokens.push({ kind: 'number', value });
    } else {
      throw new BailError('syntax');
    }
  }

  return tokens;
};

const parse = (tokens: Token[]): number => {
  let cursor = 0;

  const peek = (): Token | undefined => tokens[cursor];

  const eat = (symbol: string): boolean => {
    const token = peek();
    if (token?.kind === 'symbol' && token.value === symbol) {
      cursor += 1;
      return true;
    }
    return false;
  };

  const primary = (): number => {
    const token = peek();
    if (!token) throw new BailError('incomplete');

    if (token.kind === 'number') {
      cursor += 1;
      return token.value;
    }
    if (eat('(')) {
      const value = expression();
      if (!peek()) throw new BailError('incomplete');
      if (!eat(')')) throw new BailError('syntax');
      return value;
    }
    throw new BailError('syntax');
  };

  const unary = (): number => {
    if (eat('-')) return -unary();
    if (eat('+')) return unary();
    return primary();
  };

  const term = (): number => {
    let value = unary();
    for (;;) {
      if (eat('*')) {
        value *= unary();
      } else if (eat('/')) {
        const divisor = unary();
        if (divisor === 0) throw new BailError('divide-by-zero');
        value /= divisor;
      } else {
        return value;
      }
    }
  };

  const expression = (): number => {
    let value = term();
    for (;;) {
      if (eat('+')) value += term();
      else if (eat('-')) value -= term();
      else return value;
    }
  };

  const value = expression();
  if (cursor < tokens.length) throw new BailError('syntax');
  return value;
};

const settled = (value: number): EvalResult =>
  Number.isFinite(value)
    ? { ok: true, value }
    : { ok: false, reason: 'not-finite' };

export const evaluateExpression = (source: string): EvalResult => {
  if (!source.trim()) return { ok: false, reason: 'empty' };

  try {
    return settled(parse(tokenize(source)));
  } catch (error) {
    if (error instanceof BailError) return { ok: false, reason: error.reason };
    throw error;
  }
};
