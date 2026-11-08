import { describe, it, expect, vi } from 'vitest'
import {
  INTENT_LABELS,
  IntentClassifierNotReadyError,
  LocalIntentClassifier,
  calibrateScores,
  classifierConfigSchema,
  decideIntents,
  fetchClassifierConfig,
  headProbabilities,
  meanPool,
  type ClassifierConfig,
  type IntentScores,
  type TextEmbedder,
} from './intentClassifier'

// テスト用の小さい分類器設定（埋め込み次元 2）。
// record は第1成分、history は第2成分に反応し、advice は温度 2 で較正される。
const config: ClassifierConfig = {
  classes: [...INTENT_LABELS],
  embeddingDim: 2,
  head: {
    coef: [
      [2, 0],
      [0, 2],
      [-2, 0],
      [0, -2],
      [0, 0],
    ],
    intercept: [0, 0, 0, 0, 0],
  },
  temperature: { record: 1, history: 1, advice: 2, edit: 1, other: 1 },
  thresholds: { record: 0.8, history: 0.8, advice: 0.8, edit: 0.8, other: 0.6 },
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

describe('meanPool', () => {
  it('attention mask が 1 のトークンだけを平均する', () => {
    const lastHidden = new Float32Array([1, 2, 3, 4, 5, 6])
    const mask = new Uint8Array([1, 1, 0])
    const emb = meanPool(lastHidden, 3, 2, mask)
    expect(Array.from(emb)).toEqual([2, 3])
  })

  it('マスクがすべて 0 の場合はゼロベクトルを返す', () => {
    const emb = meanPool(new Float32Array([1, 2, 3, 4]), 2, 2, new Uint8Array([0, 0]))
    expect(Array.from(emb)).toEqual([0, 0])
  })
})

describe('headProbabilities', () => {
  it('埋め込みとヘッド重みからクラス別確率を計算する', () => {
    const probs = headProbabilities(new Float32Array([1, 0]), config)
    expect(probs.record).toBeCloseTo(sigmoid(2))
    expect(probs.history).toBeCloseTo(sigmoid(0))
    expect(probs.advice).toBeCloseTo(sigmoid(-2))
    expect(probs.edit).toBeCloseTo(sigmoid(0))
    expect(probs.other).toBeCloseTo(sigmoid(0))
  })

  it('埋め込み次元が設定と異なる場合は例外を投げる', () => {
    expect(() => headProbabilities(new Float32Array([1, 0, 0]), config)).toThrow(RangeError)
  })
})

describe('calibrateScores', () => {
  it('温度で確率を較正する（温度 2 の advice は 0.5 側へ寄る）', () => {
    const raw: IntentScores = {
      record: sigmoid(2),
      history: 0.5,
      advice: sigmoid(-2),
      edit: 0.5,
      other: 0.5,
    }
    const cal = calibrateScores(raw, config)
    expect(cal.record).toBeCloseTo(sigmoid(2)) // 温度 1 は不変
    expect(cal.advice).toBeCloseTo(sigmoid(-1)) // logit(-2) / 2
  })
})

describe('decideIntents', () => {
  it('閾値を超えた意図を decided とし、候補は返さない', () => {
    const scores: IntentScores = { record: 0.9, history: 0.3, advice: 0.2, edit: 0.1, other: 0.4 }
    const { decided, candidates } = decideIntents(scores, config)
    expect(decided).toEqual(['record'])
    expect(candidates).toEqual([])
  })

  it('複数意図が閾値を超えたらすべて decided にする（マルチラベル）', () => {
    const scores: IntentScores = { record: 0.9, history: 0.85, advice: 0.2, edit: 0.1, other: 0.4 }
    const { decided } = decideIntents(scores, config)
    expect(decided).toEqual(['record', 'history'])
  })

  it('どの意図も閾値に達しない場合はスコア上位 2 件を候補として返す', () => {
    const scores: IntentScores = { record: 0.4, history: 0.3, advice: 0.7, edit: 0.1, other: 0.2 }
    const { decided, candidates } = decideIntents(scores, config)
    expect(decided).toEqual([])
    expect(candidates).toEqual(['advice', 'record'])
  })

  it('候補の同点はラベル定義順で安定させる', () => {
    const scores: IntentScores = { record: 0.3, history: 0.3, advice: 0.3, edit: 0.3, other: 0.3 }
    const { candidates } = decideIntents(scores, config)
    expect(candidates).toEqual(['record', 'history'])
  })
})

function fakeEmbedder(overrides: Partial<TextEmbedder> = {}): TextEmbedder {
  let loaded = false
  return {
    load: async () => {
      loaded = true
    },
    isLoaded: () => loaded,
    embed: async () => new Float32Array([1, 0]),
    ...overrides,
  }
}

describe('LocalIntentClassifier', () => {
  it('ready 前の classify は IntentClassifierNotReadyError を投げる', async () => {
    const clf = new LocalIntentClassifier({ embedder: fakeEmbedder(), config })
    await expect(clf.classify('ベンチ60kgやった')).rejects.toBeInstanceOf(
      IntentClassifierNotReadyError,
    )
  })

  it('ready 後の classify は較正済みスコアと decided を返す', async () => {
    const clf = new LocalIntentClassifier({ embedder: fakeEmbedder(), config })
    await expect(clf.ready()).resolves.toBe(true)
    const result = await clf.classify('ベンチ60kgやった')
    expect(result.scores.record).toBeCloseTo(sigmoid(2))
    expect(result.decided).toEqual(['record'])
    expect(result.candidates).toEqual([])
  })

  it('埋め込みモデルの読み込みに失敗したら ready は false を返す', async () => {
    const clf = new LocalIntentClassifier({
      embedder: fakeEmbedder({
        load: async () => {
          throw new Error('network')
        },
      }),
      config,
    })
    await expect(clf.ready()).resolves.toBe(false)
  })

  it('ready は読み込み済みなら即座に true を返す', async () => {
    const load = vi.fn(async () => {})
    const clf = new LocalIntentClassifier({
      embedder: fakeEmbedder({ load, isLoaded: () => true }),
      config,
    })
    await expect(clf.ready()).resolves.toBe(true)
    expect(load).not.toHaveBeenCalled()
  })
})

describe('classifierConfigSchema', () => {
  it('正しい形式の設定を受け付ける', () => {
    expect(classifierConfigSchema.parse(config)).toEqual(config)
  })

  it('必須キーが欠けた設定を拒否する', () => {
    expect(() => classifierConfigSchema.parse({ classes: [] })).toThrow()
  })
})

describe('fetchClassifierConfig', () => {
  it('同一オリジンから設定 JSON を取得して検証する', async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify(config), { status: 200 }),
    ) as unknown as typeof fetch
    const got = await fetchClassifierConfig('/gymini/models/intent/classifier.json', fetchFn)
    expect(got).toEqual(config)
    expect(fetchFn).toHaveBeenCalledWith('/gymini/models/intent/classifier.json')
  })

  it('HTTP エラーの場合は例外を投げる', async () => {
    const fetchFn = vi.fn(async () => new Response('not found', { status: 404 })) as unknown as typeof fetch
    await expect(fetchClassifierConfig('/x/classifier.json', fetchFn)).rejects.toThrow()
  })
})
