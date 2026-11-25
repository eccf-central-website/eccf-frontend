import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end tests for /dashboard/minutes (Meeting Minutes & Secretariat Archive):
 * - CSGB (`admin`): Full Read & Write access, can view internal CSGB drafts, create
 *   a new draft, organize by folder/type/search, and post to EXCOs.
 * - Non-CSGB EXCO (`team_lead`, `hall_rep`, `finance`): Strictly Read-Only access
 *   for minutes posted to EXCOs; internal CSGB drafts and write actions never appear.
 * - Responsive no-overflow checks across 1440px, 390px, and 320px viewports.
 */

const BASE_URL = 'http://localhost:3000'
const POSTED_MOCK_TITLE = 'General EXCO Mobilization & First Semester Calendar Alignment'
const DRAFT_MOCK_TITLE = 'CSGB Executive Screening & Pastoral Oversight Review'

async function signInAs(page: Page, role: 'admin' | 'team_lead' | 'hall_rep' | 'finance') {
  await page.context().addCookies([{ name: 'eccf-dev-role', value: role, url: BASE_URL }])
}

test.describe.configure({ timeout: 90_000 })

test.describe('Meeting Minutes — CSGB Write vs EXCO Read-Only', () => {
  test('CSGB admin sees Read & Write controls, drafts, and can create a CSGB draft', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signInAs(page, 'admin')
    await page.goto('/dashboard/minutes')

    await expect(page.getByRole('heading', { name: 'Meeting Minutes', level: 1 })).toBeVisible()
    await expect(page.getByText('CSGB Read & Write')).toBeVisible()
    await expect(page.getByRole('button', { name: /New minute/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'CSGB Drafts', exact: true })).toBeVisible()

    const table = page.locator('table')

    // Both posted and CSGB-only draft minutes are visible to CSGB.
    await expect(table.getByText(POSTED_MOCK_TITLE)).toBeVisible()
    await expect(table.getByText(DRAFT_MOCK_TITLE)).toBeVisible()

    // Filter to CSGB Drafts and verify organization works.
    await page.getByRole('button', { name: 'CSGB Drafts', exact: true }).click()
    await expect(table.getByText(DRAFT_MOCK_TITLE)).toBeVisible()
    await expect(page.getByText(POSTED_MOCK_TITLE)).toHaveCount(0)

    // Create a fresh CSGB-only draft minute via the slide-over sheet.
    await page.getByRole('button', { name: /New minute/i }).click()
    await expect(page.getByRole('heading', { name: 'Write meeting minute' })).toBeVisible()

    const newDraftTitle = `CSGB Budget Alignment Draft ${Date.now()}`
    await page.getByLabel(/Meeting Title/i).fill(newDraftTitle)
    await page.getByRole('button', { name: 'Save CSGB draft' }).click()

    await expect(table.getByText(newDraftTitle)).toBeVisible({ timeout: 15_000 })
  })

  for (const role of ['team_lead', 'hall_rep', 'finance'] as const) {
    test(`Non-CSGB EXCO (${role}) gets strict Read-Only posted view without CSGB drafts`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await signInAs(page, role)
      await page.goto('/dashboard/minutes')

      await expect(page.getByRole('heading', { name: 'Meeting Minutes', level: 1 })).toBeVisible()
      await expect(page.getByText('EXCO Read-Only')).toBeVisible()

      // Write controls and draft tabs must not render for non-CSGB EXCOs.
      await expect(page.getByRole('button', { name: /New minute/i })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'CSGB Drafts', exact: true })).toHaveCount(0)

      // Posted minutes appear; CSGB-only drafts are completely omitted from DOM.
      const table = page.locator('table')
      await expect(table.getByText(POSTED_MOCK_TITLE)).toBeVisible()
      await expect(page.getByText(DRAFT_MOCK_TITLE)).toHaveCount(0)

      // Opening a posted minute renders the read-only detail sheet with no Edit/Delete controls.
      await table.getByRole('button', { name: `Open ${POSTED_MOCK_TITLE}` }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('dialog').getByRole('button', { name: /^Edit$/i })).toHaveCount(0)
      await expect(page.getByRole('dialog').getByRole('button', { name: /^Delete$/i })).toHaveCount(
        0
      )
    })
  }

  test('Meeting Minutes fits mobile viewports (390px and 320px) without horizontal overflow', async ({
    page,
  }) => {
    await signInAs(page, 'admin')
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      await page.goto('/dashboard/minutes')
      await expect(page.getByRole('heading', { name: 'Meeting Minutes', level: 1 })).toBeVisible()
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1
      )
      expect(overflows).toBe(false)
    }
  })
})
