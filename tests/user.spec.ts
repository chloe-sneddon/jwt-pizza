import { test, expect } from 'playwright-test-coverage';

test.describe.configure({ mode: 'serial' });

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

test('admin can list and delete a registered user through the backend', async ({ page }) => {
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
    const listResponsePromise = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return response.request().method() === 'GET' &&
            url.pathname === '/api/user' &&
            url.searchParams.get('name') === `*${name}*`;
    });
    await page.getByRole('button', { name: 'Filter users' }).click();
    const listResponse = await listResponsePromise;
    expect(listResponse.status()).toBe(200);
    await expect(page.getByRole('main')).toContainText(email);
    await expect(page.getByRole('main')).toContainText('diner');

    await page.getByRole('button', { name: `Delete ${name}` }).click();
    await expect(page.getByRole('main')).not.toContainText(email);
});
