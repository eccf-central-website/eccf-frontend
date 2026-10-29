import { test, expect, type Page } from '@playwright/test'

/**
 * Shell regression coverage for the two navigation surfaces:
 * - lg+ sidebar: nine flat destinations at 44px with no scrollbar and a
 *   pinned 44px Settings footer.
 * - phone bottom bar: four role-prioritised links plus All, with the active
 *   tab styled by colour/weight rather than a filled background.
 */

const BASE_URL = 'http://localhost:3000'

async function signInAs(page: Page, role = 'admin') {
  await page.context().addCookies([{ name: 'eccf-dev-role', value: role, url: BASE_URL }])
}

async function waitForDashboard(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('main')).toBeVisible()
}

test.describe.configure({ timeout: 90_000 })

test.describe('Dashboard shell navigation', () => {
  test('desktop sidebar is flat, scroll-free, and pins Settings', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signInAs(page)
    await page.goto('/dashboard')
    await waitForDashboard(page)

    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    const flatLinks = sidebar.locator('nav[aria-label="Dashboard"] a')
    await expect(flatLinks).toHaveCount(9)
    await expect(flatLinks).toHaveText([
      'Overview',
      'Executives',
      'Workers',
      'First-Timers',
      'Attendance',
      'Welfare',
      'Prayer Requests',
      'Finance',
      'Announcements',
    ])

    // Settings must not also appear inside the flat list.
    await expect(sidebar.locator('nav a[href="/dashboard/settings"]')).toHaveCount(0)

    const rowHeights = await flatLinks.evaluateAll((links) =>
      links.map((link) => Math.round(link.getBoundingClientRect().height))
    )
    expect(rowHeights.every((height) => height === 44)).toBe(true)

    const navScrolls = await sidebar
      .locator('nav[aria-label="Dashboard"]')
      .evaluate((nav) => nav.scrollHeight > nav.clientHeight + 1)
    expect(navScrolls).toBe(false)

    const settings = sidebar.locator('a[href="/dashboard/settings"]')
    await expect(settings).toHaveCount(1)
    await expect(settings).toBeVisible()
    await expect(settings).toContainText('Settings')
    await expect(settings).toContainText('Admin tools')

    const pinned = await settings.evaluate((link) => {
      const linkBox = link.getBoundingClientRect()
      const sidebarBox = link.closest('aside')!.getBoundingClientRect()
      return {
        height: Math.round(linkBox.height),
        distanceFromBottom: Math.round(sidebarBox.bottom - linkBox.bottom),
      }
    })
    expect(pinned.height).toBe(44)
    expect(pinned.distanceFromBottom).toBeLessThan(80)
  })

  test('mobile bottom bar shows four role tabs plus All with non-filled active state', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signInAs(page, 'admin')
    await page.goto('/dashboard')
    await waitForDashboard(page)

    const bottomNav = page.locator('nav[aria-label="Primary"]')
    await expect(bottomNav).toBeVisible()

    const primaryLinks = bottomNav.getByRole('link')
    await expect(primaryLinks).toHaveCount(4)
    await expect(primaryLinks).toHaveText(['Overview', 'Executives', 'Workers', 'Attendance'])

    const allButton = bottomNav.getByRole('button', { name: /All fellowship sections/i })
    await expect(allButton).toBeVisible()
    await expect(allButton).toHaveAttribute('aria-expanded', 'false')

    const active = primaryLinks.first()
    await expect(active).toHaveAttribute('aria-current', 'page')

    const activeStyles = await active.evaluate((link) => {
      const icon = link.querySelector('svg')!
      const label = link.querySelector('span')!
      const iconColor = getComputedStyle(icon).color
      const alpha = getComputedStyle(link).backgroundColor
      return {
        iconColor,
        background: alpha,
        labelWeight: Number.parseInt(getComputedStyle(label).fontWeight, 10),
        height: Math.round(link.getBoundingClientRect().height),
      }
    })

    // Transparent tab, brand-blue icon, stronger label, comfortable target.
    expect(activeStyles.background).toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
    expect(['rgb(0, 149, 255)', 'rgb(112, 163, 255)']).toContain(activeStyles.iconColor)
    expect(activeStyles.labelWeight).toBeGreaterThanOrEqual(600)
    expect(activeStyles.height).toBeGreaterThanOrEqual(44)

    // Inactive tabs must not be marked as current.
    await expect(primaryLinks.nth(1)).not.toHaveAttribute('aria-current', 'page')
  })

  test('mobile role priority swaps the four tabs for team leads', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signInAs(page, 'team_lead')
    await page.goto('/dashboard')
    await waitForDashboard(page)

    // The mock team lead is the Media lead: Sermons is permitted while
    // First-Timers is not (that requires an outreach leader or hall rep).
    await expect(page.locator('nav[aria-label="Primary"]').getByRole('link')).toHaveText([
      'Overview',
      'Workers',
      'Attendance',
      'Sermons',
    ])
  })

  test('All sheet lists 44px destinations and pins Settings', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signInAs(page)
    await page.goto('/dashboard/announcements')
    await expect(page.getByRole('heading', { name: 'Announcements', level: 1 })).toBeVisible()

    const allButton = page.getByRole('button', { name: /All fellowship sections/i })
    await allButton.click()
    // The dialog is modal, so the trigger leaves the accessibility tree while
    // it is open; read the aria state from the DOM element instead.
    const allTrigger = page.locator(
      'nav[aria-label="Primary"] button[aria-label="All fellowship sections and admin tools"]'
    )
    await expect(allTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('dialog', { name: 'All Sections' })).toBeVisible()
    await expect(page.getByText('All Sections', { exact: true })).toBeVisible()

    const sheetNav = page.locator('nav[aria-label="All dashboard destinations"]')
    const rows = sheetNav.getByRole('link')
    await expect(rows).toHaveCount(10)

    const rowHeights = await rows.evaluateAll((links) =>
      links.map((link) => Math.round(link.getBoundingClientRect().height))
    )
    expect(rowHeights.every((height) => height >= 44)).toBe(true)

    const current = sheetNav.locator('a[href="/dashboard/announcements"]')
    await expect(current).toHaveAttribute('aria-current', 'page')

    const settings = sheetNav.locator('a[href="/dashboard/settings"]')
    await expect(settings).toHaveCount(1)
    await expect(settings).toContainText('Settings')
    await expect(settings).toContainText('Admin tools')
  })
})
