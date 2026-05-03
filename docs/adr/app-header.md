# ADR: app-header

## React Portal + 明示的 DOM 位置指定によるコンテンツ注入

- **決定**: 各ページからヘッダーへのコンテンツ注入に React Portal を使用し、DOM のホストノードに直接描画する
- **理由**: prop drilling では全ページの JSX を `_app.tsx` に集約する必要があり保守性が低下する。Zustand は React ノードをシリアライズできない。Portal はレンダーフローを維持しつつ、`elapsedSeconds` のような動的値も追加サブスクリプションなしに自動更新される。

## ホストノードの管理に `useState<HTMLElement | null>` + ref コールバックを使用

- **決定**: `useRef` ではなく `useState<HTMLElement | null>` に ref コールバック（`ref={setTitleHost}`）を使用する
- **理由**: `useRef` の値変化は再レンダーを引き起こさない。ホストノードの確定（null → HTMLElement）が Portal の発火を引き起こす必要があるため、`useState` による再レンダーが必要。

## `variant` の管理は Provider の Context 状態に置く

- **決定**: ヘッダーの `variant`（スタイル切り替え）を AppHeaderContent の prop ではなく、Provider 自身の Context 状態として管理する
- **理由**: ヘッダーは 1 回だけマウントされる。`<header>` の className を動的に変更するには Provider 自身の状態を更新するしかない。

## Leading スロットのコンテナに `<span className="contents">` を使用

- **決定**: Leading ホスト要素として `<span className="contents">` を使用する
- **理由**: `contents` プロパティにより span がレイアウト上中立になり、子要素が親の flex レイアウトに直接参加できる。`<div>` を使うと不要なブロックボックスが生成され、gap のアライメントが崩れる。

## Trailing スロットの GearIcon には `inline` variant を使用

- **決定**: Trailing スロットの GearIcon には `overlay`（白背景＋シャドウ）ではなく `inline`（ホバー背景のみ）variant を使用する
- **理由**: ヘッダー背景が `bg-white/80 backdrop-blur-xl` のため、`overlay` の白背景と二重になって視覚的に不自然になる。`inline` はヘッダークロームに自然に溶け込む。
