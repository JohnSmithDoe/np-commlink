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
  constructor(
    readonly reason: EvalFailure,
    options?: ErrorOptions
  ) {
    super(reason, options);
    this.name = 'BailError';
  }
}

const charAt = (source: string, index: number): string => {
  const raw = source.charAt(index);
  return NORMALISED[raw] ?? raw;
};

const digitsAt = (source: string, start: number): string => {
  let digits = '';
  for (let index = start; index < source.length; index += 1) {
    const next = charAt(source, index);
    if (!/[0-9.]/.test(next)) return digits;
    digits += next;
  }
  return digits;
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
      const digits = digitsAt(source, index);
      index += digits.length;
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

  const isEat = (symbol: string): boolean => {
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
    if (isEat('(')) return closed(expression());
    throw new BailError('syntax');
  };

  const closed = (value: number): number => {
    if (!peek()) throw new BailError('incomplete');
    if (!isEat(')')) throw new BailError('syntax');
    return value;
  };

  const finished = (value: number): number => {
    if (cursor < tokens.length) throw new BailError('syntax');
    return value;
  };

  const unary = (): number => {
    if (isEat('-')) return -unary();
    return isEat('+') ? unary() : primary();
  };

  const term = (): number => {
    let value = unary();
    for (;;) {
      if (isEat('*')) {
        value *= unary();
      } else if (isEat('/')) {
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
      if (isEat('+')) value += term();
      else if (isEat('-')) value -= term();
      else return value;
    }
  };

  return finished(expression());
};

const settled = (value: number): EvalResult => {
  return Number.isFinite(value)
    ? { ok: true, value }
    : { ok: false, reason: 'not-finite' };
};

export const evaluateExpression = (source: string): EvalResult => {
  if (!source.trim()) return { ok: false, reason: 'empty' };

  try {
    return settled(parse(tokenize(source)));
  } catch (error) {
    if (error instanceof BailError) return { ok: false, reason: error.reason };
    throw error;
  }
};
