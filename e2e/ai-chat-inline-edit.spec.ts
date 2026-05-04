import { test, expect, type Route } from '@playwright/test'

const SEED_EXERCISES = [
  { id: 'ex-1', name: 'ベンチプレス' },
  { id: 'ex-2', name: 'スクワット' },
]

const FAKE_SESSION = {
  isActive: true,
  startedAt: '2026-05-04T19:00:00+09:00',
  date: '2026-05-04',
  draftExercises: [],
}

function buildGeminiResponse(args: {
  exerciseId: string
  exerciseName: string
  sets: Array<{ weight: number; reps: number }>
}) {
  return {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'ベンチプレスを以下の内容で追加しますか？値は調整できます',
            },
            {
              functionCall: {
                name: 'addExerciseToSession',
                args,
              },
            },
          ],
        },
        finishReason: 'STOP',
      },
    ],
  }
}

test.describe('AI チャット内インラインセット入力フォーム (FR_013)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./')
    await page.evaluate(
      ({ exercises, session }) => {
        localStorage.setItem('gymini:exercises', JSON.stringify(exercises))
        localStorage.setItem('gymini:api-key', 'test-key')
        localStorage.setItem(
          'gymini:workout-session',
          JSON.stringify({ state: session, version: 0 }),
        )
        localStorage.removeItem('gymini:workouts')
      },
      { exercises: SEED_EXERCISES, session: FAKE_SESSION },
    )
    await page.reload()
  })

  test('AIが提案したセットをチャット内で編集してアクティブセッションに反映できる', async ({
    page,
  }) => {
    await page.route(
      '**/generativelanguage.googleapis.com/**',
      async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            buildGeminiResponse({
              exerciseId: 'ex-1',
              exerciseName: 'ベンチプレス',
              sets: [
                { weight: 60, reps: 10 },
                { weight: 60, reps: 10 },
                { weight: 60, reps: 10 },
              ],
            }),
          ),
        })
      },
    )

    // BottomNav の AI リンクから AI チャットへ
    await page.getByRole('link', { name: 'AI' }).click()
    await expect(page).toHaveURL(/#\/ai/)

    // メッセージを送信
    const input = page.getByPlaceholder('メッセージを入力')
    await expect(input).toBeVisible()
    await input.fill('ベンチ60kg10回3セットで追加')
    await page.keyboard.press('Enter')

    // AIの提案バブルにセット入力フォームが表示される
    await expect(page.getByText('ベンチプレスを以下の内容で追加')).toBeVisible({
      timeout: 10000,
    })

    // 6 個の数値 input が描画される（3 セット × weight + reps）
    const setInputs = page.locator(
      '.flex.items-center.gap-3 input[type="number"]',
    )
    await expect(setInputs).toHaveCount(6)

    // 1 セット目の重量を 60 → 65 に編集
    await setInputs.nth(0).fill('65')

    // 「追加する」ボタンを押す
    await page.getByRole('button', { name: /追加する/ }).click()

    // localStorage 上の active session の draftExercises に反映されている
    const savedSets = await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed.state?.draftExercises?.[0]?.sets ?? null
    })
    expect(savedSets).toEqual([
      { weight: 65, reps: 10 },
      { weight: 60, reps: 10 },
      { weight: 60, reps: 10 },
    ])
  })

  test('セット情報のないアクションでは編集フォームを表示しない（addExercise）', async ({
    page,
  }) => {
    // セッション非アクティブにしておく（addExercise 用）
    await page.evaluate(() => {
      localStorage.setItem(
        'gymini:workout-session',
        JSON.stringify({
          state: {
            isActive: false,
            startedAt: null,
            date: null,
            draftExercises: [],
          },
          version: 0,
        }),
      )
    })
    await page.reload()

    await page.route(
      '**/generativelanguage.googleapis.com/**',
      async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [
                    { text: 'ラットプルダウンを種目に追加しますか？' },
                    {
                      functionCall: {
                        name: 'addExercise',
                        args: { name: 'ラットプルダウン' },
                      },
                    },
                  ],
                },
                finishReason: 'STOP',
              },
            ],
          }),
        })
      },
    )

    await page.getByRole('link', { name: 'AI' }).click()
    await expect(page).toHaveURL(/#\/ai/)

    const input = page.getByPlaceholder('メッセージを入力')
    await expect(input).toBeVisible()
    await input.fill('ラットプルダウンを種目に追加して')
    await page.keyboard.press('Enter')

    await expect(
      page.getByText('ラットプルダウンを種目に追加しますか？'),
    ).toBeVisible({ timeout: 10000 })

    // 数値 input は描画されない
    const setInputs = page.locator(
      '.flex.items-center.gap-3 input[type="number"]',
    )
    await expect(setInputs).toHaveCount(0)

    // 「追加する」ボタンは存在する
    await expect(page.getByRole('button', { name: /追加する/ })).toBeVisible()
  })
})
