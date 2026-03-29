import { test, expect } from '@playwright/test'

const SEED_EXERCISES = [
  { id: 'ex-1', name: 'ベンチプレス' },
  { id: 'ex-2', name: 'スクワット' },
]

// Seed exercises and clear session AFTER page loads (avoids addInitScript running on reload)
async function resetState(page: Parameters<typeof test>[1] extends { page: infer P } ? P : never) {
  await page.evaluate((exercises) => {
    localStorage.setItem('gymini:exercises', JSON.stringify(exercises))
    localStorage.removeItem('gymini:workout-session')
  }, SEED_EXERCISES)
  await page.reload()
}

test.describe('ナビゲーション基本動作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await resetState(page)
  })

  test('①待機画面→トレーニング開始→FAB 表示', async ({ page }) => {
    // 待機画面: FABは不可視
    const fab = page.getByLabel('種目を追加')
    await expect(fab).toBeHidden()

    // トレーニングを開始
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()

    // セッション開始後: FABが表示される
    await expect(fab).toBeVisible()
  })

  test('②History タブ遷移→Training タブ戻りでセッション維持', async ({ page }) => {
    // セッション開始
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()

    // 種目を追加
    await page.getByPlaceholder('種目を検索...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()
    await expect(page.getByText('ベンチプレス', { exact: true })).toBeVisible()

    // History タブへ遷移
    await page.getByRole('button', { name: 'History' }).click()
    await expect(page.getByText('Coming Soon')).toBeVisible()

    // Training タブに戻る
    await page.getByRole('button', { name: 'Training' }).click()

    // セッション管理画面が表示される（種目も維持）
    await expect(page.getByText('ベンチプレス', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible()
  })

  test('③セッション終了→FAB 非表示', async ({ page }) => {
    const fab = page.getByLabel('種目を追加')

    // セッション開始
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()
    await expect(fab).toBeVisible()

    // 保存してセッション終了
    await page.getByRole('button', { name: '保存' }).click()

    // FABが非表示に
    await expect(fab).toBeHidden()
    // 待機画面に戻る
    await expect(page.getByRole('button', { name: 'トレーニングを開始' })).toBeVisible()
  })
})

test.describe('FABによる種目追加', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await resetState(page)
  })

  test('FABタップで種目追加モーダルが開く', async ({ page }) => {
    // セッション開始
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()

    // FABをタップ
    await page.getByLabel('種目を追加').click()

    // モーダルが開く（モーダルのヘッダーで確認）
    await expect(page.getByRole('heading', { name: '種目を追加' })).toBeVisible()
  })

  test('モーダルから種目を追加できる', async ({ page }) => {
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()

    await page.getByLabel('種目を追加').click()
    await expect(page.getByRole('heading', { name: '種目を追加' })).toBeVisible()
    // Modal's search input is nth(1) (TrainingPage in-page search is nth(0))
    await page.getByPlaceholder('種目を検索...').nth(1).fill('スクワット')
    await page.getByText('スクワット', { exact: true }).click()

    // モーダルが閉じ、種目が追加される
    await expect(page.getByText('スクワット', { exact: true })).toBeVisible()
  })
})

test.describe('セッション永続化 (NFR-002)', () => {
  test('ページリロード後もセッションデータが復元される', async ({ page }) => {
    await page.goto('/')
    await resetState(page)

    // セッション開始して種目追加
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()
    await page.getByPlaceholder('種目を検索...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()
    await expect(page.getByText('ベンチプレス', { exact: true })).toBeVisible()

    // リロード（セッションは localStorage に自動保存済み、exercises も seeded）
    await page.reload()

    // セッションが復元されてアクティブ画面が表示される
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible()
    await expect(page.getByText('ベンチプレス', { exact: true })).toBeVisible()
  })
})
