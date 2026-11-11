import { describe, it, expect, vi, beforeEach } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ClassifierConfig, IntentLabel } from './intentClassifier'
import { INTENT_LABELS } from './intentClassifier'

// @huggingface/transformers をモックし、埋め込み器の配線（モデル読み込み・
// トークナイズ・プーリング呼び出し）だけを検証する。実モデルでの推論検証は
// PoC スパイク側で実施済み。
const fakeState = {
  mask: [1, 1] as number[],
  lastHidden: [1, 2, 3, 4] as number[],
  tokenizerCalls: [] as unknown[][],
  modelCalls: [] as unknown[][],
}

vi.mock('@huggingface/transformers', () => {
  const env: Record<string, unknown> = {
    backends: { onnx: { wasm: { wasmPaths: '' } } },
  }
  const AutoTokenizer = {
    from_pretrained: vi.fn(async (...args: unknown[]) => {
      fakeState.tokenizerCalls.push(args)
      return async (texts: string | string[]) => {
        const seq = fakeState.mask.length
        const n = Array.isArray(texts) ? texts.length : 1
        return {
          input_ids: { data: new BigInt64Array(n * seq).fill(1n), dims: [n, seq] },
          attention_mask: {
            data: new BigInt64Array(
              Array.from({ length: n }, () => fakeState.mask).flat().map(BigInt),
            ),
            dims: [n, seq],
          },
        }
      }
    }),
  }
  const AutoModel = {
    from_pretrained: vi.fn(async (...args: unknown[]) => {
      fakeState.modelCalls.push(args)
      return async () => ({
        last_hidden_state: {
          data: new Float32Array(fakeState.lastHidden),
          dims: [1, fakeState.mask.length, 2],
        },
      })
    }),
  }
  return { env, AutoTokenizer, AutoModel }
})

import { env } from '@huggingface/transformers'
import { createLocalIntentClassifier, createTransformersEmbedder } from './transformersEmbedder'

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
  temperature: { record: 1, history: 1, advice: 1, edit: 1, other: 1 },
  thresholds: { record: 0.8, history: 0.8, advice: 0.8, edit: 0.8, other: 0.5 },
}

beforeEach(() => {
  fakeState.mask = [1, 1]
  fakeState.lastHidden = [1, 2, 3, 4]
  fakeState.tokenizerCalls = []
  fakeState.modelCalls = []
})

describe('createTransformersEmbedder', () => {
  it('load でローカルモデルを有効化し q8 で読み込み、リモート取得を無効化する', async () => {
    const emb = createTransformersEmbedder({ baseUrl: '/gymini/' })
    await emb.load()
    // transformers.js はブラウザ環境で allowLocalModels が既定 false
    // （allowLocalModels: !(IS_BROWSER_ENV || ...)）。リモートだけ無効化
    // すると両方無効になり from_pretrained が全て失敗するため、
    // ローカルは明示的に有効化する（A-002 はリモート無効化で維持）。
    expect(env.allowLocalModels).toBe(true)
    expect(env.allowRemoteModels).toBe(false)
    expect(env.localModelPath).toBe('/gymini/')
    expect(env.backends.onnx.wasm?.wasmPaths).toBe('/gymini/ort/')
    expect(fakeState.tokenizerCalls).toEqual([['models/intent']])
    expect(fakeState.modelCalls).toEqual([['models/intent', { dtype: 'q8' }]])
    expect(emb.isLoaded()).toBe(true)
  })

  it('同一オリジン配信用の WASM 資産が public/ort に揃っている', () => {
    // wasmPaths が指す先の実ファイル。依存更新時に再コピーし忘れると
    // 実行時に初めて落ちるため、テストで存在を保証する。
    // transformers.js 4.3.2 の Web ビルドが実際に読み込むのは asyncify 版
    // （ort-wasm-simd-threaded.asyncify.mjs）。jsep 版は #146 で同梱した
    // ものだが現行ビルドは要求しないため、asyncify 版の存在が必須。
    // eslint-disable-next-line no-undef -- vitest 実行時の作業ディレクトリ（リポジトリルート）
    const ortDir = join(process.cwd(), 'public/ort')
    expect(existsSync(join(ortDir, 'ort-wasm-simd-threaded.asyncify.mjs'))).toBe(true)
    expect(existsSync(join(ortDir, 'ort-wasm-simd-threaded.asyncify.wasm'))).toBe(true)
    expect(existsSync(join(ortDir, 'ort-wasm-simd-threaded.jsep.wasm'))).toBe(true)
    expect(existsSync(join(ortDir, 'ort-wasm-simd-threaded.jsep.mjs'))).toBe(true)
  })

  it('load は冪等で、2 回呼んでもモデルを再読み込みしない', async () => {
    const emb = createTransformersEmbedder({ baseUrl: '/gymini/' })
    await emb.load()
    await emb.load()
    expect(fakeState.tokenizerCalls).toHaveLength(1)
    expect(fakeState.modelCalls).toHaveLength(1)
  })

  it('load 前の embed は例外を投げる', async () => {
    const emb = createTransformersEmbedder({ baseUrl: '/gymini/' })
    await expect(emb.embed('テスト')).rejects.toThrow()
  })

  it('embed は attention mask で mean pooling した埋め込みを返す', async () => {
    const emb = createTransformersEmbedder({ baseUrl: '/gymini/' })
    await emb.load()
    const v = await emb.embed('ベンチ60kgやった')
    expect(Array.from(v)).toEqual([2, 3])
  })

  it('パディングされたトークンはプーリングから除外される', async () => {
    fakeState.mask = [1, 0]
    const emb = createTransformersEmbedder({ baseUrl: '/gymini/' })
    await emb.load()
    const v = await emb.embed('ベンチ')
    expect(Array.from(v)).toEqual([1, 2])
  })
})

describe('createLocalIntentClassifier', () => {
  it('設定 JSON を取得し、分類器として動作する', async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify(config), { status: 200 }),
    ) as unknown as typeof fetch
    const clf = await createLocalIntentClassifier({ baseUrl: '/gymini/', fetchFn })
    expect(fetchFn).toHaveBeenCalledWith('/gymini/models/intent/classifier.json')
    await expect(clf.ready()).resolves.toBe(true)
    const result = await clf.classify('ベンチ60kgやった')
    // 埋め込み [2, 3] → record の logit は 4、history は 6 で history が決定的に高い
    expect(result.decided).toContain('history' as IntentLabel)
  })
})
