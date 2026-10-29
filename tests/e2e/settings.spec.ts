import { test, expect, type Page } from '@playwright/test'

/**
 * Settings is the only privileged surface: worker CSV ingestion, approved
 * worker offboarding, and directory sync. Non-admins are bounced back to the
 * overview with an explanatory toast.
 */

const BASE_URL = 'http://localhost:3000'

async function signInAs(page: Page, role: string) {
  await page.context().addCookies([{ name: 'eccf-dev-role', value: role, url: BASE_URL }])
}

async function openSettings(page: Page) {
  await page.goto('/dashboard/settings')
  await expect(page.getByRole('heading', { name: /Settings & Admin Tools/i })).toBeVisible()
}

test.describe.configure({ timeout: 90_000 })

test.describe('Settings access and tools', () => {
  test('non-admin is redirected with a denial toast', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signInAs(page, 'team_lead')

    await page.goto('/dashboard/settings')

    await expect(page.getByText("You don't have access to Settings.")).toBeVisible({
      timeout: 20_000,
    })
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: /Settings & Admin Tools/i })).toHaveCount(0)
  })

  test('admin sees all three tools at 44px control height', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signInAs(page, 'admin')
    await openSettings(page)

    const tabs = page.locator('main').getByRole('button', {
      name: /Worker CSV Roster|Worker Offboarding|Member Directory Sync/i,
    })
    await expect(tabs).toHaveCount(3)

    const heights = await tabs.evaluateAll((buttons) =>
      buttons.map((button) => Math.round(button.getBoundingClientRect().height))
    )
    expect(heights.every((height) => height >= 44)).toBe(true)

    await page.getByRole('button', { name: /Worker Offboarding/i }).click()
    await expect(page.locator('#worker-select')).toBeVisible()
    expect(
      await page.locator('#worker-select').evaluate((el) => Math.round(el.getBoundingClientRect().height))
    ).toBe(44)
  })

  test('CSV preview handles quoted commas, CRLF, and a BOM', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signInAs(page, 'admin')
    await openSettings(page)

    const csv = [
      '\uFEFF"Full Name",Email,Phone,Team,Hall',
      '"Okafor, Chidi",chidi.okafor@example.com,08030000000,Choir,Hall A',
      '"Eze, Amaka",amaka.eze@example.com,08030000001,Media,Hall B',
    ].join('\r\n')

    await page.setInputFiles('#csv-upload', {
      name: 'workers.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    })

    await expect(page.getByText('Ready to import 2 workers')).toBeVisible()
    const preview = page.locator('main').getByText('Okafor, Chidi', { exact: true })
    await expect(preview).toBeVisible()
    await expect(page.locator('main').getByText('Eze, Amaka', { exact: true })).toBeVisible()
    await expect(page.getByText('Confirm & Ingest 2 Workers')).toBeEnabled()
  })

  test('offboarding an approved worker removes them from the Executives roster', async ({
    page,
  }, testInfo) => {
    // Mutates the shared mock roster; run once on desktop and absorb repeat
    // runs after the leader has already been archived.
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Destructive roster test runs once.')

    await page.setViewportSize({ width: 1440, height: 900 })
    await signInAs(page, 'admin')
    await openSettings(page)

    await page.getByRole('button', { name: /Worker Offboarding/i }).click()

    const option = page.locator('#worker-select option', { hasText: 'Tobi Adebayo' })
    test.skip((await option.count()) === 0, 'Tobi Adebayo is already offboarded on this server.')

    await page.locator('#worker-select').selectOption({ label: 'Tobi Adebayo (Media)' })
    await page.getByLabel(/Type Tobi Adebayo to confirm/i).fill('Tobi Adebayo')

    const archive = page.getByRole('button', { name: /Archive Worker Record/i })
    await expect(archive).toBeEnabled()
    await archive.click()

    await expect(page.getByText(/has been archived and permissions revoked/i)).toBeVisible({
      timeout: 20_000,
    })

    await page.goto('/dashboard/executives')
    await expect(page.getByRole('heading', { name: /Executive Council/i })).toBeVisible()
    await expect(page.locator('main h4').filter({ hasText: 'Tobi Adebayo' })).toHaveCount(0)
    await expect(page.locator('main h4').filter({ hasText: 'Osaro Igbinedion' })).toBeVisible()
  })
})
