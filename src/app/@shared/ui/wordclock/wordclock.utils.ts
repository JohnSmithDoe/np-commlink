import { Dayjs } from 'dayjs';

export type TSettings = {
  targetDate: string;
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
const W_FUENF_FIRST = 0;
const W_FUENF_SECOND = 4;
const W_ZWANZIG = 'ZWANZIG';
const W_ZEHN = 'ZEHN';
const W_ZEHN_FIRST = 1;
const W_ZEHN_SECOND = 9;

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
const W_DREI_FIRST = 2;
const W_DREI_SND = 6;
const W_VIER = 'VIER';
const W_VIER_ROW = 6;
const W_SECHS = 'SECHS';
const W_ACHT = 'ACHT';
const W_SIEBEN = 'SIEBEN';
const W_ZWOELF = 'ZWÖLF';
const W_UHR = 'UHR';

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

/**
 * Which words light up (and which corner dots) for a given wall-clock time.
 * Pure: same time + settings → same face, so it slots straight into a
 * computed signal without touching component state.
 */
export function computeFace(
  now: Dayjs,
  config: TSettings | undefined
): ClockFace {
  const activeWords: ActiveWord[] = [];
  const add = (word: string, row = -1) => activeWords.push({ word, row });

  let hour = now.hour();
  let min = now.minute();
  if (hour >= 12) hour -= 12;

  const corners: Corners = {
    topLeft: false,
    topRight: false,
    botLeft: false,
    botRight: false,
  };
  if (config?.showCorners) {
    const mindetail = min % 5;
    corners.topLeft = mindetail >= 1;
    corners.topRight = mindetail >= 2;
    corners.botRight = mindetail >= 3;
    corners.botLeft = mindetail >= 4;
    min = (Math.floor(min / 5) * 5) % 60;
  } else {
    min = (Math.round(min / 5) * 5) % 60;
  }

  add(W_ES);
  add(W_IST);
  switch (min) {
    case 0:
      add(W_UHR);
      break;
    case 5:
      add(W_FUENF, W_FUENF_FIRST);
      add(W_NACH);
      break;
    case 10:
      add(W_ZEHN, W_ZEHN_FIRST);
      add(W_NACH);
      break;
    case 15:
      add(W_VIERTEL);
      add(W_NACH);
      break;
    case 20:
      // ZWANZIG NACH ... ZEHN VOR HALB
      if (config?.deZwanzigNach) {
        add(W_ZWANZIG);
        add(W_NACH);
      } else {
        add(W_ZEHN, W_ZEHN_FIRST);
        add(W_VOR);
        add(W_HALB);
        hour++;
      }
      break;
    case 25:
      add(W_FUENF, W_FUENF_FIRST);
      add(W_VOR);
      add(W_HALB);
      hour++;
      break;
    case 30:
      add(W_HALB);
      hour++;
      break;
    case 35:
      add(W_FUENF, W_FUENF_FIRST);
      add(W_NACH);
      add(W_HALB);
      hour++;
      break;
    case 40:
      // ZWANZIG VOR ... ZEHN NACH HALB
      if (config?.deZwanzigVor) {
        add(W_ZWANZIG);
        add(W_VOR);
      } else {
        add(W_ZEHN, W_ZEHN_FIRST);
        add(W_NACH);
        add(W_HALB);
      }
      hour++;
      break;
    case 45:
      // DREIVIERTEL ... VIERTEL VOR
      if (config?.deDreiviertel) {
        add(W_DREI, W_DREI_FIRST);
        add(W_VIERTEL);
      } else {
        add(W_VIERTEL);
        add(W_VOR);
      }
      hour++;
      break;
    case 50:
      add(W_ZEHN, W_ZEHN_FIRST);
      add(W_VOR);
      hour++;
      break;
    case 55:
      add(W_FUENF, W_FUENF_FIRST);
      add(W_VOR);
      hour++;
      break;
    default:
  }
  if (hour >= 12) hour -= 12;
  switch (hour) {
    case 0:
      add(W_ZWOELF);
      break;
    case 1:
      add(min === 0 ? W_EIN : W_EINS);
      break;
    case 2:
      add(W_ZWEI);
      break;
    case 3:
      add(W_DREI, W_DREI_SND);
      break;
    case 4:
      add(W_VIER, W_VIER_ROW);
      break;
    case 5:
      add(W_FUENF, W_FUENF_SECOND);
      break;
    case 6:
      add(W_SECHS);
      break;
    case 7:
      add(W_SIEBEN);
      break;
    case 8:
      add(W_ACHT);
      break;
    case 9:
      add(W_NEUN);
      break;
    case 10:
      add(W_ZEHN, W_ZEHN_SECOND);
      break;
    case 11:
      add(W_ELF);
      break;
    default:
  }
  return { corners, activeWords };
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
  colIdx: number,
  rowIdx: number
): boolean {
  const all = row.join('');
  return activeWords.some((itm) => {
    const charIdxOfWord = itm.word.indexOf(col);
    const wordIdxOfRow = all.indexOf(itm.word);
    const wordEndIdxOfRow = wordIdxOfRow + itm.word.length - 1;
    return (
      wordIdxOfRow >= 0 &&
      charIdxOfWord >= 0 &&
      colIdx >= wordIdxOfRow &&
      colIdx <= wordEndIdxOfRow &&
      (itm.row < 0 || itm.row === rowIdx)
    );
  });
}
