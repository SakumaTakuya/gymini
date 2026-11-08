import { z } from 'zod'

// ローカル意図分類（docs/prd/intent-router/index.md FR_001 / FR_002）。
// ブラウザ内で埋め込みモデル + ロジスティック回帰ヘッドにより
// record / history / advice / edit / other をマルチラベル分類する。
// 推論はすべて端末内で完結し、入力テキストを外部へ送信しない（B-001）。

export const INTENT_LABELS = ['record', 'history', 'advice', 'edit', 'other'] as const

export type IntentLabel = (typeof INTENT_LABELS)[number]

export type IntentScores = Record<IntentLabel, number>

export interface ClassificationResult {
  /** クラス別の較正済み確率 */
  scores: IntentScores
  /** クラス別閾値を超え、自動でルーティングする意図 */
  decided: IntentLabel[]
  /** decided が空のときに候補チップとして提示する意図（スコア上位 2 件） */
  candidates: IntentLabel[]
}

/** classifier.json（public/models/intent/）の形式。ヘッド重み・温度・閾値を持つ。 */
export interface ClassifierConfig {
  /** head.coef / intercept の行順に対応するクラス一覧 */
  classes: IntentLabel[]
  embeddingDim: number
  head: {
    coef: number[][]
    intercept: number[]
  }
  temperature: Record<IntentLabel, number>
  thresholds: Record<IntentLabel, number>
}

const labelScoresSchema = z.object({
  record: z.number(),
  history: z.number(),
  advice: z.number(),
  edit: z.number(),
  other: z.number(),
})

export const classifierConfigSchema = z.object({
  classes: z.array(z.enum(INTENT_LABELS)),
  embeddingDim: z.number().int().positive(),
  head: z.object({
    coef: z.array(z.array(z.number())),
    intercept: z.array(z.number()),
  }),
  temperature: labelScoresSchema,
  thresholds: labelScoresSchema,
})

export class IntentClassifierNotReadyError extends Error {
  constructor(message = 'intent classifier is not ready') {
    super(message)
    this.name = 'IntentClassifierNotReadyError'
  }
}

/** テキストを埋め込みベクトルへ変換する抽象。実装は transformersEmbedder.ts。 */
export interface TextEmbedder {
  load(): Promise<void>
  isLoaded(): boolean
  embed(text: string): Promise<Float32Array>
}

export interface IntentClassifier {
  /** モデルの読み込みを試み、使える状態なら true。失敗しても例外は投げない。 */
  ready(): Promise<boolean>
  classify(text: string): Promise<ClassificationResult>
}

const PROB_EPSILON = 1e-6

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

/**
 * attention mask で重み付けした mean pooling。
 * SetFit のヘッドは正規化なしの mean pooling 埋め込みで学習されているため、
 * ここでも正規化は行わない（classifier.json の前提）。
 */
export function meanPool(
  lastHidden: ArrayLike<number>,
  seqLen: number,
  dim: number,
  attentionMask: ArrayLike<number>,
): Float32Array {
  const out = new Float32Array(dim)
  let maskSum = 0
  for (let s = 0; s < seqLen; s++) {
    const m = attentionMask[s]
    maskSum += m
    if (m === 0) continue
    for (let d = 0; d < dim; d++) {
      out[d] += lastHidden[s * dim + d] * m
    }
  }
  const denom = Math.max(maskSum, 1e-9)
  for (let d = 0; d < dim; d++) {
    out[d] /= denom
  }
  return out
}

/** 埋め込みにロジスティック回帰ヘッドを適用し、クラス別確率（較正前）を返す。 */
export function headProbabilities(
  embedding: ArrayLike<number>,
  config: ClassifierConfig,
): IntentScores {
  if (embedding.length !== config.embeddingDim) {
    throw new RangeError(
      `embedding dim ${embedding.length} does not match config ${config.embeddingDim}`,
    )
  }
  const scores = {} as IntentScores
  config.classes.forEach((label, i) => {
    const coef = config.head.coef[i]
    let logit = config.head.intercept[i]
    for (let d = 0; d < config.embeddingDim; d++) {
      logit += coef[d] * embedding[d]
    }
    scores[label] = sigmoid(logit)
  })
  return scores
}

/** クラス別温度による温度スケーリングで確率を較正する。 */
export function calibrateScores(raw: IntentScores, config: ClassifierConfig): IntentScores {
  const out = {} as IntentScores
  for (const label of INTENT_LABELS) {
    const p = Math.min(Math.max(raw[label], PROB_EPSILON), 1 - PROB_EPSILON)
    const logit = Math.log(p / (1 - p))
    out[label] = sigmoid(logit / config.temperature[label])
  }
  return out
}

/** 較正済みスコアとクラス別閾値から、自動ルーティング先と候補チップを決める。 */
export function decideIntents(
  scores: IntentScores,
  config: ClassifierConfig,
): { decided: IntentLabel[]; candidates: IntentLabel[] } {
  const decided = INTENT_LABELS.filter((label) => scores[label] >= config.thresholds[label])
  if (decided.length > 0) {
    return { decided, candidates: [] }
  }
  const candidates = [...INTENT_LABELS]
    .sort(
      (a, b) =>
        scores[b] - scores[a] || INTENT_LABELS.indexOf(a) - INTENT_LABELS.indexOf(b),
    )
    .slice(0, 2)
  return { decided, candidates }
}

export class LocalIntentClassifier implements IntentClassifier {
  private readonly embedder: TextEmbedder
  private readonly config: ClassifierConfig

  constructor(deps: { embedder: TextEmbedder; config: ClassifierConfig }) {
    this.embedder = deps.embedder
    this.config = deps.config
  }

  async ready(): Promise<boolean> {
    if (this.embedder.isLoaded()) return true
    try {
      await this.embedder.load()
      return true
    } catch {
      return false
    }
  }

  async classify(text: string): Promise<ClassificationResult> {
    if (!this.embedder.isLoaded()) {
      throw new IntentClassifierNotReadyError()
    }
    const embedding = await this.embedder.embed(text)
    const scores = calibrateScores(headProbabilities(embedding, this.config), this.config)
    const { decided, candidates } = decideIntents(scores, this.config)
    return { scores, decided, candidates }
  }
}

/** 同一オリジンで配信される classifier.json を取得し、形式を検証する。 */
export async function fetchClassifierConfig(
  url: string,
  fetchFn: typeof fetch = fetch,
): Promise<ClassifierConfig> {
  const res = await fetchFn(url)
  if (!res.ok) {
    throw new Error(`classifier config fetch failed: ${res.status}`)
  }
  return classifierConfigSchema.parse(await res.json()) as ClassifierConfig
}
