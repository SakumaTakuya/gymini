import {
  IntentClassifierNotReadyError,
  LocalIntentClassifier,
  fetchClassifierConfig,
  meanPool,
  type IntentClassifier,
  type TextEmbedder,
} from './intentClassifier'

// transformers.js（onnxruntime-web / WASM）で同一オリジン配信の ONNX モデルを
// 読み込む埋め込み器。モデルは public/models/intent/ に配置し、外部ホスト
// からは取得しない（A-002 / intent-router FR_006）。

const MODEL_ID = 'models/intent'
const MAX_LENGTH = 128

interface TfTensor {
  data: ArrayLike<number> | ArrayLike<bigint>
  dims: number[]
}

type TfTokenizer = (
  text: string,
  options: { padding: boolean; truncation: boolean; max_length: number },
) => Promise<{ input_ids: TfTensor; attention_mask: TfTensor; token_type_ids?: TfTensor }>

type TfModel = (inputs: Record<string, TfTensor>) => Promise<{ last_hidden_state: TfTensor }>

interface TfModule {
  env: {
    allowRemoteModels: boolean
    localModelPath: string
    backends: {
      onnx: {
        wasm: {
          wasmPaths: string
        }
      }
    }
  }
  AutoTokenizer: { from_pretrained: (id: string) => Promise<TfTokenizer> }
  AutoModel: {
    from_pretrained: (id: string, options: { dtype: string }) => Promise<TfModel>
  }
}

export function createTransformersEmbedder(options: { baseUrl: string }): TextEmbedder {
  let tokenizer: TfTokenizer | null = null
  let model: TfModel | null = null
  let loadPromise: Promise<void> | null = null

  async function doLoad(): Promise<void> {
    const tf = (await import('@huggingface/transformers')) as unknown as TfModule
    tf.env.allowRemoteModels = false
    tf.env.localModelPath = options.baseUrl
    // ONNX Runtime の WASM 一式も同一オリジン（public/ort/）から読む。
    // 既定では jsDelivr CDN を参照してしまい、A-002（外部通信は Gemini のみ）
    // に反する。public/ort/ のファイルは @huggingface/transformers が内包する
    // onnxruntime-web の dist からコピーしたもので、依存を更新したら再コピーする。
    tf.env.backends.onnx.wasm.wasmPaths = `${options.baseUrl}ort/`
    tokenizer = await tf.AutoTokenizer.from_pretrained(MODEL_ID)
    model = await tf.AutoModel.from_pretrained(MODEL_ID, { dtype: 'q8' })
  }

  return {
    load(): Promise<void> {
      if (!loadPromise) {
        loadPromise = doLoad().catch((err: unknown) => {
          // 失敗時は次回の ready() で再試行できるようキャッシュを破棄する
          loadPromise = null
          tokenizer = null
          model = null
          throw err
        })
      }
      return loadPromise
    },
    isLoaded(): boolean {
      return tokenizer !== null && model !== null
    },
    async embed(text: string): Promise<Float32Array> {
      if (!tokenizer || !model) {
        throw new IntentClassifierNotReadyError('embedder is not loaded')
      }
      const enc = await tokenizer(text, {
        padding: true,
        truncation: true,
        max_length: MAX_LENGTH,
      })
      const inputs: Record<string, TfTensor> = {
        input_ids: enc.input_ids,
        attention_mask: enc.attention_mask,
      }
      if (enc.token_type_ids) {
        inputs.token_type_ids = enc.token_type_ids
      }
      const output = await model(inputs)
      const lhs = output.last_hidden_state
      const [, seqLen, dim] = lhs.dims
      const maskData = enc.attention_mask.data
      const mask: number[] = []
      for (let i = 0; i < maskData.length; i++) {
        mask.push(Number(maskData[i]))
      }
      return meanPool(lhs.data as ArrayLike<number>, seqLen, dim, mask)
    },
  }
}

/**
 * ローカル分類器を組み立てる。設定 JSON の取得だけを行い、モデルの
 * 読み込みは IntentClassifier.ready() まで遅延する（FR_006 のフォールバック
 * 前提: 読み込み完了までは従来経路で処理する）。
 */
export async function createLocalIntentClassifier(options: {
  baseUrl: string
  fetchFn?: typeof fetch
}): Promise<IntentClassifier> {
  const config = await fetchClassifierConfig(
    `${options.baseUrl}models/intent/classifier.json`,
    options.fetchFn,
  )
  const embedder = createTransformersEmbedder({ baseUrl: options.baseUrl })
  return new LocalIntentClassifier({ embedder, config })
}
