import { test, expect } from './testSetup';
import { Role, User } from '../src/service/pizzaService';

test.describe.configure({ mode: 'serial' });

async function mockUserApi(page: import('@playwright/test').Page) {
    const users = new Map<string, User & { password: string }>([
        ['a@jwt.com', { id: 'admin-1', name: '常', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] }],
        ['f@jwt.com', { id: 'franchisee-1', name: 'pizza franchisee', email: 'f@jwt.com', password: 'franchisee', roles: [{ role: Role.Franchisee }] }],
    ]);
    const tokens = new Map<string, string>();
    const deletedIds = new Set<string>();

    await page.route('**/api/auth', async (route) => {
        const method = route.request().method();
        if (method === 'DELETE') {
            await route.fulfill({ status: 204, body: '' });
            return;
        }

        const payload = route.request().postDataJSON();
        if (method === 'POST') {
            const user: User & { password: string } = {
                id: `user-${users.size + 1}`,
                name: payload.name,
                email: payload.email,
                password: payload.password,
                roles: [{ role: Role.Diner }],
            };
            users.set(user.email!, user);
            const token = `token-${user.id}`;
            tokens.set(token, user.email!);
            await route.fulfill({ json: { user, token } });
            return;
        }

        const user = users.get(payload.email);
        if (!user || user.password !== payload.password) {
            await route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
            return;
        }
        const token = `token-${user.id}`;
        tokens.set(token, user.email!);
        await route.fulfill({ json: { user, token } });
    });

    await page.route('**/api/user/me', async (route) => {
        const token = route.request().headers().authorization?.replace('Bearer ', '');
        const email = token ? tokens.get(token) : undefined;
        const user = email ? users.get(email) : undefined;
        await route.fulfill(user ? { json: user } : { status: 401, json: { message: 'Unauthorized' } });
    });

    await page.route(/\/api\/user(?:\?.*)?$/, async (route) => {
        const url = new URL(route.request().url());
        const filter = (url.searchParams.get('name') ?? '*').replace(/\*/g, '').toLowerCase();
        const listedUsers = [...users.values()].filter(
            (user) => !deletedIds.has(user.id!) && (user.name ?? '').toLowerCase().includes(filter),
        );
        await route.fulfill({ json: { users: listedUsers, more: false } });
    });

    await page.route(/\/api\/user\/([^/?]+)$/, async (route) => {
        const id = new URL(route.request().url()).pathname.split('/').pop()!;
        const currentEntry = [...users.entries()].find(([, user]) => user.id === id);
        if (route.request().method() === 'DELETE') {
            deletedIds.add(id);
            await route.fulfill({ status: 204, body: '' });
            return;
        }

        const payload = route.request().postDataJSON();
        if (!currentEntry) {
            await route.fulfill({ status: 404, json: { message: 'User not found' } });
            return;
        }
        const [currentEmail, currentUser] = currentEntry;
        const updatedUser = {
            ...currentUser,
            ...payload,
            password: payload.password || currentUser.password,
        };
        users.delete(currentEmail);
        users.set(updatedUser.email!, updatedUser);
        const token = `token-${id}`;
        tokens.set(token, updatedUser.email!);
        await route.fulfill({ json: { user: updatedUser, token } });
    });

    await page.route(/\/api\/franchise(?:\/[^/?]+)?(?:\?.*)?$/, async (route) => {
        await route.fulfill({ json: { franchises: [], more: false } });
    });

    await page.route('**/api/order', async (route) => {
        await route.fulfill({ json: { orders: [] } });
    });
}

test.beforeEach(async ({ page }) => {
    await mockUserApi(page);
});

test('updateUserDiner', async ({ page }) => {
    const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.getByRole('link', { name: 'pd' }).click();

    await expect(page.getByRole('main')).toContainText('pizza diner');

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('h3')).toContainText('Edit user');
    await page.getByRole('button', { name: 'Update' }).click();

    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await expect(page.getByRole('main')).toContainText('pizza diner');
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.locator('h3')).toContainText('Edit user');
    await page.getByRole('textbox').first().fill('pizza dinerx');
    await page.getByRole('button', { name: 'Update' }).click();

    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await expect(page.getByRole('main')).toContainText('pizza dinerx');
    await page.getByRole('link', { name: 'Logout' }).click();
    await page.getByRole('link', { name: 'Login' }).click();

    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByRole('link', { name: 'pd' }).click();

    await expect(page.getByRole('main')).toContainText('pizza dinerx');

    // Change email
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(1).fill(email.replace('@jwt.com', 'updated@jwt.com'));
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByRole('main')).toContainText(email.replace('@jwt.com', 'updated@jwt.com'));

    // Change password
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(2).fill('newdinerpassword');
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
});

test('updateUserAdmin', async ({ page }) => {
    const email = `a@jwt.com`;

    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');

    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: '常' }).click();
    await expect(page.getByRole('main')).toContainText('a@jwt.com');

    // Change email
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(1).fill(email.replace('@jwt.com', 'updated@jwt.com'));
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByRole('main')).toContainText(email.replace('@jwt.com', 'updated@jwt.com'));

    // Change password
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(2).fill('newadminpassword');
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await page.getByRole('link', { name: 'Logout' }).click();

    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('aupdated@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('newadminpassword');

    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: '常' }).click();
    await expect(page.getByRole('main')).toContainText('aupdated@jwt.com');

    // Change email
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(1).fill(email.replace('updated@jwt.com', '@jwt.com'));
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByRole('main')).toContainText(email.replace('updated@jwt.com', '@jwt.com'));

    // Change password
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(2).fill('admin');
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
});

test('updateUserFranchisee', async ({ page }) => {
    const email = `f@jwt.com`;

    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
    await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
    await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
    await page.getByRole('textbox', { name: 'Password' }).press('Enter');
    await page.getByRole('link', { name: 'pf' }).click();
    await expect(page.getByRole('main')).toContainText('f@jwt.com');

    // Change email
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(1).fill(email.replace('@jwt.com', 'updated@jwt.com'));
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByRole('main')).toContainText(email.replace('@jwt.com', 'updated@jwt.com'));

    // Change password
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(2).fill('newfranchiseepassword');
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await page.getByRole('link', { name: 'Logout' }).click();


    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('fupdated@jwt.com');
    await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
    await page.getByRole('textbox', { name: 'Password' }).fill('newfranchiseepassword');
    await page.getByRole('textbox', { name: 'Password' }).press('Enter');
    await page.getByRole('link', { name: 'pf' }).click();
    await expect(page.getByRole('main')).toContainText('fupdated@jwt.com');

    // Change email
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(1).fill(email.replace('updated@jwt.com', '@jwt.com'));
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByRole('main')).toContainText(email.replace('updated@jwt.com', '@jwt.com'));

    // Change password
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('[role="dialog"] input').nth(2).fill('franchisee');
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
});

test('admin can list and delete a registered user with a mocked API', async ({ page }) => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const name = `Integration User ${suffix}`;
    const email = `integration${suffix}@jwt.com`;

    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill(name);
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('integration-test');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.getByRole('link', { name: 'Logout' }).click();
    await page.getByRole('link', { name: 'Login', exact: true }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Admin' }).click();

    await page.getByPlaceholder('Filter users by name').fill(name);
    await page.getByRole('button', { name: 'Filter users' }).click();
    await expect(page.getByRole('main')).toContainText(email);
    await expect(page.getByRole('main')).toContainText('diner');

    await page.getByRole('button', { name: `Delete ${name}` }).click();
    await expect(page.getByRole('main')).not.toContainText(email);
});
