import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end tests for ECCF Message AI Search (Public + Media Dashboard):
 * - Public /sermons: renders inline AI Message Finder, handles ?ai=1 queries,
 *   supports crisis safety guardrails and exact-word search toggle, and opens
 *   the accessible floating <dialog> AI Search modal via bottom-left FAB.
 * - Dashboard /dashboard/sermons: Media Team sees Sermons, Transcripts, and
 *   AI Search tabs, encrypted API key override controls, and cache management.
 * - Mobile & desktop horizontal overflow checks.
 */

async function signInAs(
  page: Page,
  role: 'admin' | 'team_lead' | 'hall_rep' | 'finance'
) {
  await page.context().addCookies([
    {
      name: 'eccf-dev-role',
      value: role,
      domain: 'localhost',
      path: '/',
    },
  ])
}

test.describe.configure({ timeout: 150_000 })

test.describe('Sermon AI Message Search & Media Desk', () => {
  test('Public /sermons renders inline AI finder, floating modal, and crisis safety response', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/sermons', { waitUntil: 'domcontentloaded', timeout: 60_000 })

    await expect(
      page.getByRole('heading', { name: /Listen & Watch Inspired Teachings/i, level: 1 })
    ).toBeVisible({ timeout: 30_000 })

    // Inline AI Message Finder card
    const aiRegion = page.getByRole('region', { name: /Looking for a word/i })
    const inlineFinder = page.getByRole('search', { name: /Looking for a word/i })
    const inlineInput = inlineFinder.getByRole('searchbox')
    await expect(inlineInput).toBeVisible()
    await expect(inlineFinder.getByRole('button', { name: /Find messages/i })).toBeVisible()

    // Typing keystrokes must not re-shuffle suggestion chips or jump card height
    const suggestionButtons = aiRegion.locator('button[type="button"]')
    await expect(suggestionButtons.first()).toBeVisible()
    const initialChips = await suggestionButtons.allTextContents()
    await inlineInput.pressSequentially('I need strength', { delay: 25 })
    expect(await suggestionButtons.allTextContents()).toEqual(initialChips)

    // Crisis guardrail test via inline search (cold Next dev compile of API route takes ~25-30s)
    await inlineInput.fill('I feel hopeless and want to hurt myself')
    await inlineFinder.getByRole('button', { name: /Find messages/i }).click()

    await expect(page.getByRole('link', { name: /Emergency: 112/i })).toBeVisible({
      timeout: 45_000,
    })

    // Switch back to exact-word catalog search
    await page.getByRole('button', { name: /Browse all sermons/i }).click()
    await expect(
      page.getByPlaceholder(/Search by title, preacher, series, topic, or scripture/i)
    ).toBeVisible()

    // Topic tag filter strip shows at most 6 pills (All + 5 per page) and paginates when > 5 topics exist
    const topicToolbar = page.getByRole('group', { name: /Filter sermons by topic/i })
    if (await topicToolbar.isVisible().catch(() => false)) {
      const topicButtons = topicToolbar.locator('button[aria-pressed]')
      expect(await topicButtons.count()).toBeLessThanOrEqual(6)

      const nextTagPage = topicToolbar.getByRole('button', { name: 'Next topic tags' })
      if (await nextTagPage.isVisible().catch(() => false)) {
        const page1Labels = await topicButtons.allTextContents()
        await nextTagPage.click()
        const page2Labels = await topicButtons.allTextContents()
        expect(page2Labels).not.toEqual(page1Labels)
      }
    }

    // Scroll down so inline card exits viewport and floating AI Search button appears
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const fab = page.getByRole('button', { name: /AI Search/i })
    await expect(fab).toBeVisible({ timeout: 10_000 })

    // Open native <dialog> modal and verify Esc dismisses
    await fab.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Close/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('Dashboard /dashboard/sermons shows Sermons, Transcripts, and AI Search tabs with encrypted key controls', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await signInAs(page, 'team_lead')
    await page.goto('/dashboard/sermons', { waitUntil: 'domcontentloaded', timeout: 60_000 })

    await expect(page.getByRole('heading', { name: 'Sermons', level: 1 })).toBeVisible({
      timeout: 30_000,
    })

    // Verify 3 tabs render
    const sermonsTab = page.getByRole('tab', { name: /Sermons/i })
    const transcriptsTab = page.getByRole('tab', { name: /Transcripts/i })
    const aiSearchTab = page.getByRole('tab', { name: /AI Search/i })
    await expect(sermonsTab).toBeVisible()
    await expect(transcriptsTab).toBeVisible()
    await expect(aiSearchTab).toBeVisible()

    // Switch to Transcripts tab (wait for React client hydration before tab switch settles)
    await expect(async () => {
      await transcriptsTab.click()
      await expect(transcriptsTab).toHaveAttribute('aria-selected', 'true', { timeout: 1000 })
    }).toPass({ timeout: 15_000 })
    await expect(
      page.getByRole('heading', { name: /Captions & AI Theme Indexing/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Check for captions now/i })
    ).toBeVisible()

    // Switch to AI Search tab and verify write-only encrypted key override controls
    await aiSearchTab.click()
    await expect(aiSearchTab).toHaveAttribute('aria-selected', 'true')
    await expect(
      page.getByRole('heading', { name: /AI Provider & API Key Security/i })
    ).toBeVisible()

    const keyInput = page.getByLabel(/Encrypted Key Override/i)
    await expect(keyInput).toHaveAttribute('type', 'password')
    await expect(keyInput).toHaveValue('')
    await expect(
      page.getByRole('heading', { name: /Saved Searches Cache/i })
    ).toBeVisible()
  })

  test('Public /sermons and /dashboard/sermons fit 390px mobile viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/sermons', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(
      page.getByRole('heading', { name: /Listen & Watch Inspired Teachings/i, level: 1 })
    ).toBeVisible({ timeout: 30_000 })
    const publicOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )
    expect(publicOverflow).toBe(false)

    await signInAs(page, 'team_lead')
    await page.goto('/dashboard/sermons', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page.getByRole('heading', { name: 'Sermons', level: 1 })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByRole('tab', { name: /Sermons/i })).toBeVisible()
    const dashOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )
    expect(dashOverflow).toBe(false)
  })
})
