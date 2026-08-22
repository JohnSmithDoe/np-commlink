import { test } from '@playwright/test';
import { bootDeck, openPage, shot } from './shot';

test('deck home', async ({ page }) => {
  await bootDeck(page);
  await openPage(page, 'commlink', 'app-page-commlink');
  await shot(page, 'smoke-deck');
});
