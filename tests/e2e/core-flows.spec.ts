import { expect, test } from '@playwright/test'

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

async function seedSession(
  page: import('@playwright/test').Page,
  options: { email: string; fullName: string; orgId?: string },
): Promise<void> {
  await page.addInitScript(
    ({ email, fullName, orgId }) => {
      localStorage.setItem(
        'paragonka-auth',
        JSON.stringify({
          state: {
            user: { id: '1', email, full_name: fullName },
            currentOrgId: orgId,
          },
          version: 0,
        }),
      )
      localStorage.setItem('paragonka-cookie-consent', 'true')
      localStorage.setItem('lang', 'en')
    },
    { email: options.email, fullName: options.fullName, orgId: options.orgId ?? 'org-1' },
  )
}

test.describe('Critical user paths (MSW-backed)', () => {
  test('register, create organization, land on dashboard', async ({ page }) => {
    const email = unique('e2e')
    const fullName = `E2E User ${email}`
    const orgName = unique('E2E Org')

    await page.addInitScript(() => {
      localStorage.setItem('lang', 'en')
      localStorage.setItem('paragonka-cookie-consent', 'true')
    })
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible()

    await page.getByPlaceholder('First name').fill(fullName)
    await page.getByPlaceholder('Email').fill(`${email}@example.com`)
    await page.getByPlaceholder('Password').fill('password123')
    await page.locator('#consent').check()

    await page.getByRole('button', { name: 'Sign up' }).click()

    await expect(page).toHaveURL(/\/orgs\/select/)
    await expect(page.getByRole('heading', { name: 'Select organization' })).toBeVisible()

    await page.getByPlaceholder('Organization name').fill(orgName)
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText(orgName)).toBeVisible()
    await page.getByText(orgName).click()

    await expect(page).toHaveURL(/\/app\/[^/]+\/dashboard/)
    await expect(page.getByText('Dashboard (coming soon)')).toBeVisible()
  })

  test('create a client and see it in the list', async ({ page }) => {
    const fullName = unique('E2E Client')
    await seedSession(page, { email: `${unique('e2e')}@example.com`, fullName: unique('E2E User') })

    await page.goto('/app/org-1/clients')

    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible()

    await page.getByRole('button', { name: 'New Client' }).click()
    await page.locator('#create-name').fill(fullName)
    await page.locator('#create-surname').fill('Testov')
    await page.locator('#create-phone').fill('+48123456789')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible()
    await expect(page.getByRole('cell', { name: fullName })).toBeVisible()
  })

  test('create a product and see it in the list', async ({ page }) => {
    const productName = unique('E2E Product')
    await seedSession(page, { email: `${unique('e2e')}@example.com`, fullName: unique('E2E User') })

    await page.goto('/app/org-1/products')

    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()

    await page.getByRole('button', { name: 'New Product' }).click()
    await page.locator('#create-name').fill(productName)
    await page.locator('#create-category').fill('Pastry')
    await page.locator('#create-unit').fill('pcs')
    await page.locator('#create-product_type').selectOption('good')
    await page.locator('#create-price').fill('12.50')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()
    await expect(page.getByRole('cell', { name: productName })).toBeVisible()
  })

  test('create an order, add an item, see the item row and total', async ({ page }) => {
    const itemName = unique('E2E Item')
    await seedSession(page, { email: `${unique('e2e')}@example.com`, fullName: unique('E2E User') })

    await page.goto('/app/org-1/orders/new')

    await expect(page.getByRole('heading', { name: 'New Order' })).toBeVisible()

    await page.locator('#client_id').selectOption('c1')
    await page.getByRole('button', { name: 'Create order' }).click()

    await expect(page).toHaveURL(/\/app\/org-1\/orders\/o-new-\d+/)
    await expect(page.getByText('No items')).toBeVisible()

    await page.locator('#item-name').fill(itemName)
    await page.locator('#item-price').fill('5.50')
    await page.locator('#item-qty').fill('2')
    await page.getByRole('button', { name: 'Add item' }).click()

    await expect(page.getByRole('cell', { name: itemName })).toBeVisible()
    await expect(page.getByRole('cell', { name: '11,00 zł' })).toBeVisible()
  })
})
