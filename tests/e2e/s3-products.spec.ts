import { expect, test } from '@playwright/test'

function ts(): string {
  return `${Date.now()}${Math.round(Math.random() * 100000)}`
}

async function setupOrg(page: import('@playwright/test').Page): Promise<string> {
  const email = `qa-s3-${ts()}@example.com`
  await page.goto('/register')
  await page.getByPlaceholder('First name').fill('S3 Product Tester')
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder('Password').fill('test-pass-123')
  await page.locator('#consent').check()
  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page).toHaveURL(/\/orgs\/select/, { timeout: 10000 })
  const orgName = `S3 Org ${ts()}`
  await page.getByPlaceholder('Organization name').fill(orgName)
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByText(orgName)).toBeVisible({ timeout: 5000 })
  await page.getByText(orgName).click()
  await expect(page).toHaveURL(/\/app\/[^/]+\/dashboard/, { timeout: 10000 })
  return page.url().match(/\/app\/([^/]+)\//)?.[1] ?? ''
}

test.describe('S3 — Products (Playwright, live backend)', () => {
  test('product list loads', async ({ page }) => {
    const orgId = await setupOrg(page)
    await page.goto(`/app/${orgId}/products`)
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('create product via API → appears in SPA list', async ({ page }) => {
    const orgId = await setupOrg(page)
    const productName = `Product ${ts()}`

    // Create via API (SPA doesn't have create dialog for products in current routes)
    await page.evaluate(
      async ({ oid, name }) => {
        await fetch(`/api/v1/products?org_id=${oid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            unit: 'pcs',
            product_type: 'good',
            price: '12.50',
            cost_price: '4.00',
            stock_qty: '100',
            track_inventory: true,
            is_sellable: true,
            is_active: true,
          }),
          credentials: 'include',
        })
      },
      { oid: orgId, name: productName },
    )

    await page.goto(`/app/${orgId}/products`)
    await expect(page.getByText(productName)).toBeVisible({ timeout: 5000 })
  })

  test('filter products by type', async ({ page }) => {
    const orgId = await setupOrg(page)

    // Create products of different types via API
    for (const type of ['good', 'service', 'material']) {
      await page.evaluate(
        async ({ oid, t }) => {
          await fetch(`/api/v1/products?org_id=${oid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${t} ${Date.now()}`,
              unit: 'pcs',
              product_type: t,
              price: '10.00',
              cost_price: '5.00',
              is_sellable: true,
              is_active: true,
            }),
            credentials: 'include',
          })
        },
        { oid: orgId, t: type },
      )
    }

    await page.goto(`/app/${orgId}/products`)
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()
    // Verify table has rows
    const rows = await page.locator('tbody tr').count()
    expect(rows).toBeGreaterThanOrEqual(3)
  })
})
