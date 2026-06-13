import { expect, test } from '@playwright/test'

function ts(): string {
  return `${Date.now()}${Math.round(Math.random() * 100000)}`
}

async function setupOrg(page: import('@playwright/test').Page): Promise<string> {
  const email = `qa-s4-${ts()}@example.com`
  await page.goto('/register')
  await page.getByPlaceholder('First name').fill('S4 Order Tester')
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder('Password').fill('test-pass-123')
  await page.locator('#consent').check()
  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page).toHaveURL(/\/orgs\/select/, { timeout: 10000 })
  const orgName = `S4 Org ${ts()}`
  await page.getByPlaceholder('Organization name').fill(orgName)
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByText(orgName)).toBeVisible({ timeout: 5000 })
  await page.getByText(orgName).click()
  await expect(page).toHaveURL(/\/app\/[^/]+\/dashboard/, { timeout: 10000 })
  return page.url().match(/\/app\/([^/]+)\//)?.[1] ?? ''
}

test.describe('S4 — Orders + Calendar (Playwright, live backend)', () => {
  test('order list loads', async ({ page }) => {
    const orgId = await setupOrg(page)
    await page.goto(`/app/${orgId}/orders`)
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible()
  })

  test('create order → add item → total recalculated', async ({ page }) => {
    const orgId = await setupOrg(page)

    // Create client and product via API
    const clientRes = await page.evaluate(async (oid) => {
      const res = await fetch(`/api/v1/clients?org_id=${oid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Order Client', phone: '+48111111111' }),
        credentials: 'include',
      })
      return res.json()
    }, orgId)

    const productRes = await page.evaluate(async (oid) => {
      const res = await fetch(`/api/v1/products?org_id=${oid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Order Product',
          unit: 'pcs',
          product_type: 'good',
          price: '25.00',
          cost_price: '10.00',
          is_sellable: true,
          is_active: true,
        }),
        credentials: 'include',
      })
      return res.json()
    }, orgId)

    // Create order via API
    const orderRes = await page.evaluate(
      async ({ oid, clientId }) => {
        const res = await fetch(`/api/v1/orders?org_id=${oid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            execution_date: '2026-09-01T10:00:00Z',
            notes: 'E2E test order',
          }),
          credentials: 'include',
        })
        return res.json()
      },
      { oid: orgId, clientId: clientRes.id },
    )

    // Add item via API
    const itemRes = await page.evaluate(
      async ({ oid, orderId, productId }) => {
        const res = await fetch(`/api/v1/orders/${orderId}/items?org_id=${oid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            name: 'Order Product',
            price: '25.00',
            qty: '3',
          }),
          credentials: 'include',
        })
        return res.json()
      },
      { oid: orgId, orderId: orderRes.id, productId: productRes.id },
    )

    expect(itemRes.price).toBe('25.00')
    expect(itemRes.qty).toBe('3.00')

    // Verify total via API
    const orderCheck = await page.evaluate(
      async ({ oid, orderId }) => {
        const res = await fetch(`/api/v1/orders/${orderId}?org_id=${oid}`, {
          credentials: 'include',
        })
        return res.json()
      },
      { oid: orgId, orderId: orderRes.id },
    )
    expect(orderCheck.total).toBe('75.00')

    // Navigate to order detail in SPA
    await page.goto(`/app/${orgId}/orders`)
    await expect(page.getByText('E2E test order')).toBeVisible({ timeout: 5000 })
  })

  test('calendar page loads', async ({ page }) => {
    const orgId = await setupOrg(page)
    await page.goto(`/app/${orgId}/orders/calendar`)
    // Calendar should render (may show "No orders" or calendar grid)
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('create order → change status → verify', async ({ page }) => {
    const orgId = await setupOrg(page)

    // Create order
    const orderRes = await page.evaluate(async (oid) => {
      const res = await fetch(`/api/v1/orders?org_id=${oid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Status test' }),
        credentials: 'include',
      })
      return res.json()
    }, orgId)

    expect(orderRes.status).toBe('draft')

    // Change to confirmed
    const confirmed = await page.evaluate(
      async ({ oid, orderId }) => {
        const res = await fetch(`/api/v1/orders/${orderId}/status?org_id=${oid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' }),
          credentials: 'include',
        })
        return res.json()
      },
      { oid: orgId, orderId: orderRes.id },
    )
    expect(confirmed.status).toBe('confirmed')

    // Change to done
    const done = await page.evaluate(
      async ({ oid, orderId }) => {
        const res = await fetch(`/api/v1/orders/${orderId}/status?org_id=${oid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'done' }),
          credentials: 'include',
        })
        return res.json()
      },
      { oid: orgId, orderId: orderRes.id },
    )
    expect(done.status).toBe('done')
  })
})
