import { test, expect } from '@playwright/test'

const SEED_EXERCISES = [
  { id: 'ex-1', name: 'ベンチプレス' },
  { id: 'ex-2', name: 'スクワット' },
  { id: 'ex-3', name: 'デッドリフト' },
]

test.describe('設定画面 - APIキー管理 (FR-003〜FR-006)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./')
    await page.evaluate(() => {
      localStorage.removeItem('gymini:api-key')
    })
    await page.goto('./#/settings')
    await expect(page.getByLabel('閉じる')).toBeVisible()
  })

  test('APIキーが未設定なら「未設定」ステータスと赤バッジ非表示（※バッジは /settings で非表示）', async ({ page }) => {
    await expect(page.getByText('未設定')).toBeVisible()
    await expect(page.getByRole('button', { name: 'APIキーを削除' })).toBeHidden()
  })

  test('APIキーを入力すると onChange で localStorage に保存され「接続済み」になる', async ({ page }) => {
    const input = page.getByLabel('Gemini APIキー')
    await input.fill('AIzaSy-e2e-test-key')

    await expect(page.getByText('接続済み')).toBeVisible()
    await expect(page.getByRole('button', { name: 'APIキーを削除' })).toBeVisible()

    const stored = await page.evaluate(() => localStorage.getItem('gymini:api-key'))
    expect(stored).toBe('AIzaSy-e2e-test-key')
  })

  test('目アイコンでマスク/表示を切り替えられる (FR-005)', async ({ page }) => {
    const input = page.getByLabel('Gemini APIキー')
    await expect(input).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'APIキーを表示' }).click()
    await expect(input).toHaveAttribute('type', 'text')

    await page.getByRole('button', { name: 'APIキーを非表示' }).click()
    await expect(input).toHaveAttribute('type', 'password')
  })

  test('削除ボタンで localStorage からクリアされ「未設定」に戻る', async ({ page }) => {
    await page.getByLabel('Gemini APIキー').fill('AIzaSy-will-be-deleted')
    await expect(page.getByText('接続済み')).toBeVisible()

    await page.getByRole('button', { name: 'APIキーを削除' }).click()

    await expect(page.getByText('未設定')).toBeVisible()
    const stored = await page.evaluate(() => localStorage.getItem('gymini:api-key'))
    expect(stored).toBeNull()
  })
})

test.describe('設定画面 - 種目マスター管理 (FR-007〜FR-009)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./')
    await page.evaluate((exercises) => {
      localStorage.setItem('gymini:exercises', JSON.stringify(exercises))
    }, SEED_EXERCISES)
    await page.goto('./#/settings')
    await expect(page.getByLabel('閉じる')).toBeVisible()
  })

  test('初期表示で全種目が並ぶ', async ({ page }) => {
    await expect(page.getByText('ベンチプレス')).toBeVisible()
    await expect(page.getByText('スクワット')).toBeVisible()
    await expect(page.getByText('デッドリフト')).toBeVisible()
  })

  test('検索クエリで種目がリアルタイム絞り込みされる (FR-008)', async ({ page }) => {
    await page.getByLabel('種目を検索').fill('ベンチ')

    await expect(page.getByText('ベンチプレス')).toBeVisible()
    await expect(page.getByText('スクワット')).toBeHidden()
    await expect(page.getByText('デッドリフト')).toBeHidden()
  })

  test('インラインフォームで新規種目を追加できる (FR-009)', async ({ page }) => {
    await page.getByRole('button', { name: '種目を追加' }).click()
    await page.getByLabel('新しい種目名').fill('チンニング')
    await page.getByRole('button', { name: '追加を確定' }).click()

    await expect(page.getByText('チンニング')).toBeVisible()
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('gymini:exercises') ?? '[]'),
    )
    expect(stored.some((e: { name: string }) => e.name === 'チンニング')).toBe(true)
  })

  test('種目をインライン編集で改名できる (FR-009)', async ({ page }) => {
    await page.getByRole('button', { name: 'ベンチプレスを編集' }).click()
    const editInput = page.getByLabel('種目名を編集')
    await editInput.fill('インクラインベンチ')
    await page.getByRole('button', { name: '編集を確定' }).click()

    await expect(page.getByText('インクラインベンチ')).toBeVisible()
    await expect(page.getByText('ベンチプレス')).toBeHidden()
  })

  test('編集モード内の削除ボタンで種目が一覧から消える (FR-009)', async ({ page }) => {
    // 削除は編集モードに入ってから行う（design-system 準拠）
    await page.getByRole('button', { name: 'デッドリフトを編集' }).click()
    await page.getByRole('button', { name: 'デッドリフトを削除' }).click()

    await expect(page.getByText('デッドリフト')).toBeHidden()
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('gymini:exercises') ?? '[]'),
    )
    expect(stored.some((e: { name: string }) => e.name === 'デッドリフト')).toBe(false)
  })
})
