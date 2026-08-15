export type RitualPromptId = string;

export type RitualPrompt = {
  id: RitualPromptId;
  textKey: string;
};

export type RitualCatalog = readonly [RitualPrompt, ...RitualPrompt[]];

export type RitualCompletion = {
  promptId: RitualPromptId;
  completedAt: string;
};

export type RitualReminder = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export type RitualState = {
  completions: RitualCompletion[];
  dismissed: RitualPromptId[];
  reminder: RitualReminder;
};
