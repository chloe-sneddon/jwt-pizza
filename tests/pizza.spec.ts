import { Page } from '@playwright/test';
// import { test, expect } from 'playwright-test-coverage';
import { test, expect } from './testSetup';
import { Order, Role, User } from '../src/service/pizzaService';

async function basicInit(page: Page, role: Role = Role.Diner, orders: Order[] = []) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role }] } };

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = route.request().postDataJSON();
    const user = validUsers[loginReq.email];
    if (!user || user.password !== loginReq.password) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
      return;
    }
    loggedInUser = validUsers[loginReq.email];
    const loginRes = {
      user: loggedInUser,
      token: 'abcdef',
    };
    expect(route.request().method()).toBe('PUT');
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: 'LotaPizza',
          admins: [{ email: 'kai@jwt.com', name: 'Kai Chen' }],
          stores: [
            { id: 4, name: 'Lehi', totalRevenue: 0.25 },
            { id: 5, name: 'Springville', totalRevenue: 0.4 },
            { id: 6, name: 'American Fork', totalRevenue: 0.15 },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork', totalRevenue: 0.2 }] },
        { id: 4, name: 'topSpot', stores: [] },
      ],
      more: true,
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/order', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { orders } });
      return;
    }
    const orderReq = route.request().postDataJSON();
    const orderRes = {
      order: { ...orderReq, id: 23 },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: orderRes });
  });

  

  await page.goto('/');
}

test('login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();

  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByText('0.008')).toBeVisible();
});

test('login shows an error for an unknown user', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('unknown@jwt.com');
  await page.getByPlaceholder('Password').fill('wrong');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText(/401/)).toBeVisible();
});

test('registration and login links navigate between forms', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to the party' })).toBeVisible();
  await page.getByText('Login', { exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('registration displays the server error for invalid registration', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByPlaceholder('Full name').fill('Kai Chen');
  await page.getByPlaceholder('Email address').fill('kai@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText(/401/)).toBeVisible();
});

test('public information pages and unknown routes render', async ({ page }) => {
  await basicInit(page);

  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: 'Mama Rucci, my my' })).toBeVisible();
  await page.goto('/franchise-dashboard');
  await expect(page.getByRole('heading', { name: 'So you want a piece of the pie?' })).toBeVisible();
  await page.goto('/missing-page');
  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
});

test('admin can filter franchises and cancel franchise or store closure', async ({ page }) => {
  await basicInit(page, Role.Admin);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
  await expect(page.getByText('LotaPizza')).toBeVisible();
  await page.getByPlaceholder('Filter franchises').fill('Pizza');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('button', { name: '»' }).click();
  await page.getByRole('button', { name: '«' }).click();

  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await expect(page.getByRole('heading', { name: 'Create franchise' })).toBeVisible();
  await page.getByPlaceholder('franchise name').fill('Test Franchise');
  await page.getByPlaceholder('franchisee admin email').fill('admin@jwt.com');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.getByText('LotaPizza franchise?')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'Close' }).nth(1).click();
  await expect(page.getByText('Lehi', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
});

test('create-store form can be canceled without submitting', async ({ page }) => {
  await basicInit(page);
  await page.goto('/create-store');
  await expect(page.getByRole('heading', { name: 'Create store' })).toBeVisible();
  await expect(page.getByPlaceholder('store name')).toBeVisible();
  await page.getByPlaceholder('store name').fill('Test Store');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('delivery screen offers another order', async ({ page }) => {
  await basicInit(page);
  await page.goto('/delivery');
  await expect(page.getByRole('heading', { name: 'Here is your JWT Pizza!' })).toBeVisible();
  await page.getByRole('button', { name: 'Order more' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
});

test('diner dashboard shows order history', async ({ page }) => {
  const orders: Order[] = [
    {
      id: '23',
      franchiseId: '2',
      storeId: '4',
      date: '2026-10-09',
      items: [{ menuId: '1', description: 'Veggie', price: 0.0038 }],
    },
  ];
  await basicInit(page, Role.Diner, orders);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'KC' }).click();

  await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();
  await expect(page.getByRole('table')).toContainText('23');
  await expect(page.getByRole('table')).toContainText('2026-10-09');
});

test('payment can be canceled back to the menu', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('button', { name: 'Order now' }).click();
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('button', { name: 'Checkout' }).click();

  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'So worth it' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
  await expect(page.locator('form')).toContainText('Selected pizzas: 1');
});
