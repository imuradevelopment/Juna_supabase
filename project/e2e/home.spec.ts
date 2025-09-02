import { test, expect } from '@playwright/test'

test('home page renders hero and nav', async ({ page }) => {
  await page.goto('/')
  // hero heading exists (fallback text when settings not yet loaded)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: '投稿一覧' }).first()).toBeVisible()
})
