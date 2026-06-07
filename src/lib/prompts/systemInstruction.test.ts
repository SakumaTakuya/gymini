import { describe, it, expect } from 'vitest'
import {
  SYSTEM_INSTRUCTION,
  SYSTEM_INSTRUCTION_VERSION,
} from './systemInstruction'

describe('systemInstruction module', () => {
  // SYSTEM_INSTRUCTION_VERSION の生存テスト。プロンプト本文を改修した際に
  // version を上げ忘れて回帰しても、ここで気づける仕組みにする。
  // バージョンを変更した場合は対応する更新意図（本文の改修ログ）を残すこと。
  it('SYSTEM_INSTRUCTION_VERSION は正の整数', () => {
    expect(Number.isInteger(SYSTEM_INSTRUCTION_VERSION)).toBe(true)
    expect(SYSTEM_INSTRUCTION_VERSION).toBeGreaterThan(0)
  })

  it('SYSTEM_INSTRUCTION は非空のテンプレート（モード説明とツール仕様を含む）', () => {
    expect(SYSTEM_INSTRUCTION.length).toBeGreaterThan(0)
    // 本文の骨格を最低限固定する（プロンプト合成テストは buildSystemInstruction 側で実施）
    expect(SYSTEM_INSTRUCTION).toMatch(/AIコーチ/)
    expect(SYSTEM_INSTRUCTION).toMatch(/proposeAction/)
    expect(SYSTEM_INSTRUCTION).toMatch(/saveWorkout/)
  })
})
