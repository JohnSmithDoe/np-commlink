import { PredefinedColors } from '@ionic/core/dist/types/interface';

export type TIonDragEvent = CustomEvent<{ amount: number; ratio: number }>;
export type TMarker = string;
export type TTimestamp = string;
export type TColor = PredefinedColors;
export type TTheme = 'cyberpunk' | 'boomer';
