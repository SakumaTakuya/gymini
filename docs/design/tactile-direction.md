# Tactile Direction — 手触り設計指針

> 4 人の巨匠 — Mike Matas / Loren Brichter / Jonathan Badeen / Ruchi Sanghvi / Chris Cox — の仕事に共通する **「画面のオブジェクトに現実の物理法則（重力・摩擦・慣性・バネ）を貸す」** 思想を、gymini の Active Session 体験に適用するための判断基準ドキュメント。
> 実装の正は `src/index.css` の `@theme` ブロック と `src/components/` のコード本体・テスト。本ドキュメントは「次の手」を選ぶときの方位磁針として参照する。
> [tokens.md](tokens.md) と矛盾しない範囲で運用する。トークン値の変更が必要になった場合は、本ドキュメントではなく [tokens.md](tokens.md) と `src/index.css` を先に更新する。

## このドキュメントは何か / 何ではないか

| 何か | 何ではないか |
|:---|:---|
| Active Session 体験の方位磁針（哲学 + Before/After + 優先度） | 実装スペック・テストの代替 |
| 「触っていて気持ちいい」を言語化した判定基準 | アニメーション量・派手さの推奨 |
| [tokens.md](tokens.md) の上位指針 | トークン定義そのもの |
| ライブラリ選定の判断材料 | ライブラリ採用の最終結論 |

**焦点**: Active Session（`src/components/workout/` 配下と `src/components/chat/`）に絞る。History / Settings / AI チャット画面そのものは本稿の対象外。

---

## 共同醸造の巨匠たち

| 名前 | 主な仕事 | 引用するエッセンス |
|:---|:---|:---|
| **Mike Matas** | Push Pop Press / *Our Choice* / Paper / 初代 iOS Maps / iBooks | 紙のような物質感、空間連続性、静かなフィードバック |
| **Loren Brichter** | Tweetie / Twitter（pull-to-refresh の発明）| ラバーバンド・elastic over-scroll・「引っ張ると伸びるゴム」 |
| **Jonathan Badeen** | Tinder（swipe の発明）| 速度ベースのコミット判定・rotation を伴う物体感・snap-back |
| **Ruchi Sanghvi** | Facebook — News Feed | 慣性スクロール・無限の流れの中で「いまここ」に留まる感覚 |
| **Chris Cox** | Facebook CDO | 動きの timing と「呼吸の間」・感情が届くまでの 100ms |

彼らに共通するのは **「画面のオブジェクトに現実世界の物理法則を貸すこと」**。手触りの正体は、ガラス板に触れているのに物がそこにあるかのように感じる錯覚の積み重ねにある（具体化は哲学 6「物理法則の継承」を参照）。

---

## 哲学 6 か条

### 1. コンテンツが UI である

数字（重量×回数）がこのアプリの主役。枠線・ラベル・カードはそれを引き立てる紙であって、競合してはいけない。

- **由来**: Matas — *Our Choice* の「写真を直接つまんで動かす」体験。点滅する UI は写真を邪魔しなかった
- **gymini での意味**: 種目名はサブ、`80 kg × 8` の **80** と **8** が主役。`kg` `回` の単位は褪色 (`gym-zinc-400`)、枠線は最小化、カード境界はほぼ消す方向に倒す
- **やらないこと**: 数字をデザインのためにいじらない。装飾的なフォントの混在禁止。`font-outfit` の単一スケール内で大きさだけで構造を作る

### 2. 物体としての直接操作

タップ可能領域は「掴める物」として振る舞う。それぞれが重さと質感を持つ。

- **由来**: Matas（初代 iOS Maps のピン落下 / Paper の tilt）・Badeen（Tinder のカード swipe）
- **gymini での意味**: セット行・種目カードは物体。掴める、引っ張れる、フリックできる
- **やらないこと**: 「掴めるように見えるが掴めない」UI は作らない。視覚的に物体っぽさを増やすなら、ジェスチャーまで含めて実装する。半端ならフラットなまま残す

### 3. 空間の連続性

画面遷移は「ワープ」ではなく「展開」。タップした要素がそのまま次の文脈になる。

- **由来**: Matas（iBooks のページめくり / Paper の section ヘッダーからのカード展開）
- **gymini での意味**: `IdleView` の「トレーニングを始める」ボタンが Active Session の最初の枠（または TimerPill）に**変形**して展開する。History の日付タップで Session を始めるときは、その日付がフレームの一部として残る
- **やらないこと**: 純粋なフェードトランジションは禁忌ではないが、原則として「タップした場所から次の画面が生えてくる」を優先する

### 4. 静かなフィードバック

応答は **触覚 + 軽い変形 + 色温度の微変化** で行う。トーストやモーダルは最後の手段。

- **由来**: Cox の「呼吸の間」・Matas の Apple Camera / iBooks の素材音
- **gymini での意味**: セット完了は `navigator.vibrate(10)` + 行スケール 0.98→1.00 の spring + accent ストライプの一瞬の発光。「保存しました」トーストは出さない。完了したセットが Completed 状態に変わったことが応答そのもの
- **「呼吸」の基準**: Cox の "100ms 前後で感情が届く" を基底とする。UI の細かい応答は `--duration-quick` (120ms) / `--duration-normal` (220ms) のいずれかを選び、**最大でも 300ms を超えない**。scale は最大 1.06 まで。これを超えると「躁」に近づく

### 5. タイポグラフィが構造を語る

階層は枠線でなくフォントサイズ・ウェイト・余白で作る。

- **由来**: Matas — *Our Choice* の章タイトル、iBooks の本文
- **gymini での意味**: 数字は `text-3xl` (≈30px) 〜 `text-4xl` (≈36px) まで引き上げる余地がある。種目名は `text-lg` (≈18px、現状維持)。メタ情報は `text-[10px]`〜`text-xs` まで退かせる。区切りは `border-b` ではなく余白で
- **やらないこと**: 階層を増やすために新フォントを足さない。`font-outfit` / `font-sora` / `font-jp` の三役体制を厳守 ([tokens.md](tokens.md) フォントトークン参照)

### 6. 物理法則の継承

**全ての動きは慣性・摩擦・バネ・重力のいずれかから来る**。`linear` トランジションは UI から追放する。1ms 単位の easing が手触りを決めると認識する。

- **由来**: Brichter（pull-to-refresh の elastic）・Badeen（velocity + rotation + snap-back）・Sanghvi（News Feed の慣性スクロール）・Cox（呼吸の間 = 100ms 前後のタイミング設計）
- **gymini での意味**:
  - 種目カードのリストはラバーバンドで端を表現する
  - セット行の swipe は位置でなく速度でコミット判定する
  - spring back は Apple 系の "snappy" カーブ (`cubic-bezier(0.2, 0.8, 0.2, 1)`) を既定とする
  - 既存の `animate-appear`（220ms ease-out、`src/index.css:38-51`）は哲学に整合（ease-out = 摩擦による減速）。継承する
- **やらないこと**: 物理を装飾の口実にしない。「動くのが楽しいから動かす」のは禁止。**全ての物理表現には「触っている対象がこういう質感だから」という根拠を持たせる**（次節の物理タクソノミー参照）

---

## 物理タクソノミー

各 UI 要素が何でできているかを言語化する。質感が明確だと、それに対するジェスチャー・モーションも一意に決まる。

| 要素 | 質感 | 摩擦 | バネ | 想定モーション |
|:---|:---|:---:|:---|:---|
| ExerciseCard（通常種目） | 厚紙 | 高 | 遅め | スクロールで重く動く、リリースで穏やかな spring |
| PendingSetRow（記録中） | 薄紙・活性 | 中 | 速い | 完了で 0.98→1.00 short spring、accent stripe が走る |
| CompletedSetRow（完了済セット） | 紙片 | 中 | 速め | swipe で「ちぎれる手前」の rubber-band、リリースで snap |
| ~~AI 提案カード~~（廃止） | — | — | — | B-002 v5.0.0 改定で廃止。AI 追加は手入力と同じ通常 ExerciseCard を即時挿入する |
| TimerPill | **ガラス** | — | — | 移動しない・背後のブラーを伝える・毎分の頭で 2% 呼吸 |
| Session 縦スクロール | 紙のロール | 中 | — | 慣性、上下端で軽いラバーバンド |
| カレンダー横スクロール（参考、本稿対象外） | 紙の蛇腹 | 中 | — | snap、既に `snap-x snap-mandatory` で物理感あり |

**「ガラス」だけは動かない**。動いていいのは紙・紙片・厚紙だけ。動くものを限定すると、動くものの意味が立つ。

---

## Easing / パフォーマンス規約

物理を貸すには easing が命。`linear` は禁止。

### Easing トークン候補（実装は別 PR、本ドキュメントは言語化に留める）

| トークン候補 | 値 | 用途 |
|:---|:---|:---|
| `--ease-snap` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | 既定の "Apple snappy"、ほとんどの遷移 |
| `--ease-spring-soft` | `cubic-bezier(0.34, 1.3, 0.64, 1)` | overshoot 系（呼吸・完了 tick） |
| `--ease-rubber` | `cubic-bezier(0.2, 0, 0, 1)` | rubber-band の張力減衰、コミット時の飛び去り |
| `--duration-quick` | `120ms` | フォーカス遷移、accent stripe 移動 |
| `--duration-normal` | `220ms` | カード出現（既存 `animate-appear` と整合）|
| `--duration-breath` | `1500ms` | TimerPill の毎分呼吸 |

既存の `animate-appear` (220ms ease-out, `src/index.css:38-51`) は破棄せず、`--duration-normal` の参照例として残す。

### パフォーマンス規約

- **transform / opacity / filter のみ** をアニメートする。`width` `height` `top` `left` などレイアウト系プロパティのアニメは禁止（layout thrash の原因）
- 60fps を維持する。1 フレーム = 16.7ms。easing 計算 + ペイント + コンポジットがその枠内に収まること
- 連続アニメーション中の要素にのみ `will-change: transform` を付け、終わったら外す（GPU メモリのため付けっぱなしにしない）
- 周期アニメーションは `requestAnimationFrame` で組む。`setInterval` で時刻同期するモーションは不可

### Haptic マトリクス

`navigator.vibrate(ms)` の強度を役割別に固定する。実装時はここを唯一の参照源とし、各コンポーネントに散らさない。

| シーン | 振動 | 担当節 |
|:---|:---:|:---|
| セット完了（Pending → Completed）| 10ms | PendingSetRow |
| AI 提案カード出現 | 15ms | ExerciseCard（AI 提案） |
| Swipe 閾値直前の pre-haptic | 8ms | CompletedSetRow swipe |
| Swipe コミット成立 | 12ms | CompletedSetRow swipe |
| Swipe snap-back（戻る）| 0ms（静寂） | CompletedSetRow swipe |
| Session 縦スクロール 上下端到達 | 5ms | Session 縦スクロール |

`prefers-reduced-motion: reduce` 時は全てゼロ抑止。

---

## Active Session の Before/After

### IdleView → ActiveSessionView の遷移

**現状** (`src/components/IdleView.tsx`, `src/routes/_app/training.tsx`)
- 「トレーニングを始める」ボタンタップで `/training` のページ内表示が即時切り替わる。空間連続性なし

**改善後**
- 視覚: CTA ボタンの位置 / サイズから、Session の TimerPill ないし最初の「種目を追加する」プレースホルダが**展開**して生まれる。バーベルアイコンは Session 開始と同時にフェードアウト + ごく僅か上方向へ平行移動
- 動き: `--duration-normal` `--ease-snap`。View Transitions API が使えれば優先、フォールバックは絶対配置の clone + CSS transition
- 触覚: なし。開始は静かに

**由来**: Matas
**哲学**: 3, 6
**やらないこと**: 5 種類のアニメーションを重ねない。「ボタン→フレーム」の単一連続性だけを表現する

### ExerciseCard（通常種目）

**現状** (`src/components/workout/ExerciseCard.tsx:64-69`)
```
bg-gym-white rounded-[24px] p-5 shadow-soft border border-gym-zinc-100
```
カード = 白い箱。`shadow-soft` + `border border-gym-zinc-100` の二重で境界。タイトル下に `border-b border-gym-zinc-50`（同 `:73`）の区切り。

**改善後**
- 視覚: `border border-gym-zinc-100` を撤廃、`shadow-soft` のみで浮かす。タイトル下の `border-b` も廃止し余白で区切る。背景は引き続き `gym-white` だが Session 全体が暖色寄りペーパートーンになることで相対的に「白い紙」として浮かぶ
- 動き: Sticky 時に `shadow-soft` (`0 2px 8px / 0.04`) → 中間値 (`0 4px 14px / 0.06`) へ滑らかに育つ。IntersectionObserver で stuck 状態を検知、`--duration-quick` `--ease-snap`
- 触覚: なし

**由来**: Matas
**哲学**: 1, 5
**やらないこと**: `shadow-float` まで育てない。「静か」を破る

### ~~ExerciseCard（AI 提案）~~（廃止）

> **廃止（B-002 v5.0.0 改定 / 2026-05-24）**: 承認/破棄の AI 提案カード（`origin: 'ai-suggested'`）は撤去した。AI の書き込みは手入力と同じ通常 ExerciseCard を即時挿入するため、本節の演出（点線・slide-from-right・フリックで飛ばす swipe）は対象がなく無効。以下は歴史的記録として残す。

**旧状態**
- `bg-gym-zinc-50` + `border-dashed border-gym-zinc-300` + `AI 提案` バッジ
- 出現時 slide-from-right、フリックで accept/reject の swipe（P2 Badeen 流）を検討していた
- 触覚: 出現時に `navigator.vibrate(15)` で「来たよ」の通知（reduced-motion 設定時は省略）

**由来**: Matas / Badeen
**哲学**: 2, 3, 6
**やらないこと**: バッジを盛らない

### PendingSetRow（数字入力）— 中核

**現状** (`src/components/workout/PendingSetRow.tsx:56-96`)
- `bg-gym-white shadow-soft border border-gym-zinc-200` の行、左に accent 1px stripe (`:58`)、`<Input>` は `text-xl font-outfit font-bold` (`:72, :84`)、kg/回 サフィックスは `text-xs`

**改善後**
- 視覚:
  - 数字を `text-3xl` (≈30px) に拡大
  - kg / 回 サフィックスは `text-[10px]` の `gym-zinc-400`、ベースライン揃え
  - `<Input>` の border 撤廃、下線 (`border-b border-gym-zinc-200`) のみで「下線ノート」風に
  - フォーカス時のみ下線が `gym-black` 1.5px + accent ストライプの淡発光
  - 行の `border border-gym-zinc-200` は撤廃、シャドウは弱める方向
- 動き:
  - 入力中の数字変化は `tabular-nums` で安定。`--duration-quick` のサブピクセル shift（紙に押し込まれる感）
  - フォーカス遷移（weight → reps）時、accent ストライプが上→下に移動（単一の絶対配置 div を transform で移す、`--ease-snap`）
- 触覚: 完了ボタンタップ / reps Enter で `navigator.vibrate(10)`

**由来**: Matas
**哲学**: 1, 4, 5
**やらないこと**: 数字入力をネイティブ `<input type="number">` から離脱させない（このフェーズでは）

### CompletedSetRow — Badeen 流に再記述

**現状** (`src/components/workout/CompletedSetRow.tsx:11-39`)
- `bg-gym-zinc-50 rounded-xl` の行。Trash / Pencil ボタンが両端に常時表示

**改善後**
- 視覚:
  - 行番号を行の背景に**章番号風**に大きく薄く配置（`font-outfit text-5xl text-gym-zinc-100`、絶対配置、`overflow-hidden`）
  - 数字は `text-2xl` (≈24px) まで拡大、kg/回 サフィックスは Pending と同じ褪色ルール
  - Trash / Pencil ボタンは常時非表示。左 swipe で右側から赤背景 + Trash、右 swipe で左側から白背景 + Pencil
- 動き（**Badeen 流**）:
  - **位置でなく速度** でコミット判定。`pointerup` 時点での `velocityX = (現在位置 − 64ms 前位置) / 64ms`。`velocityX > 0.6 px/ms` または `displacement > 行幅の 40%` のいずれかでコミット
  - コミット閾値の **直前で `navigator.vibrate(8)`** の pre-haptic（「もう一押しで離れる」を指に伝える）
  - リリースでスナップ: snap-back 時は `--ease-snap` `--duration-normal`、コミット時は行が velocity 方向に飛び去る（`translateX(±100%) opacity:0`、`--ease-rubber` 200ms）
  - 行幅の 40% を超えて引っ張ると **rubber-band**: 変位は √ で減衰する（典型的ゴム式: `displacement = limit + (raw − limit) * 0.3`）
  - 微小な rotation（最大 1.5deg）を進行方向に付与。行サイズなので Tinder ほど派手ではなく控えめが正
  - 行完成時（PendingSetRow → CompletedSetRow への切り替わり）に 0.98→1.00 の short spring (`--ease-spring-soft` `--duration-normal`)、accent ストライプが左→右に「揮発」（フェードアウト）
- 触覚:
  - pre-haptic（閾値直前）= `vibrate(8)`
  - コミット成立時 = `vibrate(12)`
  - snap-back（コミットせず戻る）はゼロ振動 = 静寂

**由来**: Matas / Badeen
**哲学**: 1, 2, 5, 6
**やらないこと**: Trash / Pencil を a11y 上完全に消さない。長押し → メニュー表示で削除/編集をキーボード / screen reader からも到達可能にする。swipe はあくまで物理的近道

### TimerPill

**現状** (`src/components/workout/TimerPill.tsx:8-17`)
- `bg-gym-white/80 backdrop-blur-sm shadow-float border border-gym-zinc-100 px-2 py-1 rounded-lg`、Clock アイコンが `animate-pulse` で常時拍動

**改善後**
- 視覚:
  - `backdrop-blur-sm` → `backdrop-blur-md` でガラス感を強める。`bg-gym-white/80` → `bg-gym-white/60` でさらに透ける
  - 時刻表示に `tabular-nums` を追加（フォントサイズ変動防止）
  - `border border-gym-zinc-100` を撤廃、影のみで浮かす
  - Clock アイコンの常時 `animate-pulse` を撤廃 → **毎分の頭で 1 回だけ** 2% スケールアップ→ダウンの spring (`--duration-breath` `--ease-spring-soft`)
- 動き: 上記スケール spring（毎分 0 秒で発火、`requestAnimationFrame` ベースで時刻監視）
- 触覚: なし（タクソノミー上「ガラス」= 動かない素材）

**由来**: Matas / Cox
**哲学**: 4, 6
**やらないこと**: 時計の表現を変えない（アナログ針等にしない）

### Session 縦スクロール挙動

**現状**
- `ActiveSessionView` の縦スクロールはブラウザデフォルト。iOS Safari のラバーバンドは body 全体で発生し、safe-area スクロールの境界が曖昧

**改善後**
- 視覚: スクロール本体は不可視。上端で軽くプルすると、Session ヘッダ直下に **薄い陰** が一瞬伸びる（紙のロールを引き伸ばす視覚比喩）
- 動き:
  - スクロールコンテナに `overscroll-behavior-y: contain` を明示。Safari のラバーバンドは内部だけで起こす
  - 上端でのプル: 80px までは抵抗付きで伸びる（`transform: translateY()` を scroll 量に応じて適用、√ 減衰）。それ以上引っ張っても 80px で限界
  - 下端でも同様にラバーバンド。最終セットの下に「空白の紙」が伸びる感覚
  - 慣性スクロール: ブラウザデフォルトに任せる（Safari の慣性は十分 Cox 品質）
  - **scroll-snap は使わない**（種目カード単位の snap）。理由: アクティブセッション中はユーザーが「現在の種目」と「次の種目」を同時に見たい場面が多く、snap で 1 枚ずつ固定すると邪魔。sticky 種目カードヘッダの現状挙動で十分
- 触覚: 上下端到達時に `navigator.vibrate(5)` の極小振動（「コツン」）

**由来**: Brichter / Sanghvi
**哲学**: 2, 6
**やらないこと**: pull-to-refresh アクションを発明しない（データ更新の意味が無い）。Active Session に「引っ張ったら何かが起こる」を増やすと誤発火コストの方が大きい

### Session 背景

**現状**
- ページ背景は `gym-zinc-50` (`#fafafa`)。冷たい無彩色

**改善後**
- 視覚: Active Session のみ、背景を暖色寄りペーパートーン（候補: `#FAF8F4`）に切り替える
- 動き: 縦スクロール量に応じて、ごく弱い radial-gradient（中心 = ヘッダ直下、明度差 5% 程度）が追従。紙にライトが当たる感じ
- 触覚: なし

**由来**: Matas
**哲学**: 1, 5
**やらないこと**: トークン (`gym-zinc-50`) 自体は変更しない。Active Session 専用のオーバーレイとして適用、他画面（History 等）には波及させない

---

## 優先度マトリクス（物理視点で再構成）

| Pri | 改善 | 影響 | 工数 | 必要技術 | 主な変更場所 | 由来 |
|:---:|:---|:---:|:---:|:---|:---|:---|
| **P0** | **easing トークン整備**（`--ease-snap` 等を `@theme` に） | 高 | 小 | CSS のみ | `index.css` | Brichter / Cox |
| **P0** | **`overscroll-behavior-y: contain`** を Active Session に | 中 | 小 | CSS のみ | `ActiveSessionView.tsx` の親 | Brichter |
| P0 | 数字フォント拡大 + 単位の褪色 | 高 | 小 | CSS のみ | `PendingSetRow.tsx:72, :84` / `CompletedSetRow.tsx:22-29` | Matas |
| P0 | accent stripe の focus 発光 + `--ease-snap` | 中 | 小 | CSS のみ | `PendingSetRow.tsx:58` / `index.css` | Matas |
| P0 | TimerPill の `tabular-nums` + 常時 `animate-pulse` 撤去 | 低 | 小 | CSS のみ | `TimerPill.tsx:10-12` | Matas / Cox |
| **P0** | **セット完了時の haptic (10ms) + 0.98→1.00 spring** | 中 | 小 | Vibration API + CSS | `useWorkoutSession` 周辺 | Cox / Badeen |
| P1 | ExerciseCard の境界線緩和（紙化） | 高 | 小 | CSS のみ | `ExerciseCard.tsx:66, :73` | Matas |
| **P1** | **CompletedSetRow の swipe**（Badeen 流：velocity 判定 + rubber-band + pre-haptic） | 高 | 大 | pointer events + CSS + Vibration | `CompletedSetRow.tsx` 全体 | Badeen |
| P1 | CompletedSetRow の章番号透かし | 中 | 小 | CSS のみ | `CompletedSetRow.tsx:13` | Matas |
| P1 | Idle → Session の spatial 遷移 | 高 | 中 | View Transitions API or 自前 | `IdleView.tsx` / `routes/_app/training.tsx` | Matas |
| P1 | Session 背景の暖色化（Active Session 限定） | 中 | 小 | CSS のみ | `ActiveSessionView.tsx` 親 | Matas |
| P1 | TimerPill の「毎分呼吸」スケール | 低 | 小 | CSS + `requestAnimationFrame` | `TimerPill.tsx` | Cox |
| **P1** | **Session 縦スクロール上下端のラバーバンド視覚化 + haptic** | 中 | 中 | scroll listener + CSS + Vibration | `ActiveSessionView.tsx` | Brichter |
| P2 | 数字入力のドラムピッカー導入 | 高 | 大 | 新規 UI コンポ | 新規 + `PendingSetRow.tsx` | Matas / Badeen |
| ~~P2~~ | ~~AI 提案カードの swipe accept / reject~~（廃止: B-002 v5.0.0 で AI 提案カード撤去） | — | — | — | Badeen |
| ~~P2~~ | ~~AI 提案カードの slide-from-right 出現~~（廃止: 同上） | — | — | — | Matas |
| P3 | Session 背景の追従 radial gradient | 低 | 中 | scroll listener + CSS variable | `ActiveSessionView.tsx` | Matas |
| 横断 | `prefers-reduced-motion` 全面対応 | 横断 | 中 | CSS `@media` + JS（haptic 抑止） | 全 motion 系 | 必須 |

**太字** = 物理系（Brichter / Badeen / Cox 由来）。とくに P0 の **easing トークン整備** は他の全 motion 実装の起点になるため、依存上の先行候補。

### P2 以上に踏み込む前提

- **ドラムピッカー導入**: 既存の数値入力テスト（`src/components/workout/*.test.tsx` および `src/test/` 配下の integration）を破壊しないこと。とくに weight → reps の Enter / blur フロー（`PendingSetRow.tsx:29-54`）はキーボードユーザーのために残す
- **swipe ジェスチャー導入**: 純粋な pointer events で書けるなら追加依存は不要。複雑になる場合 `@use-gesture/react` を `package.json` に追加検討
- **View Transitions API**: メイン環境は Mobile Chrome (Pixel 5)（`playwright.config.ts`）。Chromium 系では使えるが、iOS Safari は限定的なため、フォールバック実装を併記する

### Reduced Motion

全ての P0〜P3 を実装する際に **必ず** `@media (prefers-reduced-motion: reduce)` でモーションを無効化する分岐を入れる。Haptic も同条件で抑止する（JS から `matchMedia('(prefers-reduced-motion: reduce)').matches` を検査）。

---

## gymini らしさを守る（巨匠哲学に対する例外）

巨匠たちの仕事は楽しさ・娯楽性のあるアプリ（Twitter、Tinder、News Feed、Paper）で結実した。gymini は **「集中するための道具」**。例外的に維持すべき性質を明文化する。

| 維持する gymini らしさ | 理由 |
|:---|:---|
| 単色 + 赤アクセント 1 点 ([tokens.md](tokens.md)) | トレーニング中は集中したいコンテキスト。色数が増えると注意散逸 |
| `font-outfit` / `font-sora` / `font-jp` の三役 | 数字と本文の役割分担で十分階層が作れる |
| `shadow-soft` / `shadow-float` の二段階 | これ以上影を増やしても表現力は上がらず、コストだけ増える |
| Sticky 種目カードの z 階層 | 既に物理的振る舞いとして成立、崩さない |
| safe-area トークン群（`src/index.css:26-31`）| iOS Safari ノッチ対応の資産。Matas 化のために退化させない |

### 物理の例外: アプリ全体ではなく Active Session に限定する

物理表現を全画面に広げると「楽しいアプリ」になる。gymini は道具なので、物理を味わわせるのは **Active Session の中だけ**:

- History のカレンダーは既に `snap-x snap-mandatory` で十分（追加の物理は不要）
- Settings は静的で良い（タップ → 反応で完結）
- AI チャット画面そのものは物理を最小限に

Brichter のラバーバンドや Badeen のスワイプは本来「読む / 見る」コンテキストで効く。トレーニング中の Active Session はそれに近い（ユーザーが「次に何をやるか」を見ているコンテキスト）。

ペーパートーンの暖色化（P1）も Active Session 限定であり、グローバルなトークン体系は崩さない。

---

## 既存 design docs との関係

| ドキュメント | 関係 |
|:---|:---|
| [tokens.md](tokens.md) | 本ドキュメントは tokens.md の上位指針。token 値の変更が必要なら tokens.md を先に更新する |
| [components.md](components.md) | 索引。本ドキュメントは components.md のリストに直接含めない（指針扱い）|
| [button.md](button.md) / [input.md](input.md) / [focus.md](focus.md) | 個別コンポーネント規約。本ドキュメントから矛盾する変更を提案する場合、必ず元規約を先に更新する |

PRD・ADR との関係: 振る舞いの仕様は [workout.md](../prd/workout/index.md) など。本ドキュメントは振る舞いを変えるのではなく、振る舞いの**見た目と動き**を変える指針。仕様を変える提案を本ドキュメントから持ち出す場合は、PRD/ADR を先に更新すること（CLAUDE.md「実装フローの順序」遵守）。

---

## 次のアクション候補

P0 を着手する場合の進め方:

1. **失敗するテストを先に書く**（CLAUDE.md「実装フローの順序」遵守）
2. **P0 のうち easing トークン整備を最初に**（`--ease-snap` 等を `src/index.css` の `@theme` に追加）。他の全ての P0 / P1 から参照されるため、依存上の起点
3. **`overscroll-behavior-y: contain` を次に**（CSS 1 行で iOS Safari の癖を抑え、以後のラバーバンド実装の土台になる）
4. **CSS のみで完結する P0 群** を 1 PR にまとめる（数字拡大、TimerPill 整理、accent stripe）
5. **Haptic は別 PR**。`prefers-reduced-motion` の抑止ロジックと一緒に
6. P1 に進む前に、P0 が体験として効いているかを実機（iOS / Android）で 1 日触る

P1 の **Badeen 流 swipe** を着手したい場合は、別途 ADR を起こす（仕様変更を伴う = `docs/adr/workout.md` の更新と PRD への影響確認が必要）。
