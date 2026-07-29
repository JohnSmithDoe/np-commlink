import { Dayjs } from 'dayjs';

export type TSettings = {
  showCorners: boolean; // Minuten werden in den Ecken angezeigt
  deZwanzigNach: boolean; // ZWANZIG NACH ... ZEHN VOR HALB
  deZwanzigVor: boolean; // ZWANZIG VOR ... ZEHN NACH HALB
  deDreiviertel: boolean; // DREIVIERTEL ... VIERTEL VOR
};

export type Corners = {
  topLeft: boolean;
  topRight: boolean;
  botLeft: boolean;
  botRight: boolean;
};
export type ActiveWord = { word: string; row: number };
export type ClockFace = { corners: Corners; activeWords: ActiveWord[] };

const W_ES = 'ES';
const W_IST = 'IST';
const W_FUENF = 'FÜNF';
const W_ZWANZIG = 'ZWANZIG';
const W_ZEHN = 'ZEHN';

const W_VIERTEL = 'VIERTEL';
const W_VOR = 'VOR';
const W_HALB = 'HALB';
const W_NACH = 'NACH';
const W_NEUN = 'NEUN';

const W_EIN = 'EIN';
const W_EINS = 'EINS';
const W_ELF = 'ELF';
const W_ZWEI = 'ZWEI';
const W_DREI = 'DREI';
const W_VIER = 'VIER';
const W_SECHS = 'SECHS';
const W_ACHT = 'ACHT';
const W_SIEBEN = 'SIEBEN';
const W_ZWOELF = 'ZWÖLF';
const W_UHR = 'UHR';

// FÜNF, ZEHN and DREI each appear twice in the grid — the minute phrase means
// the upper occurrence, the hour word the lower one, so those words must pin
// their row (see `isWordActive`).
const ROW_FUENF_TOP = 0;
const ROW_FUENF_BOTTOM = 4;
const ROW_ZEHN_TOP = 1;
const ROW_ZEHN_BOTTOM = 9;
const ROW_DREI_TOP = 2;
const ROW_DREI_BOTTOM = 6;
const ROW_VIER = 6;

// The physical letter grid — one string per row, read left-to-right.
export const GRID: readonly string[] = [
  'ESKISTAFÜNF',
  'ZEHNZWANZIG',
  'DREIVIERTEL',
  'VORUNKTNACH',
  'HALBAELFÜNF',
  'EINSXAMZWEI',
  'DREIAUJVIER',
  'SECHSNLACHT',
  'SIEBENZWÖLF',
  'ZEHNEUNKUHR',
];

// The clock only changes every five minutes, but ticking twice a minute
// keeps the corner dots and the 5-minute rollover promptly in sync.
export const TICK_MS = 30_000;

type DialPosition = { hour: number; minute: number; corners: Corners };

const activeWord = (word: string, row = -1): ActiveWord => ({ word, row });

const darkCorners = (): Corners => ({
  topLeft: false,
  topRight: false,
  botLeft: false,
  botRight: false,
});

const cornerDotsFor = (minute: number): Corners => {
  const minutesIntoFiveStep = minute % 5;
  return {
    topLeft: minutesIntoFiveStep >= 1,
    topRight: minutesIntoFiveStep >= 2,
    botLeft: minutesIntoFiveStep >= 4,
    botRight: minutesIntoFiveStep >= 3,
  };
};

// Corner mode floors to the last five-minute step and shows the remainder as
// dots; without corners the face rounds to the nearest step instead, which at
// :58/:59 tips into the next hour.
const readDialPosition = (now: Dayjs, config?: TSettings): DialPosition => {
  const hour = now.hour() % 12;
  const minute = now.minute();
  if (config?.showCorners) {
    return {
      hour,
      minute: (Math.floor(minute / 5) * 5) % 60,
      corners: cornerDotsFor(minute),
    };
  }
  const rounded = Math.round(minute / 5) * 5;
  return {
    hour: rounded === 60 ? hour + 1 : hour,
    minute: rounded % 60,
    corners: darkCorners(),
  };
};

// From 20 past, German names the hour it is heading towards ("zehn vor halb
// neun" is 20:20) — except the "zwanzig nach" variant, which still names the
// current one.
const namesTheNextHour = (minute: number, config?: TSettings): boolean =>
  minute >= 20 && minute <= 55 && !(minute === 20 && config?.deZwanzigNach);

// prettier-ignore
const minuteWords = (minute: number, config?: TSettings): ActiveWord[] => {
  switch (minute) {
    case 0: { return [activeWord(W_UHR)]; }
    case 5: { return [activeWord(W_FUENF, ROW_FUENF_TOP), activeWord(W_NACH)]; }
    case 10: { return [activeWord(W_ZEHN, ROW_ZEHN_TOP), activeWord(W_NACH)]; }
    case 15: { return [activeWord(W_VIERTEL), activeWord(W_NACH)]; }
    case 20: { return config?.deZwanzigNach
      ? [activeWord(W_ZWANZIG), activeWord(W_NACH)]
      : [activeWord(W_ZEHN, ROW_ZEHN_TOP), activeWord(W_VOR), activeWord(W_HALB)]; }
    case 25: { return [activeWord(W_FUENF, ROW_FUENF_TOP), activeWord(W_VOR), activeWord(W_HALB)]; }
    case 30: { return [activeWord(W_HALB)]; }
    case 35: { return [activeWord(W_FUENF, ROW_FUENF_TOP), activeWord(W_NACH), activeWord(W_HALB)]; }
    case 40: { return config?.deZwanzigVor
      ? [activeWord(W_ZWANZIG), activeWord(W_VOR)]
      : [activeWord(W_ZEHN, ROW_ZEHN_TOP), activeWord(W_NACH), activeWord(W_HALB)]; }
    case 45: { return config?.deDreiviertel
      ? [activeWord(W_DREI, ROW_DREI_TOP), activeWord(W_VIERTEL)]
      : [activeWord(W_VIERTEL), activeWord(W_VOR)]; }
    case 50: { return [activeWord(W_ZEHN, ROW_ZEHN_TOP), activeWord(W_VOR)]; }
    case 55: { return [activeWord(W_FUENF, ROW_FUENF_TOP), activeWord(W_VOR)]; }
    default: { return []; }
  }
};

// prettier-ignore
const hourWords = (hour: number, minute: number): ActiveWord[] => {
  switch (hour) {
    case 0: { return [activeWord(W_ZWOELF)]; }
    case 1: { return [activeWord(minute === 0 ? W_EIN : W_EINS)]; }
    case 2: { return [activeWord(W_ZWEI)]; }
    case 3: { return [activeWord(W_DREI, ROW_DREI_BOTTOM)]; }
    case 4: { return [activeWord(W_VIER, ROW_VIER)]; }
    case 5: { return [activeWord(W_FUENF, ROW_FUENF_BOTTOM)]; }
    case 6: { return [activeWord(W_SECHS)]; }
    case 7: { return [activeWord(W_SIEBEN)]; }
    case 8: { return [activeWord(W_ACHT)]; }
    case 9: { return [activeWord(W_NEUN)]; }
    case 10: { return [activeWord(W_ZEHN, ROW_ZEHN_BOTTOM)]; }
    case 11: { return [activeWord(W_ELF)]; }
    default: { return []; }
  }
};

/**
 * Which words light up (and which corner dots) for a given wall-clock time.
 * Pure: same time + settings → same face, so it slots straight into a
 * computed signal without touching component state.
 */
export function computeFace(
  now: Dayjs,
  config: TSettings | undefined
): ClockFace {
  const { hour, minute, corners } = readDialPosition(now, config);
  const spokenHour = (hour + (namesTheNextHour(minute, config) ? 1 : 0)) % 12;
  return {
    corners,
    activeWords: [
      activeWord(W_ES),
      activeWord(W_IST),
      ...minuteWords(minute, config),
      ...hourWords(spokenHour, minute),
    ],
  };
}

/**
 * Whether the letter at (rowIdx, colIdx) belongs to one of the currently
 * active words. Pure counterpart of the component's `isActive` template hook:
 * a word matches only inside its span on the row, and — when it pins a row
 * (`row >= 0`) — only on that row (the grid repeats words like FÜNF/ZEHN).
 */
export function isWordActive(
  activeWords: ActiveWord[],
  row: string[],
  col: string,
  colIndex: number,
  rowIndex: number
): boolean {
  const all = row.join('');
  return activeWords.some((itm) => {
    const charIndexOfWord = itm.word.indexOf(col);
    const wordIndexOfRow = all.indexOf(itm.word);
    const wordEndIndexOfRow = wordIndexOfRow + itm.word.length - 1;
    return (
      wordIndexOfRow >= 0 &&
      charIndexOfWord !== -1 &&
      colIndex >= wordIndexOfRow &&
      colIndex <= wordEndIndexOfRow &&
      (itm.row < 0 || itm.row === rowIndex)
    );
  });
}
