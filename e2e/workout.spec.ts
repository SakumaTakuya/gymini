import { test, expect, type Page } from '@playwright/test'

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

async function startSession(page: Page) {
  await page.getByRole('button', { name: /トレーニングを始める/ }).click()
  await page.getByPlaceholder('種目を追加...').fill('ベンチ')
  await page.getByText('ベンチプレス', { exact: true }).click()
}

async function recordSet(page: Page, weight: string, reps: string) {
  await page.locator('input[type="number"]').first().fill(weight)
  await page.locator('input[type="number"]').last().fill(reps)
  await page.getByRole('button', { name: '完了' }).click()
}

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

    // 終了ボタンを押してFRAME1に戻る
    await page.getByRole('button', { name: '終了' }).click()
    await expect(
      page.getByRole('button', { name: /トレーニングを始める/ }),
    ).toBeVisible()
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

test.describe('セット編集バグ修正', () => {
  const completedRows = (page: Page) => page.locator('.bg-zinc-50.rounded-xl')

  test('編集完了後にセットが元の位置に戻る（末尾追加されない）', async ({ page }) => {
    await startSession(page)
    await recordSet(page, '60', '10') // index 0
    await recordSet(page, '65', '8')  // index 1
    await recordSet(page, '70', '6')  // index 2

    // 1番目のセット（60kg）を編集
    await page.getByRole('button', { name: '編集' }).first().click()

    // 編集中: 完了済みは2行（65, 70）、入力欄は60
    await expect(completedRows(page)).toHaveCount(2)
    await expect(page.locator('input[type="number"]').first()).toHaveValue('60')

    // 62kgに変更して完了
    await page.locator('input[type="number"]').first().fill('62')
    await page.getByRole('button', { name: '完了' }).click()

    // 完了済みが3行に戻る
    await expect(completedRows(page)).toHaveCount(3)
    // 1行目が62kg（元の位置）であること
    await expect(completedRows(page).nth(0)).toContainText('62')
    // 2行目が65kg（末尾に移動していないこと）
    await expect(completedRows(page).nth(1)).toContainText('65')
    await expect(completedRows(page).nth(2)).toContainText('70')
  })

  test('編集中に別セットのペンを押してもセットが消えない', async ({ page }) => {
    await startSession(page)
    await recordSet(page, '60', '10') // A
    await recordSet(page, '65', '8')  // B

    // A（index 0）を編集開始 → sets=[B], pendingSet=A
    await page.getByRole('button', { name: '編集' }).first().click()
    await expect(completedRows(page)).toHaveCount(1)

    // B（現在 index 0）のペンを押す → A が復元され B が編集対象に
    await page.getByRole('button', { name: '編集' }).first().click()

    // A が完了済みに復元されている
    await expect(completedRows(page)).toHaveCount(1)
    await expect(completedRows(page).first()).toContainText('60')
    // B の値が入力欄に表示されている
    await expect(page.locator('input[type="number"]').first()).toHaveValue('65')
  })

  test('編集中に別エクサイズを追加してもセットが消えない', async ({ page }) => {
    await startSession(page)
    await recordSet(page, '60', '10')
    await recordSet(page, '65', '8')

    // 1番目のセットを編集開始（sets=[65], pendingSet=60）
    await page.getByRole('button', { name: '編集' }).first().click()
    await expect(completedRows(page)).toHaveCount(1)

    // 新種目を追加 → deactivateRecording が走り編集中セットが復元されるはず
    await page.getByPlaceholder('種目を追加...').fill('スクワット')
    await page.getByText('スクワット', { exact: true }).click()

    // ベンチプレスの完了済みセットが2件に戻っている
    await expect(completedRows(page)).toHaveCount(2)
    await expect(completedRows(page).nth(0)).toContainText('60')
    await expect(completedRows(page).nth(1)).toContainText('65')
  })

  test('編集中にカードを折りたたんでもセットが消えない', async ({ page }) => {
    await startSession(page)
    await recordSet(page, '60', '10')
    await recordSet(page, '65', '8')

    // 1番目のセットを編集開始
    await page.getByRole('button', { name: '編集' }).first().click()
    await expect(completedRows(page)).toHaveCount(1)

    // ヘッダーをクリックしてカードを折りたたむ
    await page.getByText('ベンチプレス').click()

    // 折りたたみ状態: 2 Sets と表示される（セットが失われていない）
    await expect(page.getByText(/2 Sets/)).toBeVisible()

    // 展開する
    await page.getByText('ベンチプレス').click()

    // 2件の完了済みセットが表示される
    await expect(completedRows(page)).toHaveCount(2)
  })

  test('編集中に終了ボタンを押してもセットが消えない', async ({ page }) => {
    await startSession(page)
    await recordSet(page, '60', '10')
    await recordSet(page, '65', '8')

    // 1番目のセットを編集開始（完了は押さない）
    await page.getByRole('button', { name: '編集' }).first().click()
    await expect(completedRows(page)).toHaveCount(1)

    // 完了を押さずに終了する
    await page.getByRole('button', { name: '終了' }).click()

    // 保存されたワークアウトに 2 セットが残っていること
    const sets = await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workouts')
      if (!raw) return null
      const workouts = JSON.parse(raw) as Array<{
        exercises: Array<{ sets: Array<{ weight: number; reps: number }> }>
      }>
      return workouts[0]?.exercises[0]?.sets ?? null
    })
    expect(sets).toEqual([
      { weight: 60, reps: 10 },
      { weight: 65, reps: 8 },
    ])
  })
})
