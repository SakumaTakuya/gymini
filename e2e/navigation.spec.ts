import { test, expect } from '@playwright/test'

test.describe('ナビゲーション基本動作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./')
  })

  test('① ルートアクセスで /training にリダイレクト', async ({ page }) => {
    await expect(page).toHaveURL(/#\/training/)
    await expect(page.getByText('トレーニング')).toBeVisible()
  })

  test('② BottomNav でタブ遷移: トレ → 履歴 → AI', async ({ page }) => {
    // Initially on training
    await expect(page.getByText('トレーニング')).toBeVisible()

    // Navigate to history
    await page.getByRole('link', { name: '履歴' }).click()
    await expect(page).toHaveURL(/#\/history/)
    await expect(page.getByText('履歴ページ')).toBeVisible()

    // Navigate to AI
    await page.getByRole('link', { name: 'AI' }).click()
    await expect(page).toHaveURL(/#\/ai/)
    await expect(page.getByText('AI チャットページ')).toBeVisible()

    // Navigate back to training
    await page.getByRole('link', { name: 'トレ' }).click()
    await expect(page).toHaveURL(/#\/training/)
  })

  test('③ 歯車アイコン → 設定画面 → X ボタンで戻る', async ({ page }) => {
    // Navigate to settings via gear icon
    const gearLink = page.locator('a[href*="settings"]')
    await gearLink.click()
    await expect(page).toHaveURL(/#\/settings/)
    await expect(page.getByText('設定')).toBeVisible()

    // BottomNav should not be visible on settings page
    await expect(page.getByRole('link', { name: 'トレ' })).not.toBeVisible()

    // Click X button to go back
    await page.getByLabel('閉じる').click()
    await expect(page).toHaveURL(/#\/training/)
  })

  test('④ ブラウザバックボタンで settings から戻れる (FR-005)', async ({ page }) => {
    // Go to history first, then settings
    await page.getByRole('link', { name: '履歴' }).click()
    await expect(page).toHaveURL(/#\/history/)

    const gearLink = page.locator('a[href*="settings"]')
    await gearLink.click()
    await expect(page).toHaveURL(/#\/settings/)

    // Browser back
    await page.goBack()
    await expect(page).toHaveURL(/#\/history/)
  })

  test('⑤ 未知ルートで /training にリダイレクト (FR-013)', async ({ page }) => {
    await page.goto('./#/unknown-route')
    await expect(page).toHaveURL(/#\/training/)
  })
})

test.describe('BottomNav レイアウト', () => {
  test('FRAME1-4 では BottomNav + GearIcon が表示', async ({ page }) => {
    await page.goto('./')

    // Training page
    await expect(page.getByRole('link', { name: 'トレ' })).toBeVisible()
    await expect(page.getByRole('link', { name: '履歴' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'AI' })).toBeVisible()

    // History page
    await page.getByRole('link', { name: '履歴' }).click()
    await expect(page.getByRole('link', { name: 'トレ' })).toBeVisible()

    // AI page
    await page.getByRole('link', { name: 'AI' }).click()
    await expect(page.getByRole('link', { name: 'トレ' })).toBeVisible()
  })

  test('FRAME5 (settings) では BottomNav が非表示 (FR-008)', async ({ page }) => {
    await page.goto('./#/settings')
    await expect(page.getByText('設定')).toBeVisible()
    await expect(page.getByRole('link', { name: 'トレ' })).not.toBeVisible()
  })
})
