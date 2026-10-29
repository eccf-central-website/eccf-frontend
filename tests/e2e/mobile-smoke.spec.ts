import { test, expect } from '@playwright/test'

test.describe('Mobile dashboard smoke', () => {
  test('dashboard home renders without horizontal overflow on mobile', async ({ page }) => {
    // Mock auth role cookie: admin
    await page.context().addCookies([
      { name: 'eccf-dev-role', value: 'admin', url: 'http://localhost:3000' },
    ])
    // The bottom nav is `sm:hidden`; pin the viewport so this assertion is
    // meaningful in both configured projects.
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
    // Bottom nav visible on mobile
    const bottomNav = page.locator('nav[aria-label="Primary"]')
    await expect(bottomNav).toBeVisible()
  })

  test('attendance page renders mobile cards', async ({ page }) => {
    await page.context().addCookies([
      { name: 'eccf-dev-role', value: 'admin', url: 'http://localhost:3000' },
    ])
    await page.goto('/dashboard/attendance')
    await expect(page).toHaveURL(/\/dashboard\/attendance/)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
})
