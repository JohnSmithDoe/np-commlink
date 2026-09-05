export const DIE_FACES = [4, 6, 8, 10, 12, 20, 100] as const;

export type DieFaces = (typeof DIE_FACES)[number];

export const DICE_MAX = 30;

export interface DiceTally {
  faces: DieFaces;
  count: number;
}

export interface DieRoll {
  faces: DieFaces;
  value: number;
}

export interface PoolRoll {
  dice: DieRoll[];
  total: number;
}
