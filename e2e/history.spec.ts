import { test, expect } from '@playwright/test'

function makeWorkout(date: string) {
  return {
    id: crypto.randomUUID(),
    date,
    exercises: [
      {
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 100, reps: 10 },
          { weight: 100, reps: 8 },
        ],
      },
    ],
    startedAt: `${date}T10:00:00.000Z`,
    endedAt: `${date}T11:00:00.000Z`,
    createdAt: `${date}T11:00:00.000Z`,
    updatedAt: `${date}T11:00:00.000Z`,
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('./#/history')
  await page.evaluate(() => {
    localStorage.removeItem('gymini:workouts')
    localStorage.removeItem('gymini:workout-session')
  })
  await page.reload()
})

test.describe('履歴画面 (FRAME3)', () => {
  test('カレンダーが表示される', async ({ page }) => {
    await page.goto('./#/history')
    await expect(page.getByLabel('前月')).toBeVisible()
    await expect(page.getByLabel('次月')).toBeVisible()
  })

  test('月遷移ができる', async ({ page }) => {
    await page.goto('./#/history')
    const header = page.locator('h2')
    const initialText = await header.textContent()

    // Go to previous month
    await page.getByLabel('前月').click()
    const afterPrev = await header.textContent()
    expect(afterPrev).not.toBe(initialText)

    // Go to next month (back to current)
    await page.getByLabel('次月').click()
    const afterNext = await header.textContent()
    expect(afterNext).toBe(initialText)
  })

  test('カレンダーを次月パネルへスクロールするとヘッダーが変わる', async ({ page }) => {
    await page.goto('./#/history')
    const header = page.locator('h2')
    const before = await header.textContent()
    const viewport = page.getByTestId('calendar-viewport')

    await viewport.evaluate((el: HTMLDivElement) => {
      el.scrollTo({ left: el.clientWidth * 2, behavior: 'smooth' })
    })

    await expect
      .poll(async () => await header.textContent(), { timeout: 3000 })
      .not.toBe(before)
  })

  test('記録なし日に空状態UIが表示される', async ({ page }) => {
    await page.goto('./#/history')
    await expect(page.getByTestId('empty-day-state')).toBeVisible()
    await expect(page.getByText('記録なし')).toBeVisible()
    await expect(page.getByText('追加')).toBeVisible()
  })

  test('記録あり日にサマリーが表示される', async ({ page }) => {
    const today = new Date()
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const workout = makeWorkout(date)

    // Set data and reload fresh
    await page.evaluate(
      (w) => {
        localStorage.setItem('gymini:workouts', JSON.stringify([w]))
      },
      workout,
    )
    await page.reload()
    await page.goto('./#/history?date=' + date)

    await expect(page.getByText('ベンチプレス')).toBeVisible()
    await expect(page.getByText('SET1')).toBeVisible()
  })

  test('記録あり日に赤ドットマーカーが表示される', async ({ page }) => {
    const today = new Date()
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const workout = makeWorkout(date)

    await page.evaluate(
      (w) => {
        localStorage.setItem('gymini:workouts', JSON.stringify([w]))
      },
      workout,
    )
    await page.reload()
    await page.goto('./#/history?date=' + date)

    await expect(page.getByTestId('workout-marker').first()).toBeVisible()
  })

  test('空状態の「追加」ボタンでトレーニング画面に遷移する', async ({ page }) => {
    await page.goto('./#/history')
    await expect(page.getByTestId('empty-day-state')).toBeVisible()

    await page.getByText('追加').click()
    await expect(page).toHaveURL(/#\/training/)
  })
})
