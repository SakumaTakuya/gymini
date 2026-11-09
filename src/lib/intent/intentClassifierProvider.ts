import type { IntentClassifier } from './intentClassifier'
import { createLocalIntentClassifier } from './transformersEmbedder'

// ローカル分類器のシングルトン供給（intent-router FR_006）。
// モデル（37MB）の読み込みはバックグラウンドで行い、完了するまでは
// getReadyIntentClassifier() が null を返す。呼び出し側は null の間、
// 従来経路（キーありなら LLM、なしなら現行の案内）で処理する。

let readyClassifier: IntentClassifier | null = null
let warmUpPromise: Promise<void> | null = null

export function warmUpIntentClassifier(): void {
  // 単体テスト環境では実モデルを読みに行かない（分類器は DI で差し替える）
  if (import.meta.env.MODE === 'test') return
  if (warmUpPromise) return
  warmUpPromise = (async () => {
    try {
      const classifier = await createLocalIntentClassifier({
        baseUrl: import.meta.env.BASE_URL,
      })
      if (await classifier.ready()) {
        readyClassifier = classifier
      }
    } catch {
      // 読み込み失敗時は従来経路のまま。次回以降も再試行しない
      // （同一セッションで 37MB の再ダウンロードを繰り返さないため）。
    }
  })()
}

export function getReadyIntentClassifier(): IntentClassifier | null {
  return readyClassifier
}

export function resetIntentClassifierProviderForTests(): void {
  readyClassifier = null
  warmUpPromise = null
}
