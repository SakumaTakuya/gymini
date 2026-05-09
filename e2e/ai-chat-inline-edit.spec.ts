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

  test('種目追加 → AI 発話 → タイムラインに時系列で並ぶ', async ({ page }) => {
    // 1. 手動で「ベンチプレス」を draft に追加（過去の timestamp）
    await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')!
      const parsed = JSON.parse(raw)
      parsed.state.draftExercises = [
        {
          exerciseId: 'ex-1',
          exerciseName: 'ベンチプレス',
          sets: [{ weight: 60, reps: 10 }],
          pendingSet: null,
          pendingSetDirty: false,
          cardState: 'idle',
          editingSetIndex: null,
          origin: 'manual',
          timestamp: '2026-05-04T19:00:00+09:00',
        },
      ]
      localStorage.setItem('gymini:workout-session', JSON.stringify(parsed))
    })
    await page.reload()

    // 2. AI チャットで「スクワット 100kg 5回」発話 → AI が addExerciseToSession を呼ぶ
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
                    { text: 'スクワットを追加しました' },
                    {
                      functionCall: {
                        name: 'addExerciseToSession',
                        args: {
                          exerciseId: 'ex-2',
                          exerciseName: 'スクワット',
                          sets: [{ weight: 100, reps: 5 }],
                        },
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
    const input = page.getByPlaceholder('メッセージを入力')
    await input.fill('スクワット100kg5回')
    await page.keyboard.press('Enter')
    await expect(page.getByText('スクワットを追加しました')).toBeVisible({
      timeout: 10000,
    })

    // 3. /training に戻る → タイムライン上で順序確認
    await page.getByRole('link', { name: 'トレ' }).click()
    await expect(page).toHaveURL(/#\/training/)

    // ベンチプレス（手動, 19:00）→ AI 応答（19:0x）→ スクワット ai-suggested（19:0x）の順
    const benchY = await page
      .getByRole('button', { name: 'ベンチプレス' })
      .first()
      .evaluate((el) => el.getBoundingClientRect().top)
    const aiTextY = await page
      .getByText('スクワットを追加しました')
      .evaluate((el) => el.getBoundingClientRect().top)
    const squatY = await page
      .getByText(/AI 提案/)
      .evaluate((el) => el.getBoundingClientRect().top)
    expect(benchY).toBeLessThan(aiTextY)
    expect(aiTextY).toBeLessThan(squatY)
  })

  test('cardState=recording のカードはスクロールしても sticky で上部に残る', async ({
    page,
  }) => {
    // 5 つの種目を draft に積む（スクロールが必要な高さ確保）。1 つ目を recording にする
    await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')!
      const parsed = JSON.parse(raw)
      const baseTimestamp = new Date('2026-05-04T19:00:00+09:00').getTime()
      parsed.state.draftExercises = [
        ['bench', 'ベンチプレス', 'recording'],
        ['squat', 'スクワット', 'idle'],
        ['dl', 'デッドリフト', 'idle'],
        ['ohp', 'オーバーヘッドプレス', 'idle'],
        ['row', 'ベントオーバーロウ', 'idle'],
      ].map(([id, name, state], i) => ({
        exerciseId: id,
        exerciseName: name,
        sets:
          state === 'recording'
            ? []
            : [
                { weight: 60, reps: 10 },
                { weight: 60, reps: 10 },
                { weight: 60, reps: 10 },
              ],
        pendingSet: state === 'recording' ? { weight: 0, reps: 0 } : null,
        pendingSetDirty: false,
        cardState: state,
        editingSetIndex: null,
        origin: 'manual',
        timestamp: new Date(baseTimestamp + i * 60_000).toISOString(),
      }))
      localStorage.setItem('gymini:workout-session', JSON.stringify(parsed))
    })
    await page.reload()

    const recordingCard = page.getByRole('button', { name: 'ベンチプレス' })
    await expect(recordingCard).toBeVisible()

    // 下部までスクロール
    await page.evaluate(() => {
      const container = document.querySelector('.overflow-y-auto')
      if (container) container.scrollTop = container.scrollHeight
    })
    await page.waitForTimeout(300)

    // recording カードがビューポート上部に留まっている（sticky が機能）。
    // 厳密な値は AppHeader の高さやカード内 padding に依存するため、
    // 「ビューポート上部 1/3 以内」という緩めの判定でリグレッションを検出する。
    const top = await recordingCard.evaluate(
      (el) => el.getBoundingClientRect().top,
    )
    const viewportHeight = page.viewportSize()?.height ?? 800
    expect(top).toBeLessThan(viewportHeight / 3)
  })
})
