import { test, expect } from '@playwright/test'

// テスト用の種目データ
const SEED_EXERCISES = [
  { id: 'ex-1', name: 'ベンチプレス' },
  { id: 'ex-2', name: 'スクワット' },
  { id: 'ex-3', name: 'デッドリフト' },
]

test.beforeEach(async ({ page }) => {
  // ページ読み込み前に localStorage を初期化
  await page.addInitScript((exercises) => {
    localStorage.setItem('gymini:exercises', JSON.stringify(exercises))
    localStorage.removeItem('gymini:workouts')
  }, SEED_EXERCISES)

  await page.goto('/')
})

// ワークアウトカードのタイトル（最初の種目名）を取得するロケーター
const workoutCardTitle = (page: Parameters<typeof test>[1] extends { page: infer P } ? P : never, name: string) =>
  page.getByText(name, { exact: true }).first()

test.describe('ワークアウト一覧', () => {
  test('記録がない場合は空メッセージを表示する', async ({ page }) => {
    await expect(page.getByText('記録がありません')).toBeVisible()
  })

  test('「記録開始」ボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '記録開始' })).toBeVisible()
  })
})

test.describe('ワークアウト記録フロー', () => {
  test('種目を追加してセットを記録し保存できる', async ({ page }) => {
    // 記録開始
    await page.getByRole('button', { name: '記録開始' }).click()
    await expect(page.getByText('記録', { exact: true })).toBeVisible()

    // 種目を検索して選択
    await page.getByPlaceholder('種目を検索...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()

    // ベンチプレスのセクションが表示される
    await expect(page.getByText('ベンチプレス', { exact: true })).toBeVisible()

    // 重量・回数を入力して追加
    await page.getByLabel('weight').last().fill('80')
    await page.getByLabel('reps').last().fill('10')
    await page.getByLabel('追加').last().click()

    // 確定済みセットが表示される (80 kg, 10 回)
    await expect(page.getByText('80', { exact: true })).toBeVisible()
    await expect(page.getByText('10', { exact: true })).toBeVisible()

    // 保存
    await page.getByRole('button', { name: '保存' }).click()

    // 一覧に戻り、記録が表示される
    await expect(page.getByText('ベンチプレス', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('記録がありません')).not.toBeVisible()
  })

  test('複数種目を連続して記録できる', async ({ page }) => {
    await page.getByRole('button', { name: '記録開始' }).click()

    // 1種目目: ベンチプレス
    await page.getByPlaceholder('種目を検索...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()
    await page.getByLabel('weight').last().fill('80')
    await page.getByLabel('reps').last().fill('10')
    await page.getByLabel('追加').last().click()

    // 2種目目: スクワット
    await page.getByPlaceholder('種目を検索...').fill('スクワット')
    await page.getByText('スクワット', { exact: true }).click()
    await page.getByLabel('weight').last().fill('100')
    await page.getByLabel('reps').last().fill('8')
    await page.getByLabel('追加').last().click()

    // 両方の種目が表示される
    await expect(page.getByText('ベンチプレス', { exact: true })).toBeVisible()
    await expect(page.getByText('スクワット', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText('ベンチプレス', { exact: true }).first()).toBeVisible()
  })

  test('キャンセルすると一覧に戻り記録は保存されない', async ({ page }) => {
    await page.getByRole('button', { name: '記録開始' }).click()

    await page.getByPlaceholder('種目を検索...').fill('スクワット')
    await page.getByText('スクワット', { exact: true }).click()

    await page.getByRole('button', { name: 'キャンセル' }).click()

    await expect(page.getByText('記録がありません')).toBeVisible()
  })
})

test.describe('ワークアウト削除', () => {
  test.beforeEach(async ({ page }) => {
    // 事前に1件記録する
    await page.getByRole('button', { name: '記録開始' }).click()
    await page.getByPlaceholder('種目を検索...').fill('デッドリフト')
    await page.getByText('デッドリフト', { exact: true }).click()
    await page.getByLabel('weight').last().fill('120')
    await page.getByLabel('reps').last().fill('5')
    await page.getByLabel('追加').last().click()
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText('デッドリフト', { exact: true }).first()).toBeVisible()
  })

  test('削除すると一覧から消える', async ({ page }) => {
    await page.getByRole('button', { name: '削除' }).click()
    await expect(page.getByText('記録がありません')).toBeVisible()
  })
})

test.describe('ワークアウト編集', () => {
  test.beforeEach(async ({ page }) => {
    // 事前に1件記録する
    await page.getByRole('button', { name: '記録開始' }).click()
    await page.getByPlaceholder('種目を検索...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()
    await page.getByLabel('weight').last().fill('80')
    await page.getByLabel('reps').last().fill('10')
    await page.getByLabel('追加').last().click()
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText('ベンチプレス', { exact: true }).first()).toBeVisible()
  })

  test('編集画面で種目を追加して保存できる', async ({ page }) => {
    await page.getByRole('button', { name: '編集' }).click()
    await expect(page.getByText('編集', { exact: true })).toBeVisible()

    // 2種目目を追加
    await page.getByPlaceholder('種目を検索...').fill('スクワット')
    await page.getByText('スクワット', { exact: true }).click()
    await page.getByLabel('weight').last().fill('100')
    await page.getByLabel('reps').last().fill('8')
    await page.getByLabel('追加').last().click()

    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText('ベンチプレス', { exact: true }).first()).toBeVisible()
  })

  test('確定済みセットをインラインで編集できる', async ({ page }) => {
    await page.getByRole('button', { name: '編集' }).click()

    // 確定済みセット行（80 kg）をタップして編集モードに
    await page.getByText('80', { exact: true }).click()

    // 重量を変更
    await page.getByLabel('weight').first().fill('90')
    await page.getByRole('button', { name: '確定' }).click()

    // 90 に変わっていることを確認
    await expect(page.getByText('90', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText('ベンチプレス', { exact: true }).first()).toBeVisible()
  })
})
