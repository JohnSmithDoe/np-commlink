export const APP_VERSION = 1;

export const APP_RELEASE =
  typeof NPC_RELEASE === 'string' && NPC_RELEASE.length > 0
    ? NPC_RELEASE
    : 'dev';

export const APP_WORDMARK = 'np-commlink';

export const SOURCE_URL = 'https://codeberg.org/Letothec0dem0nkey/np-commlink';
