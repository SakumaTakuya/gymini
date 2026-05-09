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

function buildGeminiAddExerciseToSessionResponse(args: {
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
              text: 'ベンチプレスを以下の内容で追加しました。値は調整できます',
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

test.describe('AI 提案 draft カードでのインライン編集 (FR_013)', () => {
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

  test('AI 提案 → タイムライン上の AI 提案カードで編集 → 保存 → アクティブセッションに manual 反映', async ({
    page,
  }) => {
    await page.route(
      '**/generativelanguage.googleapis.com/**',
      async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            buildGeminiAddExerciseToSessionResponse({
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

    // AI 応答テキストがチャットに表示される
    await expect(
      page.getByText('ベンチプレスを以下の内容で追加しました'),
    ).toBeVisible({ timeout: 10000 })

    // トレーニングタブに移動して AI 提案カードを確認
    await page.getByRole('link', { name: 'トレ' }).click()
    await expect(page).toHaveURL(/#\/training/)
    await expect(page.getByText(/AI 提案/)).toBeVisible()

    // ai-suggested カード内の SingleExerciseEditor 入力（3 セット × 2 = 6 個）
    const setInputs = page.getByRole('spinbutton')
    await expect(setInputs).toHaveCount(6)

    // 1 セット目の重量を 60 → 65 に編集
    await setInputs.nth(0).fill('65')

    // 「保存」ボタンを押す
    await page.getByRole('button', { name: /保存/ }).click()

    // localStorage 上の active session の draftExercises に編集後 sets が
    // 反映され、origin が manual に昇格していること
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      const draft = parsed.state?.draftExercises?.[0]
      return draft ? { sets: draft.sets, origin: draft.origin } : null
    })
    expect(saved).toEqual({
      sets: [
        { weight: 65, reps: 10 },
        { weight: 60, reps: 10 },
        { weight: 60, reps: 10 },
      ],
      origin: 'manual',
    })
  })

  test('addExercise（種目マスター追加）はタイムラインに draft を作らずチャット応答のみを返す', async ({
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
                    { text: 'ラットプルダウンを種目マスターに追加しました。' },
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

    // AI 応答テキストがチャットに表示される
    await expect(
      page.getByText('ラットプルダウンを種目マスターに追加しました'),
    ).toBeVisible({ timeout: 10000 })

    // タイムラインに draft は作られない（addExercise はマスター追加のみ）
    const draftCount = await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')
      if (!raw) return 0
      const parsed = JSON.parse(raw)
      return parsed.state?.draftExercises?.length ?? 0
    })
    expect(draftCount).toBe(0)
  })
})
