import { expect, test } from '@playwright/test'

function ts(): string {
  return `${Date.now()}${Math.round(Math.random() * 100000)}`
}

async function setupOrg(page: import('@playwright/test').Page): Promise<string> {
  const email = `qa-s2-${ts()}@example.com`
  await page.goto('/register')
  await page.getByPlaceholder('First name').fill('S2 Client Tester')
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder('Password').fill('test-pass-123')
  await page.locator('#consent').check()
  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page).toHaveURL(/\/orgs\/select/, { timeout: 10000 })
  const orgName = `S2 Org ${ts()}`
  await page.getByPlaceholder('Organization name').fill(orgName)
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByText(orgName)).toBeVisible({ timeout: 5000 })
  await page.getByText(orgName).click()
  await expect(page).toHaveURL(/\/app\/[^/]+\/dashboard/, { timeout: 10000 })
  return page.url().match(/\/app\/([^/]+)\//)?.[1] ?? ''
}

test.describe('S2 — Clients + EAV (Playwright, live backend)', () => {
  test('create client via dialog → appears in list', async ({ page }) => {
    const orgId = await setupOrg(page)
    const clientName = `Client ${ts()}`

    await page.goto(`/app/${orgId}/clients`)
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible()

    await page.getByRole('button', { name: 'New Client' }).click()
    await page.locator('#create-name').fill(clientName)
    await page.locator('#create-surname').fill('Testov')
    await page.locator('#create-phone').fill('+48123456789')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible()
    await expect(page.getByText(clientName)).toBeVisible({ timeout: 5000 })
  })

  test('create client with minimal data (name only)', async ({ page }) => {
    const orgId = await setupOrg(page)
    const clientName = `Min ${ts()}`

    await page.goto(`/app/${orgId}/clients`)
    await page.getByRole('button', { name: 'New Client' }).click()
    await page.locator('#create-name').fill(clientName)
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText(clientName)).toBeVisible({ timeout: 5000 })
  })

  test('create client with Unicode name', async ({ page }) => {
    const orgId = await setupOrg(page)
    const clientName = `Тест 🎂 Клиент ${ts()}`

    await page.goto(`/app/${orgId}/clients`)
    await page.getByRole('button', { name: 'New Client' }).click()
    await page.locator('#create-name').fill(clientName)
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText(clientName)).toBeVisible({ timeout: 5000 })
  })

  test('search clients by name', async ({ page }) => {
    const orgId = await setupOrg(page)
    const uniqueName = `SearchMe ${ts()}`

    // Create client
    await page.goto(`/app/${orgId}/clients`)
    await page.getByRole('button', { name: 'New Client' }).click()
    await page.locator('#create-name').fill(uniqueName)
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 })

    // Search
    await page.getByPlaceholder('Search by name...').fill(uniqueName.slice(0, 6))
    await page.waitForTimeout(1000) // debounce
    await expect(page.getByText(uniqueName)).toBeVisible()
  })

  test('edit client via dialog', async ({ page }) => {
    const orgId = await setupOrg(page)
    const originalName = `Original ${ts()}`
    const updatedName = `Updated ${ts()}`

    // Create
    await page.goto(`/app/${orgId}/clients`)
    await page.getByRole('button', { name: 'New Client' }).click()
    await page.locator('#create-name').fill(originalName)
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByText(originalName)).toBeVisible({ timeout: 5000 })

    // Edit
    await page.getByRole('button', { name: 'Edit' }).first().click()
    await page.locator('#edit-name').clear()
    await page.locator('#edit-name').fill(updatedName)
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 })
  })

  test('client list loads without errors', async ({ page }) => {
    const orgId = await setupOrg(page)
    await page.goto(`/app/${orgId}/clients`)
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible()
    // Table should render (even if empty)
    await expect(page.locator('table')).toBeVisible()
  })
})
