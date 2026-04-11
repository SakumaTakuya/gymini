import { test, expect } from '@playwright/test'

const SEED_EXERCISES = [
  { id: 'ex-1', name: 'ベンチプレス' },
  { id: 'ex-2', name: 'スクワット' },
]

async function resetState(page: Parameters<typeof test>[1] extends { page: infer P } ? P : never) {
  await page.evaluate((exercises) => {
    localStorage.setItem('gymini:exercises', JSON.stringify(exercises))
    localStorage.removeItem('gymini:workout-session')
  }, SEED_EXERCISES)
  await page.reload()
}

// NOTE: exercise-master and workout features not yet implemented - these tests are pending
test.describe('設定画面の種目管理 (Task 4.1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await resetState(page)
  })

  test.fixme('種目一覧が表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByText('種目マスター')).toBeVisible()
    await expect(page.getByText('ベンチプレス')).toBeVisible()
    await expect(page.getByText('スクワット')).toBeVisible()
  })

  test.fixme('手動追加→追加された種目が表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByPlaceholder('種目名を入力...').fill('デッドリフト')
    await page.getByRole('button', { name: '追加' }).click()
    await expect(page.getByText('デッドリフト')).toBeVisible()
  })

  test.fixme('手動削除→消える', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByText('ベンチプレス')).toBeVisible()
    await page.getByRole('button', { name: /削除 ベンチプレス/ }).click()
    await expect(page.getByText('ベンチプレス')).toBeHidden()
    await expect(page.getByText('スクワット')).toBeVisible()
  })

  test.fixme('重複名で追加するとエラーが表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByPlaceholder('種目名を入力...').fill('ベンチプレス')
    await page.getByRole('button', { name: '追加' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})

test.describe('自動登録フロー (Task 4.2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await resetState(page)
  })

  test.fixme('TrainingPage: 未登録種目を検索→新規追加→セッションに追加', async ({ page }) => {
    // Start session
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()

    // Search for unregistered exercise
    await page.getByPlaceholder('種目を検索...').fill('デッドリフト')

    // Auto-register option should appear
    const registerOption = page.getByText(/「デッドリフト」を新しい種目として追加/)
    await expect(registerOption).toBeVisible()
    await registerOption.click()

    // Exercise should be added to session
    await expect(page.getByText('デッドリフト')).toBeVisible()
  })

  test.fixme('AddExerciseModal: 未登録種目を検索→新規追加→セッションに追加', async ({ page }) => {
    // Start session
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()

    // Open modal via FAB
    await page.getByLabel('種目を追加').click()
    await expect(page.getByRole('heading', { name: '種目を追加' })).toBeVisible()

    // Search for unregistered exercise in modal
    await page.getByPlaceholder('種目を検索...').nth(1).fill('ラットプルダウン')

    // Auto-register option should appear
    const registerOption = page.getByText(/「ラットプルダウン」を新しい種目として追加/)
    await expect(registerOption).toBeVisible()
    await registerOption.click()

    // Modal closes and exercise is added
    await expect(page.getByText('ラットプルダウン')).toBeVisible()
  })

  test.fixme('自動登録した種目が設定画面にも反映される', async ({ page }) => {
    // Start session and auto-register
    await page.getByRole('button', { name: 'トレーニングを開始' }).click()
    await page.getByPlaceholder('種目を検索...').fill('デッドリフト')
    await page.getByText(/「デッドリフト」を新しい種目として追加/).click()

    // Navigate to settings
    await page.getByRole('button', { name: 'Settings' }).click()

    // Auto-registered exercise should appear in master list
    await expect(page.getByText('デッドリフト')).toBeVisible()
  })
})

