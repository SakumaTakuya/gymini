# gymini

筋トレ記録 × AI コーチング Web アプリ。本ファイルは **要求仕様（PRD）のインデックス**。プロダクトとして何を・なぜ作るかの正は [docs/prd/](docs/prd/index.md)。

## 要求 ID の規約

要求 ID（`FR_xxx` / `IR_xxx` / `DC_xxx`）は **PRD ごとのローカル名前空間**であり、グローバル一意ではない。

- 同じ番号が別 PRD では別の要求を指す。例: `FR_013` は [ai-chat](docs/prd/ai-chat/index.md) では「即時挿入カードのセット編集」、[history](docs/prd/history/index.md) では「月表示カレンダー」。`FR_005/006`・`FR_031/032`・`FR_036` 等も PRD ごとに別物。
- そのため **PRD をまたいで ID を参照するときは PRD 名を併記**する（例:「ai-chat FR_013」）。コード/テスト内のコメント参照も同様に修飾するのが望ましい。
- `REQ_xxx` は system レベルの横断要求で、[index.md](docs/prd/index.md) §3 の全体要求図が正。`REQ_007`（UI 設計）/ `REQ_008`（AI 書き込みレビュー）/ `REQ_010`（プロフィール）のように複数 PRD が 1 つの REQ を分担する。

## PRD 一覧

`docs/prd/` 配下。所有 ID は当該 PRD のローカル名前空間。

| PRD | Phase | 親 REQ | 所有 FR/IR/DC（PRD ローカル）|
|:---|:---|:---|:---|
| [index.md](docs/prd/index.md) | — | REQ_001〜REQ_010 | 全体概要・ビジョン・全体要求図・共通制約（DC_001〜004）・用語集 |
| [workout](docs/prd/workout/index.md) | 1 / 4 | REQ_002, REQ_008 | FR_001, FR_003, FR_005, FR_006, FR_028〜FR_032, FR_036 |
| [exercise-master](docs/prd/exercise-master/index.md) | 1 | REQ_003 | FR_005〜FR_007 |
| [api-key](docs/prd/api-key/index.md) | 2 | REQ_004 | FR_008〜FR_011 |
| [ai-chat](docs/prd/ai-chat/index.md) | 3 → 4（FRAME2 統合）| REQ_005, REQ_008 | FR_011, FR_012（_01〜_09）, FR_013〜FR_015, FR_033〜FR_038 |
| [history](docs/prd/history/index.md) | 1 | REQ_006 | FR_013〜FR_015, FR_026〜FR_028 |
| [settings](docs/prd/settings/index.md) | 2 | REQ_009, REQ_010 | FR_021〜FR_026 |
| [user-profile.md](docs/prd/settings/user-profile.md) | 2 | REQ_010 | FR_031〜FR_034 |
| [navigation.md](docs/prd/navigation.md) | 1〜4 | REQ_007 | FR_017〜FR_020, IR_001〜IR_002, DC_005 |
| [app-header.md](docs/prd/app-header.md) | 2 | REQ_007, REQ_010 | IR_003〜IR_007, DC_006 |

> 注: 旧 FRAME4（独立 AI チャット画面 / `/ai` ルート）は撤去済み。AI 対話は FRAME2（[workout](docs/prd/workout/index.md)）のタイムライン UX に統合され、その振る舞いは [ai-chat](docs/prd/ai-chat/index.md) が所有する。

## 開発

コマンド・アーキテクチャ・テスト方針は [CLAUDE.md](CLAUDE.md)、設計判断は [docs/adr/](docs/adr/README.md)、憲法（不変の制約）は [docs/CONSTITUTION.md](docs/CONSTITUTION.md) を参照。
