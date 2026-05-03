# ADR: typescript-migration

## コアデータモデル型を `src/types/index.ts` に集約

- **決定**: `Workout`、`Exercise` 等のコアデータモデル型を `src/types/index.ts` に集約する
- **理由**: ストア・リポジトリ・コンポーネント間での型定義の重複を防ぎ、型の一貫性を保つ。

## コンポーネントの Props 型を関数引数として渡す（`React.FC<Props>` 不使用）

- **決定**: `const Foo: React.FC<Props> = ...` ではなく `function Foo(props: Props)` の形式を使う
- **理由**: `React.FC` は `children` の暗黙的な型付けや戻り値型の制約の問題がある。引数として直接渡す方がシンプル。

## `moduleResolution` を `"bundler"` に設定

- **決定**: TypeScript の `moduleResolution` を `"bundler"` に設定する
- **理由**: Vite がモジュール解決を担うため、Vite プロジェクトには `"bundler"` が推奨設定。

## 全ファイルを一括変換（依存順序変換ではなく）

- **決定**: TypeScript 移行を依存チェーンの底から順番に変換するのではなく、一括変換する
- **理由**: 一括変換により全体の型整合性を維持できる。JavaScript/TypeScript の混在状態では中間的なビルドエラーが発生しやすい。

## `PendingSet` の weight/reps を `number` 型にする

- **決定**: `PendingSet` の `weight` と `reps` フィールドは `string` ではなく `number` 型とする
- **理由**: `SetRowInput` が `Number()` 変換を適用してからストアに渡している。ストアの型は実際の状態を反映すべき。

## `vite.config.ts` を `tsconfig.json` の `include` から除外

- **決定**: `vite.config.ts` を `tsconfig.json` の `include` に含めない（明示的に除外する）
- **理由**: Vite 8 と Vitest 3 の型定義が競合するため。`vite.config.ts` を除外することで競合を解消できる。
