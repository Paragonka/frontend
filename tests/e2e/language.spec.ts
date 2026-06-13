import { expect, test } from '@playwright/test'

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

test('change language to Russian and see a translated heading', async ({ page }) => {
  const fullName = unique('E2E User')
  await page.addInitScript((name) => {
    localStorage.setItem(
      'paragonka-auth',
      JSON.stringify({
        state: {
          user: { id: '1', email: 'e2e-language@example.com', full_name: name },
          currentOrgId: 'org-1',
        },
        version: 0,
      }),
    )
    localStorage.setItem('paragonka-cookie-consent', 'true')
    localStorage.setItem('lang', 'en')
  }, fullName)

  await page.goto('/app/org-1/clients')

  await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible()

  await page.getByText(fullName, { exact: true }).click()

  const languageSelect = page.locator('header select')
  await expect(languageSelect).toBeVisible()
  await languageSelect.selectOption('ru')

  await expect(page.getByRole('heading', { name: 'Клиенты' })).toBeVisible()
})
