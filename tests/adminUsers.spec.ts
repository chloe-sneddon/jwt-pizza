import { Page } from '@playwright/test';
import { test, expect } from './testSetup';

const adminUser = {
  id: 'admin-1',
  name: 'Test Admin',
  email: 'admin@test.com',
  roles: [{ role: 'admin' }],
};

async function adminInit(page: Page) {
  const deletedUsers = new Set<string>();

  await page.route('*/**/api/auth', async (route) => {
    expect(route.request().method()).toBe('PUT');
    await route.fulfill({ json: { user: adminUser, token: 'test-admin-token' } });
  });

  await page.route(/\/api\/franchise(?:\?.*)?$/, async (route) => {
    await route.fulfill({ json: { franchises: [], more: false } });
  });

  await page.route(/\/api\/user(?:\?.*)?$/, async (route) => {
    expect(route.request().method()).toBe('GET');
    const searchParams = new URL(route.request().url()).searchParams;
    const requestedPage = searchParams.get('page');
    const nameFilter = searchParams.get('name') ?? '*';
    const allUsers = [
      { id: 'user-1', name: 'Kai Chen', email: 'kai@test.com', roles: [{ role: 'diner' }] },
      { id: 'user-2', name: 'Buddy', email: 'buddy@test.com', roles: [{ role: 'admin' }] },
      { id: 'user-3', name: 'Maya Lopez', email: 'maya@test.com', roles: [{ role: 'franchisee' }] },
    ];
    const filterText = nameFilter.replace(/\*/g, '').toLowerCase();
    const matchingUsers = allUsers.filter(
      (user) => !deletedUsers.has(user.id) && user.name.toLowerCase().includes(filterText),
    );
    const users =
      filterText || requestedPage === '1'
        ? matchingUsers.slice(0, 2)
        : matchingUsers.slice(2, 3);

    await route.fulfill({
      json: {
        users,
        more: !filterText && requestedPage !== '2',
      },
    });
  });

  await page.route(/\/api\/user\/([^/?]+)$/, async (route) => {
    expect(route.request().method()).toBe('DELETE');
    const userId = new URL(route.request().url()).pathname.split('/').pop()!;
    expect(userId).toBe('user-1');
    deletedUsers.add(userId);
    await route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/');
}

test('admin fixture can open the admin dashboard', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin-password');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
});

test('admin can see user names, emails, and roles', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin-password');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await expect(page.getByRole('main')).toContainText('kai@test.com');
  await expect(page.getByRole('main')).toContainText('diner');
  await expect(page.getByRole('main')).toContainText('Buddy');
  await expect(page.getByRole('main')).toContainText('buddy@test.com');
  await expect(page.getByRole('main')).toContainText('admin');
});

test('admin can move between user pages', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin-password');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  await expect(page.getByRole('main')).toContainText('Kai Chen');
  await page.getByRole('button', { name: 'Next users page' }).click();
  await expect(page.getByRole('main')).toContainText('Maya Lopez');
  await page.getByRole('button', { name: 'Previous users page' }).click();
  await expect(page.getByRole('main')).toContainText('Kai Chen');
});

test('admin can filter users by name', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin-password');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  await page.getByPlaceholder('Filter users by name').fill('Maya');
  await page.getByRole('button', { name: 'Filter users' }).click();
  await expect(page.getByRole('main')).toContainText('Maya Lopez');
  await expect(page.getByRole('main')).not.toContainText('Kai Chen');
});

test('admin can delete a user', async ({ page }) => {
  await adminInit(page);
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin-password');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  await page.getByRole('button', { name: 'Delete Kai Chen' }).click();
  await expect(page.getByRole('main')).not.toContainText('Kai Chen');
  await expect(page.getByRole('main')).toContainText('Buddy');
});
