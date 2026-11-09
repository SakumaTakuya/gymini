import { describe, it, expect } from 'vitest'
import { extractRecordExercises } from './recordExtractor'

const KNOWN = [
  'ベンチプレス',
  'スクワット',
  'デッドリフト',
  'ラットプルダウン',
  '懸垂',
  'プランク',
  '腕立て伏せ',
  'アームカール',
  'ダンベルカール',
]

describe('extractRecordExercises: 定型パターン', () => {
  it('「60kgで10回3セット」を抽出する', () => {
    expect(extractRecordExercises('ベンチプレス60kgで10回3セット', KNOWN)).toEqual([
      {
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
        ],
      },
    ])
  })

  it('「キロ」表記と小数重量を抽出する', () => {
    expect(
      extractRecordExercises('アームカール12.5キロ10回3セット', KNOWN),
    ).toEqual([
      {
        exerciseName: 'アームカール',
        sets: [
          { weight: 12.5, reps: 10 },
          { weight: 12.5, reps: 10 },
          { weight: 12.5, reps: 10 },
        ],
      },
    ])
  })

  it('略称がマスター内の1種目だけに含まれればその名前に解決する', () => {
    expect(
      extractRecordExercises('カール12.5キロ10回', ['アームカール']),
    ).toEqual([
      { exerciseName: 'アームカール', sets: [{ weight: 12.5, reps: 10 }] },
    ])
  })

  it('略称が複数のマスター名に含まれて曖昧な場合はそのままの名前を使う', () => {
    expect(extractRecordExercises('カール12.5キロ10回', KNOWN)).toEqual([
      { exerciseName: 'カール', sets: [{ weight: 12.5, reps: 10 }] },
    ])
  })

  it('全角数字を半角として解釈する', () => {
    expect(extractRecordExercises('ベンチ７０kgで８回', KNOWN)).toEqual([
      { exerciseName: 'ベンチプレス', sets: [{ weight: 70, reps: 8 }] },
    ])
  })

  it('セット数がない場合は 1 セットとして抽出する', () => {
    expect(extractRecordExercises('レッグプレス200kg10回', [])).toEqual([
      { exerciseName: 'レッグプレス', sets: [{ weight: 200, reps: 10 }] },
    ])
  })

  it('単位なしの重量（ベンチ60で10回）を抽出する', () => {
    expect(extractRecordExercises('ベンチ60で10回', KNOWN)).toEqual([
      { exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
    ])
  })

  it('英語の reps 表記を抽出する', () => {
    expect(extractRecordExercises('BP65kg 10reps', [])).toEqual([
      { exerciseName: 'BP', sets: [{ weight: 65, reps: 10 }] },
    ])
  })
})

describe('extractRecordExercises: ×表記', () => {
  it('「80kg×5」を重量×回数として抽出する', () => {
    expect(extractRecordExercises('スクワット終わった、80kg×5', KNOWN)).toEqual([
      { exerciseName: 'スクワット', sets: [{ weight: 80, reps: 5 }] },
    ])
  })

  it('「60kg 10回×3」を回数×セット数として抽出する', () => {
    expect(extractRecordExercises('ベンチプレス 60kg 10回×3', KNOWN)).toEqual([
      {
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
        ],
      },
    ])
  })

  it('「120kg×5回」を抽出する', () => {
    expect(extractRecordExercises('デッドリフト120kg×5回', KNOWN)).toEqual([
      { exerciseName: 'デッドリフト', sets: [{ weight: 120, reps: 5 }] },
    ])
  })

  it('「60kg×10×3」の3連チェーンを重量×回数×セット数として抽出する', () => {
    expect(extractRecordExercises('ベンチプレス60kg×10×3', KNOWN)).toEqual([
      {
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
        ],
      },
    ])
  })
})

describe('extractRecordExercises: 自重・回数のみ', () => {
  it('「腕立て100回」を重量 0 で抽出する', () => {
    expect(extractRecordExercises('腕立て100回', KNOWN)).toEqual([
      { exerciseName: '腕立て伏せ', sets: [{ weight: 0, reps: 100 }] },
    ])
  })

  it('「懸垂 自重で12回」を重量 0 で抽出する', () => {
    expect(extractRecordExercises('懸垂 自重で12回', KNOWN)).toEqual([
      { exerciseName: '懸垂', sets: [{ weight: 0, reps: 12 }] },
    ])
  })

  it('「懸垂10回3セット」を抽出する', () => {
    expect(extractRecordExercises('懸垂10回3セット', KNOWN)).toEqual([
      {
        exerciseName: '懸垂',
        sets: [
          { weight: 0, reps: 10 },
          { weight: 0, reps: 10 },
          { weight: 0, reps: 10 },
        ],
      },
    ])
  })
})

describe('extractRecordExercises: 時間・距離', () => {
  it('「プランク60秒×2」は時間とセット数を認識し、セットは空で返す', () => {
    expect(extractRecordExercises('プランク60秒×2', KNOWN)).toEqual([
      { exerciseName: 'プランク', sets: [], durationText: '60秒', mentionedSets: 2 },
    ])
  })

  it('「プランク3分キープ」は時間を認識する', () => {
    expect(extractRecordExercises('プランク3分キープ', KNOWN)).toEqual([
      { exerciseName: 'プランク', sets: [], durationText: '3分' },
    ])
  })

  it('「5kmラン」は距離と種目名を認識する', () => {
    expect(extractRecordExercises('5kmラン', KNOWN)).toEqual([
      { exerciseName: 'ラン', sets: [], distanceText: '5km' },
    ])
  })

  it('「ランニング5km」は種目名の後の距離を認識する', () => {
    expect(extractRecordExercises('ランニング5km', KNOWN)).toEqual([
      { exerciseName: 'ランニング', sets: [], distanceText: '5km' },
    ])
  })
})

describe('extractRecordExercises: 複数種目と分割', () => {
  it('「、」区切りの複数種目をそれぞれ抽出する', () => {
    expect(
      extractRecordExercises('ベンチプレス60kg10回×3、スクワット80kg×5', KNOWN),
    ).toEqual([
      {
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
        ],
      },
      { exerciseName: 'スクワット', sets: [{ weight: 80, reps: 5 }] },
    ])
  })

  it('セットごとの回数列挙（10回、9回、8回）を同一種目の別セットとして抽出する', () => {
    expect(
      extractRecordExercises('今日のベンチは60kgで10回、9回、8回', KNOWN),
    ).toEqual([
      {
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 9 },
          { weight: 60, reps: 8 },
        ],
      },
    ])
  })

  it('数値のない感想セグメント（余裕だった）は種目として扱わない', () => {
    expect(extractRecordExercises('ベンチ55kgで12回、余裕だった', KNOWN)).toEqual([
      { exerciseName: 'ベンチプレス', sets: [{ weight: 55, reps: 12 }] },
    ])
  })

  it('疑問セグメント（次どうすればいい？）は種目として扱わない', () => {
    expect(
      extractRecordExercises('60kgで10回やった、次どうすればいい？', KNOWN),
    ).toEqual([])
  })

  it('同じ種目が2回出てきたらセットをマージする', () => {
    expect(
      extractRecordExercises('ベンチ60kg10回、ベンチ55kg12回', KNOWN),
    ).toEqual([
      {
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 55, reps: 12 },
        ],
      },
    ])
  })
})

describe('extractRecordExercises: 数値なし・名前解決', () => {
  it('「ベンチやった」は数値なしで種目だけ抽出する', () => {
    expect(extractRecordExercises('ベンチやった', KNOWN)).toEqual([
      { exerciseName: 'ベンチプレス', sets: [] },
    ])
  })

  it('「デッド140キロ引けた」は重量のみで抽出する（回数なしは空セット）', () => {
    expect(extractRecordExercises('デッド140キロ引けた', KNOWN)).toEqual([
      { exerciseName: 'デッドリフト', sets: [], mentionedWeight: 140 },
    ])
  })

  it('略称（スクワ）をマスター名に解決する', () => {
    expect(extractRecordExercises('スクワ90kg×6回2セット', KNOWN)).toEqual([
      {
        exerciseName: 'スクワット',
        sets: [
          { weight: 90, reps: 6 },
          { weight: 90, reps: 6 },
        ],
      },
    ])
  })

  it('マスターにない種目名はそのまま使う', () => {
    expect(extractRecordExercises('ヒップスラスト100kg12回3セット', KNOWN)).toEqual([
      {
        exerciseName: 'ヒップスラスト',
        sets: [
          { weight: 100, reps: 12 },
          { weight: 100, reps: 12 },
          { weight: 100, reps: 12 },
        ],
      },
    ])
  })

  it('異常に大きいセット数は上限で丸める（配列を際限なく作らない）', () => {
    const result = extractRecordExercises(
      'ベンチプレス60kg10回×1000000000',
      KNOWN,
    )
    expect(result).toHaveLength(1)
    expect(result[0].sets.length).toBeLessThanOrEqual(100)
    expect(result[0].sets[0]).toEqual({ weight: 60, reps: 10 })
  })

  it('異常に大きいセット数（セット表記）も上限で丸める', () => {
    const result = extractRecordExercises(
      'ベンチプレス60kg10回100000セット',
      KNOWN,
    )
    expect(result[0].sets.length).toBeLessThanOrEqual(100)
  })

  it('計画の節（次は72.5kgでやろう）を種目として作成しない', () => {
    expect(
      extractRecordExercises('ベンチプレス70kg8回できた。次は72.5kgでやろう', KNOWN),
    ).toEqual([
      { exerciseName: 'ベンチプレス', sets: [{ weight: 70, reps: 8 }] },
    ])
    expect(extractRecordExercises('次は72.5kgでやろう', KNOWN)).toEqual([])
  })

  it('種目名を含む計画の節（次はベンチプレス72.5kg8回やろう）も抽出しない', () => {
    expect(
      extractRecordExercises('次はベンチプレス72.5kg8回やろう', KNOWN),
    ).toEqual([])
    expect(
      extractRecordExercises('明日のベンチプレスは72.5kg8回やる予定', KNOWN),
    ).toEqual([])
    // 実施済みの節と計画の節が混在する場合は実施済みだけを抽出する
    expect(
      extractRecordExercises(
        'ベンチプレス60kg10回やった。次はベンチプレス72.5kg8回やろう',
        KNOWN,
      ),
    ).toEqual([
      { exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
    ])
  })

  it('距離先行の計画の節（5kmランニングする予定）は抽出しない', () => {
    expect(extractRecordExercises('5kmランニングする予定', KNOWN)).toEqual([])
    // 直前の種目への追加情報としても付けない
    expect(
      extractRecordExercises(
        'ベンチプレス60kg10回やった、5kmランニングする予定',
        KNOWN,
      ),
    ).toEqual([
      { exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
    ])
  })

  it('疑問符なしの疑問文（ベンチプレス何kgだった）も抽出しない', () => {
    expect(extractRecordExercises('ベンチプレス何kgだった', KNOWN)).toEqual([])
    expect(
      extractRecordExercises(
        'ベンチプレス60kg10回やった。ベンチプレス何回できた',
        KNOWN,
      ),
    ).toEqual([
      { exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
    ])
    // 疑問語を含まない過去形の報告（〜だった）は記録として抽出する
    expect(extractRecordExercises('ベンチプレス60kg10回だった', KNOWN)).toEqual([
      { exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
    ])
  })

  it('種目名を含む疑問の節（ベンチプレス何kgだった？）は抽出しない', () => {
    expect(extractRecordExercises('ベンチプレス何kgだった？', KNOWN)).toEqual([])
    expect(extractRecordExercises('ラン何分だった？', ['ラン'])).toEqual([])
    // 実施済みの節と疑問の節が混在する場合は実施済みだけを抽出する
    expect(
      extractRecordExercises(
        'ベンチプレス60kg10回やった。ベンチプレス何kgだった？',
        KNOWN,
      ),
    ).toEqual([
      { exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
    ])
  })

  it('マスター名が別の種目名に埋め込まれている場合は拾わない', () => {
    const knownWithRun = ['ベンチプレス', 'ラン']
    // 「ラン」がマスターにあっても「プランク」の一部として誤認しない
    expect(extractRecordExercises('プランク60秒×2', knownWithRun)).toEqual([
      {
        exerciseName: 'プランク',
        sets: [],
        durationText: '60秒',
        mentionedSets: 2,
      },
    ])
    // 単独の「ラン」は従来どおり拾う
    expect(extractRecordExercises('ラン30分', knownWithRun)).toEqual([
      { exerciseName: 'ラン', sets: [], durationText: '30分' },
    ])
  })

  it('同一種目の節を繰り返しても累積セット数は上限を超えない', () => {
    const repeated = Array.from({ length: 5 }, () => 'ベンチプレス60kg10回×60').join('、')
    const result = extractRecordExercises(repeated, KNOWN)
    expect(result).toHaveLength(1)
    expect(result[0].sets).toHaveLength(100)
    // 数値だけの節の繰り返しでも累積上限を守る
    const numericOnly = [
      'ベンチプレス60kg10回×60',
      ...Array.from({ length: 60 }, () => '10回'),
    ].join('、')
    const result2 = extractRecordExercises(numericOnly, KNOWN)
    expect(result2).toHaveLength(1)
    expect(result2[0].sets).toHaveLength(100)
  })

  it('記録として解釈できない入力は空配列を返す', () => {
    expect(extractRecordExercises('こんにちは', KNOWN)).toEqual([])
    expect(extractRecordExercises('', KNOWN)).toEqual([])
    expect(extractRecordExercises('次どうすればいい？', KNOWN)).toEqual([])
  })
})
