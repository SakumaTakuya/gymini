import { SchemaType, type FunctionDeclaration } from '@google/generative-ai'

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

export type ReadToolName = (typeof READ_TOOL_NAMES)[number]
export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number]
export type ToolName = ReadToolName | WriteToolName

export function isWriteTool(name: string): name is WriteToolName {
  return (WRITE_TOOL_NAMES as readonly string[]).includes(name)
}

export function isReadTool(name: string): name is ReadToolName {
  return (READ_TOOL_NAMES as readonly string[]).includes(name)
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
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  weight: {
                    type: SchemaType.NUMBER,
                    description: '重量 (kg)',
                  },
                  reps: {
                    type: SchemaType.NUMBER,
                    description: '回数',
                  },
                },
                required: ['weight', 'reps'],
              },
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
    'アクティブなワークアウトセッションに種目を追加する。ユーザー確認が必要',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      exerciseId: {
        type: SchemaType.STRING,
        description: '種目ID',
      },
      exerciseName: {
        type: SchemaType.STRING,
        description: '種目名',
      },
    },
    required: ['exerciseId', 'exerciseName'],
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
]
