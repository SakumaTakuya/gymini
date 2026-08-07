# ADR: workout

## Zustand persist + リポジトリパターンの分離

- **決定**: セッションドラフト（`draftExercises`）は `persist` ミドルウェアで自動保存し、正式保存は `WorkoutRepository.save()` 経由のみとする
- **理由**: リロード時の自動復元を実現しつつ、ドラフトと永続データを明確に分離。B-001（localStorage-only）に準拠。

## localStorage を採用（IndexedDB 不採用）

- **決定**: IndexedDB が使用可能であっても localStorage を使用
- **理由**: ワークアウトデータ量（数百件）は localStorage の容量内に収まる。実装コストが低い。

## セーブ時に exerciseName をスナップショット保存

- **決定**: `Workout` に `exerciseId` と `exerciseName` の両方を保存する
- **理由**: 種目マスタが削除・リネームされても履歴表示が壊れない。AI が参照する際にも名前があると利便性が高い。

## recording 状態の排他制御（同時に 1 種目のみ）

- **決定**: `recording` 状態になれる種目は常に 1 つに限定する。他の種目は自動的に `idle` に降格する。
- **理由**: UI の散漫化を防ぎ、ユーザーの入力集中を促す。

## 前セットの重量・回数を次の pending セットに引き継ぐ

- **決定**: `completeSet` 後、次の `pendingSet` を直前セットの weight/reps で初期化する
- **理由**: 同一種目での連続セットで毎回入力し直すコストを削減する。

## セット完了トリガーはボタンタップ＋Enter キーのみとする（blur 完了は不採用）

- **決定**: セット完了は「完了ボタン（ph-plus / ph-check）のクリック」と「reps 欄での Enter キー」の 2 経路のみとする。reps 欄の blur では完了しない。
- **理由**:
  1. PRD（workout FR_028 / FR_030 状態遷移図）は完了トリガーをボタンと明記しており、blur 完了は仕様にない
  2. blur 完了は「weight 欄をタップし直す」「スクロールする」「他カードをタップする」など、発見不可能な暗黙挙動として誤確定を生む
  3. Enter 確定は利便性として意図的に残す（キーボード操作の高速入力を支援）
  4. blur 完了を除去することで、buttonPressedRef / completingRef などの重複防止ガードが不要になり、コードが単純化する

## 3 状態カードモデル（collapsed / idle / recording）

- **決定**: `collapsed` / `idle` / `recording` の 3 状態のみ使用（4 状態にしない）
- **理由**: 「空」と「完了」の区別は冗長。UI の単純化により状態管理のコストを下げる。

## onClick で store action をラップする

- **決定**: onClick ハンドラでは store action をアロー関数でラップする（直接渡さない）
- **理由**: Zustand の `persist` ミドルウェアと React の SyntheticEvent のシリアライズバグを回避するためのワークアラウンド。

## PendingSet の weight/reps を `number` 型にする

- **決定**: `PendingSet` の `weight` と `reps` フィールドの型は `string` ではなく `number`
- **理由**: `SetRowInput` が `Number()` 変換を適用してからストアに渡している。ストアの型はフォーム入力値ではなく実際の状態を反映すべき。

## ~~CompletedSetRow の削除/編集を swipe で起動する（ボタンは a11y 用に保持）~~ 【撤回 / Superseded】

> **撤回**: swipe を一次操作とする本決定は撤回し、可視の Trash/Pencil タップボタン（[workout.md](../prd/workout/index.md) FR_029）へ復帰した。理由は、swipe の発見性の低さ・完了ボタン（タップ）との操作系の不一致・編集しようとして削除が暴発する誤操作。詳細は当該 PR の経緯を参照。

- **決定**: 完了済セット行の削除/編集は左右 swipe ジェスチャーを一次操作とし、Trash/Pencil ボタンは visually-hidden な a11y 用要素として残す
- **理由**: 物理的近道（直接操作）を提供する一方、キーボード / screen reader / スイッチデバイスからの到達性を維持する。タップ式の小さなアイコンボタンは誤タップ率が高いという課題への対策でもある（[tactile-direction.md](../design/tactile-direction.md) の Matas 哲学 2「物体としての直接操作」+ Badeen 流の物体感に整合）

## ~~swipe コミット判定は位置と速度の OR で行う~~ 【撤回 / Superseded】

> **撤回**: swipe 自体を廃止したため本決定も失効。

- **決定**: swipe のコミット成立は「位置が行幅の所定割合を超える」または「速度が所定閾値を超える」のいずれかを満たすこと（具体値は [tactile-direction.md](../design/tactile-direction.md) の優先度マトリクス参照）
- **理由**: 位置のみだと「素早く小さく振った」操作が無視される。速度のみだと「ゆっくり大きく引いた」操作が拾えない。主要な swipe UI（Tinder 等）が両方の OR を採用しており、誤発火と取りこぼしの両方を抑えられる

## ヘッダクリアランスは scroller の padding ではなくスペーサー要素で確保する

**判断**: ActiveSessionView のスクロールコンテナは `pt-content-top` を持たず、先頭に `h-content-top` のスペーサー div を置く。sticky 種目カードの `top-content-top` は維持する。

**理由**: WebKit（iOS では WKWebView 強制のため全ブラウザが該当）は、スクロールコンテナ自身の `padding-top` を sticky 要素の `top` オフセットに加算する。`pt-content-top` + `sticky top-content-top` の併用では pin 位置が `2 × content-top` になり、カードがヘッダ下端よりさらに content-top ぶん下に固定される。一方 Chromium/Firefox は `top` のみで pin するため、開発環境では再現しない。

WebKitGTK 2.50 での実測（viewport 390×844, safe-area 59px 模擬, content-top=123px）:

| 構成 | pin 位置 |
| --- | --- |
| scroller に `padding-top:123px` + `top:123px` | 246px（padding が加算される） |
| スペーサー div 123px + `top:123px` | 123px（期待通り） |
| `padding-top:123px` + `top:0` | 123px（padding のみで決まる） |

この加算バグは `env(safe-area-inset-top)` の値（0 ↔ 59px）に応じて「最初のバブルは正しいが sticky が下すぎる」「バブルがヘッダに重なるが sticky はほぼ正しい」という相互排他な 2 症状として現れていた（sticky = 2×(env+64), バブル = env+64 の 2 式を env=59 / env=0 で評価した結果に一致）。#137 は sticky 側のトークンを揃えたが、WebKit の加算があるため実機では解決していなかった。

**トレードオフ**: スペーサーは DOM 要素が 1 つ増え、`aria-hidden` の付与が必要。`scroll-padding-top` はレイアウト空間を作らないため代替にならない。sticky の `top: 0`（padding に pin を任せる）は WebKit でのみ正しく、Chromium ではヘッダ裏に潜るため不可。

## 重量提案は決定的ロジック（推定1RM）で行い、LLM を使わない

**判断**: 種目の1セット目入力時に、過去記録から算出した推奨重量×回数を提案チップ（`WeightSuggestionChips`）として PendingSetRow 直下に表示する。タップで pendingSet に反映するのみで、確定（完了ボタン）は従来どおりユーザー操作。算出は `src/lib/weightSuggestion.ts` の純関数で行う。

**アルゴリズム**:
1. 対象種目を含む直近 5 セッションを抽出（weight>0 かつ reps>0 の有効セットのみ）
2. セッションごとに Epley 式で推定1RM を計算: `e1RM = weight × (1 + reps/30)`（セッション内の最大値を採用）
3. 新しいセッションほど重み付けした指数加重平均（減衰率 0.6）
4. 目標 reps（最新セッションの1セット目の reps、1–30 に clamp）から逆算し、2.5kg 刻みに丸める
5. 副候補として「+2 reps × 軽め」を併記（主候補と重量が同値なら省略）

**理由**:
- 全データが localStorage にあるためクライアント完結で計算でき、Gemini API のクォータを消費しない（B-001 Privacy-by-Design にも整合: 提案のためにデータを外部送信しない）
- e1RM 正規化により「前回と reps が違う」「前回だけ調子が悪かった」を吸収できる。直近1回コピーより頑健
- セッション内の実施順による補正（疲労補正）は将来拡張とし、初版では入れない

**トレードオフ**: LLM のような文脈理解（主観的な調子・コメント）は反映されない。チャットで質問された場合は `sessionContext` 経由で同じ算出値を LLM に渡せるため、追加 API コールなしで説明可能。
