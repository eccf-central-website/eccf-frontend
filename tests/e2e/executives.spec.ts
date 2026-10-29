import { test, expect, type Page } from '@playwright/test'

/**
 * Executives roster must be authoritative: only live workers with an approved
 * appointment appear. Pending appointments, legacy `excoPosition` strings, and
 * archived/rejected workers are deliberately excluded so offboarding a worker
 * account removes the leader everywhere.
 */

const BASE_URL = 'http://localhost:3000'

async function signInAs(page: Page, role = 'admin') {
  await page.context().addCookies([{ name: 'eccf-dev-role', value: role, url: BASE_URL }])
}

async function openExecutives(page: Page) {
  await page.goto('/dashboard/executives')
  await expect(page.getByRole('heading', { name: /Executive Council/i })).toBeVisible()
}

test.describe.configure({ timeout: 90_000 })

test.describe('Executives roster', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page)
  })

  test('only approved appointments appear on the roster', async ({ page }) => {
    await openExecutives(page)

    const names = await page.locator('main h4').allTextContents()
    expect(names).toContain('Osaro Igbinedion')

    // Pending CSGB/team/hall appointments exist in the fixtures but are not
    // yet leaders; legacy `excoPosition` alone is not an appointment either.
    expect(names).not.toContain('Efosa Balogun')
    expect(names).not.toContain('Efosa Osagie')
  })

  test('category filters and search narrow the roster', async ({ page }) => {
    await openExecutives(page)

    await page.getByRole('button', { name: /CSGB Board/i }).click()
    await expect(page.locator('main h4').filter({ hasText: 'Osaro Igbinedion' })).toBeVisible()
    await expect(page.locator('main h4').filter({ hasText: 'Tobi Adebayo' })).toHaveCount(0)

    await page.getByRole('button', { name: /Team Leads/i }).click()
    // Whether the team lead is still active or has been offboarded, the CSGB
    // president must not leak into the team-lead filter.
    await expect(page.locator('main h4').filter({ hasText: 'Osaro Igbinedion' })).toHaveCount(0)

    await page.getByRole('button', { name: /All Leadership/i }).click()
    const search = page.getByPlaceholder(/Search leader/i)
    await search.fill('Osaro')
    await expect(page.locator('main h4')).toHaveCount(1)
    await expect(page.locator('main h4').first()).toHaveText('Osaro Igbinedion')

    await search.fill('zzzz-no-match')
    await expect(page.getByText(/No executive leaders found/i)).toBeVisible()
  })
})
