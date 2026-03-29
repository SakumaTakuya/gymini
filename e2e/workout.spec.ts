import { test, expect } from '@playwright/test'

const SEED_EXERCISES = [
  { id: 'ex-1', name: 'ベンチプレス' },
  { id: 'ex-2', name: 'スクワット' },
  { id: 'ex-3', name: 'デッドリフト' },
]

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate((exercises) => {
    localStorage.setItem('gymini:exercises', JSON.stringify(exercises))
    localStorage.removeItem('gymini:workouts')
    localStorage.removeItem('gymini:workout-session')
  }, SEED_EXERCISES)
  await page.reload()
})

// Helper: add a set using the in-page search (exact label match avoids FAB)
async function addSet(page: Parameters<typeof test>[1] extends { page: infer P } ? P : never, weight: string, reps: string) {
  const weightInput = page.getByLabel('weight', { exact: true }).last()
  const repsInput = page.getByLabel('reps', { exact: true }).last()
  await weightInput.fill(weight)
  await expect(weightInput).toHaveValue(weight)
  await repsInput.fill(reps)
  await expect(repsInput).toHaveValue(reps)
  // Use exact: true to match aria-label="追加", NOT aria-label="種目を追加" (FAB)
  await page.getByRole('button', { name: '追加', exact: true }).last().click()
}

test.describe('待機画面', () => {
  test('「トレーニングを開始」ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'トレーニングを開始' })).toBeVisible()
  })

  test('Training / History タブが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Training' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'History' })).toBeVisible()
  })
})

test.describe('トレーニング記録フロー', () => {
  test('種目を追加してセットを記録し保存できる', async ({ page }) => {
    // トレーニングを開始
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()
    await expect(page.getByText('記録', { exact: true })).toBeVisible()

    // 種目を検索して選択（in-page search）
    await page.getByPlaceholder('種目を検索...').first().fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()

    // ベンチプレスのセクションが表示される
    await expect(page.getByText('ベンチプレス', { exact: true })).toBeVisible()

    // 重量・回数を入力して追加
    await addSet(page, '80', '10')

    // 確定済みセットが表示される (80 kg, 10 回)
    await expect(page.locator('span').filter({ hasText: '80' }).first()).toBeVisible()

    // 保存
    await page.getByRole('button', { name: '保存' }).click()

    // 待機画面に戻る
    await expect(page.getByRole('button', { name: 'トレーニングを開始' })).toBeVisible()
  })

  test('複数種目を連続して記録できる', async ({ page }) => {
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()

    // 1種目目: ベンチプレス
    await page.getByPlaceholder('種目を検索...').first().fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()
    await addSet(page, '80', '10')

    // 2種目目: スクワット
    await page.getByPlaceholder('種目を検索...').first().fill('スクワット')
    await page.getByText('スクワット', { exact: true }).click()
    await expect(page.getByText('スクワット', { exact: true })).toBeVisible()
    await addSet(page, '100', '8')

    // 両方の種目が表示される
    await expect(page.getByText('ベンチプレス', { exact: true })).toBeVisible()
    await expect(page.getByText('スクワット', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByRole('button', { name: 'トレーニングを開始' })).toBeVisible()
  })

  test('キャンセルすると待機画面に戻り記録は保存されない', async ({ page }) => {
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()

    await page.getByPlaceholder('種目を検索...').first().fill('スクワット')
    await page.getByText('スクワット', { exact: true }).click()

    await page.getByRole('button', { name: 'キャンセル' }).click()

    await expect(page.getByRole('button', { name: 'トレーニングを開始' })).toBeVisible()
  })
})

test.describe('確定済みセット編集', () => {
  test('確定済みセットをインラインで編集できる', async ({ page }) => {
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()

    await page.getByPlaceholder('種目を検索...').first().fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()
    await addSet(page, '80', '10')

    // 確定済みセット行（80 kg）をタップして編集モードに
    await expect(page.locator('span').filter({ hasText: '80' }).first()).toBeVisible()
    await page.locator('span').filter({ hasText: '80' }).first().click()

    // 重量を変更
    await page.getByLabel('weight', { exact: true }).first().fill('90')
    await page.getByRole('button', { name: '確定' }).click()

    // 90 に変わっていることを確認
    await expect(page.locator('span').filter({ hasText: '90' }).first()).toBeVisible()

    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByRole('button', { name: 'トレーニングを開始' })).toBeVisible()
  })
})
