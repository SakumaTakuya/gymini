import { SchemaType, type FunctionDeclaration, type Schema } from '@google/generative-ai'

// Gemini Function Declaration の {weight, reps} セット定義を共通化。saveWorkout と
// addExerciseToSession の両方で同じ形状を要求するため、重複定義を避ける。
const SET_ITEM_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    weight: { type: SchemaType.NUMBER, description: '重量 (kg)' },
    reps: { type: SchemaType.NUMBER, description: '回数' },
  },
  required: ['weight', 'reps'],
}

export const READ_TOOL_NAMES = [
  'getRecentWorkouts',
  'getWorkoutsByExercise',
  'getWorkoutsByDate',
  'getWorkoutSummary',
  'getExercises',
] as const

export const WRITE_TOOL_NAMES = [
  'saveWorkout',
  'addExercise',
  'addExerciseToSession',
] as const

export const PROPOSE_TOOL_NAMES = ['proposeAction'] as const

export type ReadToolName = (typeof READ_TOOL_NAMES)[number]
export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number]
export type ProposeToolName = (typeof PROPOSE_TOOL_NAMES)[number]
export type ToolName = ReadToolName | WriteToolName | ProposeToolName

export function isWriteTool(name: string): name is WriteToolName {
  return (WRITE_TOOL_NAMES as readonly string[]).includes(name)
}

export function isReadTool(name: string): name is ReadToolName {
  return (READ_TOOL_NAMES as readonly string[]).includes(name)
}

export function isProposeTool(name: string): name is ProposeToolName {
  return (PROPOSE_TOOL_NAMES as readonly string[]).includes(name)
}

const getRecentWorkoutsDeclaration: FunctionDeclaration = {
  name: 'getRecentWorkouts',
  description: '最新n件のワークアウト記録を取得する',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      count: {
        type: SchemaType.NUMBER,
        description: '取得件数（デフォルト: 5）',
      },
    },
  },
}

const getWorkoutsByExerciseDeclaration: FunctionDeclaration = {
  name: 'getWorkoutsByExercise',
  description:
    '指定した種目名で部分一致検索し、該当するワークアウト記録を取得する',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      exerciseName: {
        type: SchemaType.STRING,
        description: '種目名（部分一致）',
      },
    },
    required: ['exerciseName'],
  },
}

const getWorkoutsByDateDeclaration: FunctionDeclaration = {
  name: 'getWorkoutsByDate',
  description: '指定した日付のワークアウト記録を取得する',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      date: {
        type: SchemaType.STRING,
        description: '日付（YYYY-MM-DD形式）',
      },
    },
    required: ['date'],
  },
}

const getWorkoutSummaryDeclaration: FunctionDeclaration = {
  name: 'getWorkoutSummary',
  description: '指定期間のワークアウト集計を取得する',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      periodType: {
        type: SchemaType.STRING,
        format: 'enum',
        enum: ['week', 'month'],
        description: '集計期間の種類',
      },
      startDate: {
        type: SchemaType.STRING,
        description: '開始日（YYYY-MM-DD形式）',
      },
      endDate: {
        type: SchemaType.STRING,
        description: '終了日（YYYY-MM-DD形式）',
      },
    },
    required: ['periodType', 'startDate', 'endDate'],
  },
}

const getExercisesDeclaration: FunctionDeclaration = {
  name: 'getExercises',
  description: '登録済みの種目一覧を取得する',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
}

const saveWorkoutDeclaration: FunctionDeclaration = {
  name: 'saveWorkout',
  description:
    '会話の内容からワークアウト記録を保存する。ユーザー確認が必要',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      date: {
        type: SchemaType.STRING,
        description: '日付（YYYY-MM-DD形式）',
      },
      exercises: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            exerciseName: {
              type: SchemaType.STRING,
              description: '種目名',
            },
            sets: {
              type: SchemaType.ARRAY,
              items: SET_ITEM_SCHEMA,
              description: 'セットの配列',
            },
          },
          required: ['exerciseName', 'sets'],
        },
        description: '種目とセットの配列',
      },
    },
    required: ['date', 'exercises'],
  },
}

const addExerciseDeclaration: FunctionDeclaration = {
  name: 'addExercise',
  description: '種目マスターに新しい種目を追加する。ユーザー確認が必要',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      name: {
        type: SchemaType.STRING,
        description: '種目名',
      },
    },
    required: ['name'],
  },
}

const addExerciseToSessionDeclaration: FunctionDeclaration = {
  name: 'addExerciseToSession',
  description:
    'アクティブなワークアウトセッションに種目を追加する。exerciseId を指定すれば既存種目を追加。未指定で exerciseName のみ指定した場合は種目マスターに新規登録してからセッションに追加する（未登録種目を始めるとき）。任意で sets を指定すると、その重量・回数のセット群を含めて追加でき、ユーザーは draft カード上で値を編集できる',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      exerciseId: {
        type: SchemaType.STRING,
        description: '種目ID（任意）。未指定の場合は exerciseName でマスターに新規登録',
      },
      exerciseName: {
        type: SchemaType.STRING,
        description: '種目名',
      },
      sets: {
        type: SchemaType.ARRAY,
        description:
          'セットの配列（任意）。指定するとアクティブセッションに重量・回数つきで追加され、ユーザーは draft カードで値を編集できる',
        items: SET_ITEM_SCHEMA,
      },
    },
    required: ['exerciseName'],
  },
}

const proposeActionDeclaration: FunctionDeclaration = {
  name: 'proposeAction',
  description:
    'ユーザーが種目を未決定のまま選択肢を求めた場合（例: 「何やろう」「胸の日」「メニュー提案して」）に呼び出す、副作用のない提案ツール。draft カードは作らず、ユーザーがチップをタップして初めて write/read tool が実行される。具体的な値（kg/回数/セット数）や種目名 1 個の断定発話に対しては呼ばないこと（その場合は addExerciseToSession / saveWorkout を使う）',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      rationale: {
        type: SchemaType.STRING,
        description:
          '提案の理由・本文。ChatBubble に表示されるテキスト。短い導入 + 候補の概要を 1〜2 文で書く',
      },
      options: {
        type: SchemaType.ARRAY,
        description: '提案チップ群（1〜5 個、推奨は 2〜4 個）',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: {
              type: SchemaType.STRING,
              description: 'チップを一意に識別する ID（任意の短い文字列で良い）',
            },
            label: {
              type: SchemaType.STRING,
              description:
                'チップに表示するテキスト。例: "ベンチプレスを始める" / "前回の履歴を見る" / "重量を指定したい"',
            },
            kind: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['start-exercise', 'ask-followup', 'show-history'],
              description:
                'start-exercise: アクティブセッションに種目を追加する（payload.exerciseName 必須）。show-history: 種目別履歴を表示する（payload.exerciseName 必須）。ask-followup: 擬似発話としてユーザー側から再入力する（payload.prompt 推奨）',
            },
            payload: {
              type: SchemaType.OBJECT,
              description: 'kind に応じたペイロード',
              properties: {
                exerciseName: {
                  type: SchemaType.STRING,
                  description:
                    'start-exercise / show-history で必須。提案する種目名',
                },
                exerciseId: {
                  type: SchemaType.STRING,
                  description:
                    'start-exercise で既知の場合のみ。未指定なら exerciseName でマスター登録から行う',
                },
                prompt: {
                  type: SchemaType.STRING,
                  description:
                    'ask-followup の場合に、ユーザーが投げる擬似発話の文面を書く（無ければ label が使われる）',
                },
              },
            },
          },
          required: ['id', 'label', 'kind'],
        },
      },
    },
    required: ['rationale', 'options'],
  },
}

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  getRecentWorkoutsDeclaration,
  getWorkoutsByExerciseDeclaration,
  getWorkoutsByDateDeclaration,
  getWorkoutSummaryDeclaration,
  getExercisesDeclaration,
  saveWorkoutDeclaration,
  addExerciseDeclaration,
  addExerciseToSessionDeclaration,
  proposeActionDeclaration,
]
