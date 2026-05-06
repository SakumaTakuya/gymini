---
paths:
  - "docs/**/*.md"
---

# ドキュメント構造

このプロジェクトのドキュメントは `docs/` 配下に置く。

```
docs/
├── CONSTITUTION.md       # プロジェクト原則（最上位）
├── design/               # デザインシステム（機械可読）
│   ├── tokens.md
│   ├── components.md
│   ├── focus.md
│   ├── button.md
│   └── input.md
├── prd/                  # PRD（プロダクト要求仕様書）
│   ├── index.md
│   ├── {feature}/index.md
│   └── {feature}.md
└── adr/                  # アーキテクチャ判断記録（ADR）
    └── {feature}.md
```

## PRD の役割

`docs/prd/` は「プロダクトとして何を・なぜ作るか」の唯一の真実。機能追加・変更時に更新必須。

## ADR の役割

`docs/adr/` は「なぜこの技術・パターンを選んだか」のアーキテクチャ判断記録。コードから読み取れない判断・トレードオフのみ記録する。コンポーネント構造・実装詳細は書かない。新規機能でアーキテクチャ上の判断が生じた場合のみ作成（任意）。

## ドキュメントリンク規約

| リンク先 | 形式 | リンクテキスト | 例 |
|:---|:---|:---|:---|
| **ファイル** | `[filename.md](パスまたはURL)` | ファイル名を含める | `[workout.md](../prd/workout/index.md)` |
| **ディレクトリ** | `[directory-name](パスまたはURL/index.md)` | ディレクトリ名のみ | `[workout](../prd/workout/index.md)` |
