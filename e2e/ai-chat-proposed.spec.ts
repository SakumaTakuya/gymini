import { test, expect, type Route } from '@playwright/test'

const SEED_EXERCISES = [
  { id: 'ex-bench', name: 'ベンチプレス' },
  { id: 'ex-incline', name: 'インクラインダンベルプレス' },
]

const FAKE_SESSION = {
  isActive: true,
  startedAt: '2026-05-17T19:00:00+09:00',
  date: '2026-05-17',
  draftExercises: [],
}

function buildGeminiProposeResponse(
  rationale: string,
  options: Array<{
    id: string
    label: string
    kind: 'start-exercise' | 'ask-followup' | 'show-history'
    payload?: { exerciseName?: string; prompt?: string }
  }>,
) {
  // 既存 ai-chat-inline-edit.spec.ts と同じ構造（parts に text + functionCall を両方含める）
  return {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            { text: rationale },
            {
              functionCall: {
                name: 'proposeAction',
                args: { rationale, options },
              },
            },
          ],
        },
        finishReason: 'STOP',
      },
    ],
  }
}

function buildGeminiAddExerciseToSessionResponse(args: {
  exerciseId?: string
  exerciseName: string
  sets: Array<{ weight: number; reps: number }>
}) {
  return {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            { text: 'ベンチプレスを追加しました。重量と回数を入力してください' },
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

test.describe('AI チャット Proposed メッセージ (FR_037 / FR_038)', () => {
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
        localStorage.removeItem('gymini:chat')
      },
      { exercises: SEED_EXERCISES, session: FAKE_SESSION },
    )
    await page.reload()
  })

  test('未決定発話 → Proposed メッセージ + chip 3 個 → 1 個タップで通常カードを即時挿入', async ({
    page,
  }) => {
    await page.route(
      '**/generativelanguage.googleapis.com/**',
      async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            buildGeminiProposeResponse('胸の日ですね。候補です:', [
              {
                id: 'a1',
                label: 'ベンチプレスを始める',
                kind: 'start-exercise',
                payload: { exerciseName: 'ベンチプレス' },
              },
              {
                id: 'a2',
                label: 'インクラインダンベルプレスを始める',
                kind: 'start-exercise',
                payload: { exerciseName: 'インクラインダンベルプレス' },
              },
              {
                id: 'a3',
                label: '前回履歴を見る',
                kind: 'show-history',
                payload: { exerciseName: 'ベンチプレス' },
              },
            ]),
          ),
        })
      },
    )

    const input = page.getByPlaceholder('メッセージ or 種目名')
    await expect(input).toBeVisible()
    await input.fill('胸の日何やろう')
    await page.keyboard.press('Enter')

    // テキスト本文 + chip 3 個が表示される
    await expect(page.getByText('胸の日ですね。候補です:')).toBeVisible({
      timeout: 10000,
    })
    const startBenchChip = page.getByRole('button', {
      name: /ベンチプレスを始める/,
    })
    const startInclineChip = page.getByRole('button', {
      name: /インクラインダンベルプレスを始める/,
    })
    const historyChip = page.getByRole('button', { name: /前回履歴を見る/ })
    await expect(startBenchChip).toBeVisible()
    await expect(startInclineChip).toBeVisible()
    await expect(historyChip).toBeVisible()

    // この時点では draft は作られない
    const draftCount0 = await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')
      if (!raw) return 0
      return JSON.parse(raw).state?.draftExercises?.length ?? 0
    })
    expect(draftCount0).toBe(0)

    // ベンチプレス chip をタップ → 承認なしで通常カードが即時挿入される
    await startBenchChip.click()

    // recording 状態の空カードが現れる（AI 提案バッジは無い）
    await expect(
      page.getByRole('button', { name: 'ベンチプレス', exact: true }),
    ).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/AI 提案/)).toHaveCount(0)

    // localStorage 上の draftExercises に手入力と同じ通常カードとして 1 件追加
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      const draft = parsed.state?.draftExercises?.[0]
      return draft
        ? {
            exerciseName: draft.exerciseName,
            cardState: draft.cardState,
            sets: draft.sets,
          }
        : null
    })
    expect(saved).toEqual({
      exerciseName: 'ベンチプレス',
      cardState: 'recording',
      sets: [],
    })

    // 他の chip も disabled になっている
    await expect(startInclineChip).toBeDisabled()
    await expect(historyChip).toBeDisabled()
    await expect(startBenchChip).toBeDisabled()
  })

  test('リロードしても未消費 chip は機能する（chatStore 永続化）', async ({
    page,
  }) => {
    await page.route(
      '**/generativelanguage.googleapis.com/**',
      async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            buildGeminiProposeResponse('候補:', [
              {
                id: 'rb',
                label: 'ベンチプレスを始める',
                kind: 'start-exercise',
                payload: { exerciseName: 'ベンチプレス' },
              },
            ]),
          ),
        })
      },
    )

    const input = page.getByPlaceholder('メッセージ or 種目名')
    await input.fill('何やろう')
    await page.keyboard.press('Enter')

    await expect(page.getByText('候補:')).toBeVisible({ timeout: 10000 })

    // リロード
    await page.reload()

    // chip が永続化されて再表示される
    const chip = page.getByRole('button', { name: /ベンチプレスを始める/ })
    await expect(chip).toBeVisible({ timeout: 10000 })

    // タップで通常カードが即時挿入される
    await chip.click()
    await expect(
      page.getByRole('button', { name: 'ベンチプレス', exact: true }),
    ).toBeVisible({ timeout: 5000 })
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('gymini:workout-session')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed.state?.draftExercises?.[0]?.exerciseName ?? null
    })
    expect(saved).toBe('ベンチプレス')
  })

  test('ask-followup chip タップで擬似発話が送信され 2 段目の Gemini が呼ばれる', async ({
    page,
  }) => {
    let callCount = 0
    await page.route(
      '**/generativelanguage.googleapis.com/**',
      async (route: Route) => {
        callCount += 1
        if (callCount === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
              buildGeminiProposeResponse('候補:', [
                {
                  id: 'ask',
                  label: '重量を指定したい',
                  kind: 'ask-followup',
                  payload: { prompt: 'ベンチプレス 60kg 10 回でやる' },
                },
              ]),
            ),
          })
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            buildGeminiAddExerciseToSessionResponse({
              exerciseId: 'ex-bench',
              exerciseName: 'ベンチプレス',
              sets: [{ weight: 60, reps: 10 }],
            }),
          ),
        })
      },
    )

    const input = page.getByPlaceholder('メッセージ or 種目名')
    await input.fill('何やろう')
    await page.keyboard.press('Enter')

    const askChip = page.getByRole('button', { name: /重量を指定したい/ })
    await expect(askChip).toBeVisible({ timeout: 10000 })

    // chip タップで擬似発話が送信される
    await askChip.click()

    // ユーザー擬似発話メッセージが表示される
    await expect(page.getByText('ベンチプレス 60kg 10 回でやる')).toBeVisible({
      timeout: 5000,
    })

    // 2 段目で通常カードが即時挿入される
    await expect(
      page.getByRole('button', { name: 'ベンチプレス', exact: true }),
    ).toBeVisible({ timeout: 10000 })
    expect(callCount).toBe(2)
  })
})
