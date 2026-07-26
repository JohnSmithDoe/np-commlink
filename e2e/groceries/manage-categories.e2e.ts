import { expect, test } from '@playwright/test';
import { waitForListPage, waitForPersisted } from '../helpers';

// The shared, domain-blind manage-categories page + the category→items drill.
// Real-browser only: the drill navigates with `?filter=<id>` and the target
// list applies it in ionViewWillEnter (after the resolver re-hydrates), which
// jsdom unit tests can't exercise.
async function openManage(page: import('@playwright/test').Page) {
  await page
    .getByRole('button', { name: 'Kategorien verwalten' })
    .first()
    .click();
  await expect(page).toHaveURL(/tasks\/categories/);
  // The add-category input is the manage page's own field.
  await expect(page.getByPlaceholder('Neue Kategorie')).toBeVisible({
    timeout: 10_000,
  });
}

async function addCategory(
  page: import('@playwright/test').Page,
  name: string
) {
  const input = page.getByPlaceholder('Neue Kategorie');
  await input.click();
  await input.fill(name);
  await input.press('Enter');
  await expect(
    page.locator('#main-content').getByText(name, { exact: true })
  ).toBeVisible({ timeout: 10_000 });
}

test.describe('manage categories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/_tasks');
    await waitForListPage(page);
  });

  test('adds a category from the manage page', async ({ page }) => {
    await openManage(page);
    await addCategory(page, 'Arbeit');
    // A fresh category has no items yet — its count badge reads 0.
    await expect(
      page.locator('#main-content ion-item-sliding', { hasText: 'Arbeit' })
    ).toContainText('0');

    // Back returns to the owning list (routerLink → listHref). ion-button with
    // routerLink renders as an anchor, so it carries the link role.
    await page.getByRole('link', { name: 'Zurück' }).first().click();
    await expect(page).toHaveURL(/tasks\/_tasks$/);
  });

  test('drills from a category into the filtered list', async ({ page }) => {
    await openManage(page);
    await addCategory(page, 'Arbeit');
    await waitForPersisted(page, 'tasks', 'Arbeit');

    // Tap the category row → navigate to the list filtered to that category.
    await page
      .locator('#main-content')
      .getByText('Arbeit', { exact: true })
      .click();

    await expect(page).toHaveURL(/tasks\/_tasks\?filter=/);
    await expect(
      page.locator('#main-content').getByText(/Kategorie: Arbeit/)
    ).toBeVisible({ timeout: 10_000 });
  });
});
