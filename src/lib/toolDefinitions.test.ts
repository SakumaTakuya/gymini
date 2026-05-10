import { describe, expect, test } from 'vitest'
import {
  READ_TOOL_NAMES,
  TOOL_DECLARATIONS,
  WRITE_TOOL_NAMES,
  isReadTool,
  isWriteTool,
} from './toolDefinitions'

describe('toolDefinitions', () => {
  test('正確に 8 つのツールを定義する', () => {
    expect(TOOL_DECLARATIONS).toHaveLength(8)
  })

  test('全ツール名が一意である', () => {
    const names = TOOL_DECLARATIONS.map((d) => d.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test('期待するすべてのツール名を網羅する', () => {
    const names = TOOL_DECLARATIONS.map((d) => d.name).sort()
    const expected = [...READ_TOOL_NAMES, ...WRITE_TOOL_NAMES].sort()
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
    expect(isReadTool('unknown')).toBe(false)
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
})
