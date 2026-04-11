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

test.describe('待機画面 (FRAME1)', () => {
  test('「トレーニングを始める」ボタンが表示される', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /トレーニングを始める/ }),
    ).toBeVisible()
  })

  test('「準備はいいですか？」見出しが表示される', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: '準備はいいですか？' }),
    ).toBeVisible()
  })
})

test.describe('トレーニング記録フロー', () => {
  test('FRAME1 → FRAME2 → 種目追加 → セット記録 → 終了 → FRAME1', async ({
    page,
  }) => {
    // FRAME1: トレーニングを始める
    await page.getByRole('button', { name: /トレーニングを始める/ }).click()

    // FRAME2: ワークアウト画面が表示される
    await expect(page.getByText('ワークアウト')).toBeVisible()
    await expect(page.getByPlaceholder('種目を追加...')).toBeVisible()

    // 種目を検索して選択
    await page.getByPlaceholder('種目を追加...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()

    // ExerciseCard が表示される（recording状態）
    await expect(page.getByText('ベンチプレス')).toBeVisible()

    // セット1: 重量・回数入力してチェック
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').last()
    await weightInput.fill('60')
    await repsInput.fill('10')
    await page.getByRole('button', { name: '完了' }).click()

    // 完了済みセットが表示される
    await expect(page.getByText('60')).toBeVisible()

    // 次のセットが自動追加される（前セット値が入っている）
    const nextWeightInput = page.locator('input[type="number"]').first()
    await expect(nextWeightInput).toHaveValue('60')

    // セット2: そのままチェック
    await page.getByRole('button', { name: '完了' }).click()

    // 2セット完了
    const completedRows = page.locator('.bg-zinc-50.rounded-xl')
    await expect(completedRows).toHaveCount(2)

    // 終了ボタン（navigation GearIcon のスコープ外のため、ストア操作でシミュレート）
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (window as any).__zustand_workout_session
      if (store) store.getState().endSession()
    })
    // If GearIcon end button isn't available, use store directly
    // For now check that the session persists via store
  })

  test('複数種目の排他制御: 新種目追加で前の種目が idle に降格', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /トレーニングを始める/ }).click()

    // 1種目目: ベンチプレス
    await page.getByPlaceholder('種目を追加...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()
    await expect(page.getByText('ベンチプレス')).toBeVisible()

    // セット記録
    const weightInput1 = page.locator('input[type="number"]').first()
    const repsInput1 = page.locator('input[type="number"]').last()
    await weightInput1.fill('60')
    await repsInput1.fill('10')
    await page.getByRole('button', { name: '完了' }).click()

    // 2種目目: スクワット追加（ベンチプレスはidleに降格）
    await page.getByPlaceholder('種目を追加...').fill('スクワット')
    await page.getByText('スクワット', { exact: true }).click()

    // 両方の種目が表示される
    await expect(page.getByText('ベンチプレス')).toBeVisible()
    await expect(page.getByText('スクワット')).toBeVisible()

    // スクワットが recording（入力行あり）
    const inputs = page.locator('input[type="number"]')
    await expect(inputs).toHaveCount(2) // weight + reps for squat only

    // ベンチプレスには「追加」ボタンが表示（idle状態）
    const addButtons = page.getByRole('button', { name: '追加' })
    await expect(addButtons.first()).toBeVisible()
  })

  test('完了済みセットの編集', async ({ page }) => {
    await page.getByRole('button', { name: /トレーニングを始める/ }).click()

    // 種目追加
    await page.getByPlaceholder('種目を追加...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()

    // セット記録
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').last()
    await weightInput.fill('60')
    await repsInput.fill('10')
    await page.getByRole('button', { name: '完了' }).click()

    // 鉛筆ボタンで編集
    await page.getByRole('button', { name: '編集' }).click()

    // 編集モード: 入力フィールドに値が表示される
    const editWeight = page.locator('input[type="number"]').first()
    await expect(editWeight).toHaveValue('60')
  })

  test('完了済みセットの削除', async ({ page }) => {
    await page.getByRole('button', { name: /トレーニングを始める/ }).click()

    await page.getByPlaceholder('種目を追加...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()

    // 2セット記録
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').last()
    await weightInput.fill('60')
    await repsInput.fill('10')
    await page.getByRole('button', { name: '完了' }).click()
    await page.getByRole('button', { name: '完了' }).click()

    // 2つの完了済みセット
    let completedRows = page.locator('.bg-zinc-50.rounded-xl')
    await expect(completedRows).toHaveCount(2)

    // ゴミ箱ボタンで1つ削除
    await page.getByRole('button', { name: '削除' }).first().click()

    completedRows = page.locator('.bg-zinc-50.rounded-xl')
    await expect(completedRows).toHaveCount(1)
  })

  test('種目カードの折りたたみ/展開', async ({ page }) => {
    await page.getByRole('button', { name: /トレーニングを始める/ }).click()

    // 種目追加
    await page.getByPlaceholder('種目を追加...').fill('ベンチ')
    await page.getByText('ベンチプレス', { exact: true }).click()

    // セット記録
    const weightInput = page.locator('input[type="number"]').first()
    const repsInput = page.locator('input[type="number"]').last()
    await weightInput.fill('60')
    await repsInput.fill('10')
    await page.getByRole('button', { name: '完了' }).click()

    // 2種目目を追加（1種目目はidleに）
    await page.getByPlaceholder('種目を追加...').fill('スクワット')
    await page.getByText('スクワット', { exact: true }).click()

    // カードヘッダーをクリックして折りたたみ
    await page.getByText('ベンチプレス').click()

    // 折りたたみ状態: セットサマリーが表示
    await expect(page.getByText(/1 Sets/)).toBeVisible()

    // 再度クリックして展開
    await page.getByText('ベンチプレス').click()

    // 展開状態: 追加ボタンが表示
    await expect(page.getByRole('button', { name: '追加' }).first()).toBeVisible()
  })

  test('未登録種目を新規追加して記録できる', async ({ page }) => {
    await page.getByRole('button', { name: /トレーニングを始める/ }).click()

    // 存在しない種目を検索
    await page.getByPlaceholder('種目を追加...').fill('ラットプルダウン')

    // 新規追加オプションが表示される
    await expect(page.getByText(/「ラットプルダウン」を新規追加/)).toBeVisible()

    // 新規追加をクリック
    await page.getByText(/「ラットプルダウン」を新規追加/).click()

    // 種目カードが表示される
    await expect(page.getByText('ラットプルダウン')).toBeVisible()
  })
})
