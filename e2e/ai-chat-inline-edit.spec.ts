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

test.describe('AI 書き込みの即時カード挿入 (REQ_008 / FR_013)', () => {
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

  test('AI が sets 付きで呼ぶと、承認なしで通常カードが即時挿入される', async ({
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

    // ActiveSessionView の ChatInput からメッセージを送信
    const input = page.getByPlaceholder('メッセージ or 種目名')
    await expect(input).toBeVisible()
    await input.fill('ベンチ60kg10回3セットで追加')
    await page.keyboard.press('Enter')

    // AI 応答テキストと、手入力と同じ通常カードが即時挿入される
    await expect(
      page.getByText('ベンチプレスを以下の内容で追加しました'),
    ).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByRole('button', { name: 'ベンチプレス', exact: true }),
    ).toBeVisible()

    // 承認/破棄 UI は存在しない（バッジ・保存ボタン無し）
    await expect(page.getByText(/AI 提案/)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /保存/ })).toHaveCount(0)

    // active session の draftExercises に sets が即時反映され、idle カードになっている
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      const draft = parsed.state?.draftExercises?.[0]
      return draft ? { sets: draft.sets, cardState: draft.cardState } : null
    })
    expect(saved).toEqual({
      sets: [
        { weight: 60, reps: 10 },
        { weight: 60, reps: 10 },
        { weight: 60, reps: 10 },
      ],
      cardState: 'idle',
    })
  })

  test('addExercise（種目マスター追加）はタイムラインに draft を作らずチャット応答のみを返す', async ({
    page,
  }) => {
    // セッションはアクティブのまま（ChatInput を出すため）。
    // AI が addExercise を返した場合、draft は作られず chat メッセージのみ追加される。

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

    const input = page.getByPlaceholder('メッセージ or 種目名')
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

    const input = page.getByPlaceholder('メッセージ or 種目名')
    await input.fill('スクワット100kg5回')
    await page.keyboard.press('Enter')
    await expect(page.getByText('スクワットを追加しました')).toBeVisible({
      timeout: 10000,
    })

    // 順序検証：ベンチプレス（手動, 19:00）が最上部にあり、
    // AI 応答メッセージと AI が挿入したスクワットカードはそのあとに並ぶ。
    // useChatService.emitWriteResult は executeWriteTool（カード挿入）→ addMessage の順で
    // 呼ぶため draft.timestamp <= message.timestamp となり、スクワットカードが
    // 応答メッセージより先（または同位置）になることに注意。
    const benchY = await page
      .getByRole('button', { name: 'ベンチプレス', exact: true })
      .first()
      .evaluate((el) => el.getBoundingClientRect().top)
    const aiTextY = await page
      .getByText('スクワットを追加しました')
      .evaluate((el) => el.getBoundingClientRect().top)
    const squatY = await page
      .getByRole('button', { name: 'スクワット', exact: true })
      .evaluate((el) => el.getBoundingClientRect().top)
    expect(benchY).toBeLessThan(squatY)
    expect(benchY).toBeLessThan(aiTextY)
  })

  test('種目カードはそのセクション内をスクロール中、上部にピン留めされる（stacking sticky）', async ({
    page,
  }) => {
    // 各 section に 5 件の ChatMessage を挟むことで section 高さを稼ぎ、stickable range を
    // viewport 幅に依らず確保する（短い chat 1 件だけだと desktop で section が浅く、
    // 小さいスクロールでもカードが section bottom に押されて sticky が外れてしまう）。
    await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')!
      const parsed = JSON.parse(raw)
      const base = new Date('2026-05-04T19:00:00+09:00').getTime()
      parsed.state.draftExercises = [
        ['squat', 'スクワット'],
        ['dl', 'デッドリフト'],
        ['bench', 'ベンチプレス'],
      ].map(([id, name], i) => ({
        exerciseId: id,
        exerciseName: name,
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
        ],
        pendingSet: null,
        pendingSetDirty: false,
        cardState: 'idle',
        editingSetIndex: null,
        timestamp: new Date(base + i * 10 * 60_000).toISOString(),
      }))
      localStorage.setItem('gymini:workout-session', JSON.stringify(parsed))
      const messages = (
        [
          ['squat', 0],
          ['dl', 10],
          ['bench', 20],
        ] as const
      ).flatMap(([id, offsetMin]) =>
        Array.from({ length: 5 }, (_, j) => ({
          id: `${id}-msg-${j}`,
          role: 'assistant' as const,
          content: `${id} section message #${j}`,
          timestamp: new Date(
            base + (offsetMin + 1 + j) * 60_000,
          ).toISOString(),
        })),
      )
      localStorage.setItem(
        'gymini:chat',
        JSON.stringify({ state: { messages }, version: 1 }),
      )
    })
    await page.reload()

    const c1 = page.getByRole('button', { name: 'スクワット' })
    const c2 = page.getByRole('button', { name: 'デッドリフト' })
    await expect(c1).toBeVisible()

    const scrollContainerBy = async (amount: number) => {
      await page.evaluate(
        (delta) =>
          new Promise<void>((resolve) => {
            const container = document.querySelector(
              '.overflow-y-auto',
            ) as HTMLElement
            container.scrollBy(0, delta)
            requestAnimationFrame(() =>
              requestAnimationFrame(() => resolve()),
            )
          }),
        amount,
      )
    }

    // (1) section 1 内をスクロール（section bottom より十分手前で止める）。
    //     sticky が効いていれば c1 はヘッダー直下にピン留めされ top∈(0,220]、
    //     効いていなければ c1 は画面外上方へ流れて top<0 になる。
    await scrollContainerBy(200)
    const c1AfterStick = await c1.evaluate(
      (el) => el.getBoundingClientRect().top,
    )
    // sticky top-0 + AppHeader クリアランス (pt-content-top) + ExerciseCard p-5 の帯域に c1 がピン留めされている
    expect(c1AfterStick).toBeGreaterThan(0)
    expect(c1AfterStick).toBeLessThan(220)

    // (2) section 2 へハンドオフ: c2 を viewport y=200 付近 (sticky anchor 通過後) まで進める。
    //     c2 がピン留めに切り替わり、c1 は section 1 が終わったので押し出されている。
    //     c2 位置の読み取りとスクロールは同一 evaluate で行い IPC を 1 往復に抑える。
    await c2.evaluate(
      (el) =>
        new Promise<void>((resolve) => {
          const container = document.querySelector(
            '.overflow-y-auto',
          ) as HTMLElement
          container.scrollBy(0, el.getBoundingClientRect().top - 200)
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve()),
          )
        }),
    )
    const c1AfterHandoff = await c1.evaluate(
      (el) => el.getBoundingClientRect().top,
    )
    const c2AfterHandoff = await c2.evaluate(
      (el) => el.getBoundingClientRect().top,
    )
    expect(c1AfterHandoff).toBeLessThan(0)
    expect(c2AfterHandoff).toBeGreaterThan(0)
    expect(c2AfterHandoff).toBeLessThan(220)
  })
})
