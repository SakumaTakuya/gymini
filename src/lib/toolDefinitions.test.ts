import { describe, expect, test } from 'vitest'
import {
  READ_TOOL_NAMES,
  TOOL_DECLARATIONS,
  WRITE_TOOL_NAMES,
  isReadTool,
  isWriteTool,
} from './toolDefinitions'

describe('toolDefinitions', () => {
  test('defines exactly 8 tools', () => {
    expect(TOOL_DECLARATIONS).toHaveLength(8)
  })

  test('all tool names are unique', () => {
    const names = TOOL_DECLARATIONS.map((d) => d.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test('covers all expected tool names', () => {
    const names = TOOL_DECLARATIONS.map((d) => d.name).sort()
    const expected = [...READ_TOOL_NAMES, ...WRITE_TOOL_NAMES].sort()
    expect(names).toEqual(expected)
  })

  test('each tool has name, description, and parameters', () => {
    for (const decl of TOOL_DECLARATIONS) {
      expect(decl.name).toBeTruthy()
      expect(decl.description).toBeTruthy()
      expect(decl.parameters).toBeDefined()
    }
  })

  test('isWriteTool identifies write tools', () => {
    expect(isWriteTool('saveWorkout')).toBe(true)
    expect(isWriteTool('addExercise')).toBe(true)
    expect(isWriteTool('addExerciseToSession')).toBe(true)
    expect(isWriteTool('getRecentWorkouts')).toBe(false)
    expect(isWriteTool('unknown')).toBe(false)
  })

  test('isReadTool identifies read tools', () => {
    expect(isReadTool('getRecentWorkouts')).toBe(true)
    expect(isReadTool('getWorkoutsByExercise')).toBe(true)
    expect(isReadTool('getWorkoutsByDate')).toBe(true)
    expect(isReadTool('getWorkoutSummary')).toBe(true)
    expect(isReadTool('getExercises')).toBe(true)
    expect(isReadTool('saveWorkout')).toBe(false)
    expect(isReadTool('unknown')).toBe(false)
  })

  test('saveWorkout requires date and exercises', () => {
    const decl = TOOL_DECLARATIONS.find((d) => d.name === 'saveWorkout')
    expect(decl?.parameters?.required).toEqual(['date', 'exercises'])
  })

  test('addExercise requires name', () => {
    const decl = TOOL_DECLARATIONS.find((d) => d.name === 'addExercise')
    expect(decl?.parameters?.required).toEqual(['name'])
  })

  test('addExerciseToSession requires exerciseId and exerciseName', () => {
    const decl = TOOL_DECLARATIONS.find(
      (d) => d.name === 'addExerciseToSession',
    )
    expect(decl?.parameters?.required).toEqual(['exerciseId', 'exerciseName'])
  })

  test('getWorkoutSummary requires periodType, startDate, endDate', () => {
    const decl = TOOL_DECLARATIONS.find((d) => d.name === 'getWorkoutSummary')
    expect(decl?.parameters?.required).toEqual([
      'periodType',
      'startDate',
      'endDate',
    ])
  })
})
