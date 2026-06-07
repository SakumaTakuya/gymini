import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import {
  PROPOSE_TOOL_NAMES,
  READ_TOOL_NAMES,
  TOOL_DECLARATIONS,
  WRITE_TOOL_NAMES,
  isProposeTool,
  isReadTool,
  isWriteTool,
  type ToolName,
} from './toolDefinitions'
import {
  saveWorkoutArgsSchema,
  addExerciseArgsSchema,
  addExerciseToSessionArgsSchema,
} from '../schemas/tools'

describe('toolDefinitions', () => {
  test('正確に 9 つのツールを定義する（read 5 + write 3 + propose 1）', () => {
    expect(TOOL_DECLARATIONS).toHaveLength(9)
  })

  test('全ツール名が一意である', () => {
    const names = TOOL_DECLARATIONS.map((d) => d.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test('期待するすべてのツール名を網羅する', () => {
    const names = TOOL_DECLARATIONS.map((d) => d.name).sort()
    const expected = [
      ...READ_TOOL_NAMES,
      ...WRITE_TOOL_NAMES,
      ...PROPOSE_TOOL_NAMES,
    ].sort()
    expect(names).toEqual(expected)
  })

  test('各ツールが name・description・parameters を持つ', () => {
    for (const decl of TOOL_DECLARATIONS) {
      expect(decl.name).toBeTruthy()
      expect(decl.description).toBeTruthy()
      expect(decl.parameters).toBeDefined()
    }
  })

  test('isWriteTool が write ツールを識別する', () => {
    expect(isWriteTool('saveWorkout')).toBe(true)
    expect(isWriteTool('addExercise')).toBe(true)
    expect(isWriteTool('addExerciseToSession')).toBe(true)
    expect(isWriteTool('addExerciseAndLog')).toBe(false)
    expect(isWriteTool('getRecentWorkouts')).toBe(false)
    expect(isWriteTool('unknown')).toBe(false)
  })

  test('isReadTool が read ツールを識別する', () => {
    expect(isReadTool('getRecentWorkouts')).toBe(true)
    expect(isReadTool('getWorkoutsByExercise')).toBe(true)
    expect(isReadTool('getWorkoutsByDate')).toBe(true)
    expect(isReadTool('getWorkoutSummary')).toBe(true)
    expect(isReadTool('getExercises')).toBe(true)
    expect(isReadTool('saveWorkout')).toBe(false)
    expect(isReadTool('proposeAction')).toBe(false)
    expect(isReadTool('unknown')).toBe(false)
  })

  test('isProposeTool が propose ツールを識別する', () => {
    expect(isProposeTool('proposeAction')).toBe(true)
    expect(isProposeTool('saveWorkout')).toBe(false)
    expect(isProposeTool('addExerciseToSession')).toBe(false)
    expect(isProposeTool('getRecentWorkouts')).toBe(false)
    expect(isProposeTool('unknown')).toBe(false)
  })

  test('proposeAction が rationale と options を必須とし、options.kind を enum 化している', () => {
    const decl = TOOL_DECLARATIONS.find((d) => d.name === 'proposeAction')
    expect(decl).toBeDefined()
    expect(decl?.parameters?.required).toEqual(['rationale', 'options'])
    const optionsSchema = decl?.parameters?.properties?.options as
      | { items?: { properties?: Record<string, { enum?: string[] }> } }
      | undefined
    const kindEnum = optionsSchema?.items?.properties?.kind?.enum
    expect(kindEnum).toEqual(
      expect.arrayContaining([
        'start-exercise',
        'ask-followup',
        'show-history',
      ]),
    )
  })

  test('saveWorkout が date と exercises を必須とする', () => {
    const decl = TOOL_DECLARATIONS.find((d) => d.name === 'saveWorkout')
    expect(decl?.parameters?.required).toEqual(['date', 'exercises'])
  })

  test('addExercise が name を必須とする', () => {
    const decl = TOOL_DECLARATIONS.find((d) => d.name === 'addExercise')
    expect(decl?.parameters?.required).toEqual(['name'])
  })

  test('addExerciseToSession が exerciseName のみを必須とする（exerciseId は任意）', () => {
    const decl = TOOL_DECLARATIONS.find(
      (d) => d.name === 'addExerciseToSession',
    )
    expect(decl?.parameters?.required).toEqual(['exerciseName'])
  })

  test('getWorkoutSummary が periodType・startDate・endDate を必須とする', () => {
    const decl = TOOL_DECLARATIONS.find((d) => d.name === 'getWorkoutSummary')
    expect(decl?.parameters?.required).toEqual([
      'periodType',
      'startDate',
      'endDate',
    ])
  })

  // SSOT drift detection: toolExecutor が依存する Zod スキーマ（schemas/tools.ts）と、
  // Gemini に送る FunctionDeclaration が乖離していないことを保証する。完全な
  // Zod→Gemini Schema 変換は Gemini 形式が独自で変換コードがリスクになるため避け、
  // 「最上位プロパティ名」と「必須フィールド」だけを drift test で固定する
  // （最も起きやすい drift パターン）。
  describe('drift detection (Zod ↔ FunctionDeclaration)', () => {
    function getDecl(name: ToolName) {
      const decl = TOOL_DECLARATIONS.find((d) => d.name === name)
      if (!decl) throw new Error(`FunctionDeclaration not found: ${name}`)
      return decl
    }
    function requiredFromZod(schema: z.ZodObject<z.ZodRawShape>): string[] {
      return Object.entries(schema.shape)
        .filter(
          ([, value]) =>
            !(value as z.ZodTypeAny).safeParse(undefined).success,
        )
        .map(([key]) => key)
        .sort()
    }
    function declRequired(name: ToolName): string[] {
      return [...(getDecl(name).parameters?.required ?? [])].sort()
    }
    function declProperties(name: ToolName): string[] {
      return Object.keys(getDecl(name).parameters?.properties ?? {}).sort()
    }

    test('saveWorkout: 最上位プロパティ名・required が Zod と一致', () => {
      expect(declProperties('saveWorkout')).toEqual(
        Object.keys(saveWorkoutArgsSchema.shape).sort(),
      )
      expect(declRequired('saveWorkout')).toEqual(
        requiredFromZod(saveWorkoutArgsSchema),
      )
    })

    test('addExercise: 最上位プロパティ名・required が Zod と一致', () => {
      expect(declProperties('addExercise')).toEqual(
        Object.keys(addExerciseArgsSchema.shape).sort(),
      )
      expect(declRequired('addExercise')).toEqual(
        requiredFromZod(addExerciseArgsSchema),
      )
    })

    test('addExerciseToSession: 最上位プロパティ名・required が Zod と一致', () => {
      expect(declProperties('addExerciseToSession')).toEqual(
        Object.keys(addExerciseToSessionArgsSchema.shape).sort(),
      )
      expect(declRequired('addExerciseToSession')).toEqual(
        requiredFromZod(addExerciseToSessionArgsSchema),
      )
    })
  })
})
