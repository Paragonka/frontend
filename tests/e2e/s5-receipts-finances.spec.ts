import { expect, test } from '@playwright/test'

function ts(): string {
  return `${Date.now()}${Math.round(Math.random() * 100000)}`
}

async function setupOrg(page: import('@playwright/test').Page): Promise<string> {
  const email = `qa-s5-${ts()}@example.com`
  await page.goto('/register')
  await page.getByPlaceholder('First name').fill('S5 Receipt Tester')
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder('Password').fill('test-pass-123')
  await page.locator('#consent').check()
  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page).toHaveURL(/\/orgs\/select/, { timeout: 10000 })
  const orgName = `S5 Org ${ts()}`
  await page.getByPlaceholder('Organization name').fill(orgName)
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByText(orgName)).toBeVisible({ timeout: 5000 })
  await page.getByText(orgName).click()
  await expect(page).toHaveURL(/\/app\/[^/]+\/dashboard/, { timeout: 10000 })
  return page.url().match(/\/app\/([^/]+)\//)?.[1] ?? ''
}

test.describe('S5 — Receipts + Finances (Playwright, live backend)', () => {
  test('receipts list loads', async ({ page }) => {
    const orgId = await setupOrg(page)
    await page.goto(`/app/${orgId}/receipts`)
    await expect(page.getByRole('heading', { name: 'Receipts' })).toBeVisible()
  })

  test('create receipt via API → appears in SPA list', async ({ page }) => {
    const orgId = await setupOrg(page)

    const receiptRes = await page.evaluate(async (oid) => {
      const res = await fetch(`/api/v1/receipts?org_id=${oid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_date: '2026-08-17',
          source: 'manual',
          items: [
            { name: 'Item A', price: '10.00', qty: '2' },
            { name: 'Item B', price: '5.50', qty: '1' },
          ],
        }),
        credentials: 'include',
      })
      return res.json()
    }, orgId)

    expect(receiptRes.total).toBe('25.50')

    await page.goto(`/app/${orgId}/receipts`)
    await expect(page.getByText('25.50')).toBeVisible({ timeout: 5000 })
  })

  test('finances page loads with summary data', async ({ page }) => {
    const orgId = await setupOrg(page)

    // Create a done order + receipt so finances have data
    await page.evaluate(async (oid) => {
      // Create product
      const prodRes = await fetch(`/api/v1/products?org_id=${oid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Finance Product',
          unit: 'pcs',
          product_type: 'good',
          price: '50.00',
          cost_price: '20.00',
          is_sellable: true,
          is_active: true,
        }),
        credentials: 'include',
      })
      const prod = await prodRes.json()

      // Create order
      const orderRes = await fetch(`/api/v1/orders?org_id=${oid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Finance test' }),
        credentials: 'include',
      })
      const order = await orderRes.json()

      // Add item
      await fetch(`/api/v1/orders/${order.id}/items?org_id=${oid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: prod.id,
          name: 'Finance Product',
          price: '50.00',
          qty: '2',
        }),
        credentials: 'include',
      })

      // Mark done
      await fetch(`/api/v1/orders/${order.id}/status?org_id=${oid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
        credentials: 'include',
      })

      // Create receipt (expense)
      await fetch(`/api/v1/receipts?org_id=${oid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_date: '2026-08-17',
          source: 'manual',
          items: [{ name: 'Ingredient', price: '30.00', qty: '1' }],
        }),
        credentials: 'include',
      })
    }, orgId)

    await page.goto(`/app/${orgId}/finances`)
    await page.waitForTimeout(3000)
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
