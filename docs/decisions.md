# decisions.md

## D-001: CLAUDE.md構造 — @AGENTS.md import方式
- 日付: 2026-05-09
- 対象: architecture
- 決定: CLAUDE.mdは@AGENTS.mdを冒頭でインポートし、プロジェクト固有ルールのみ記載
- 採用理由: v9.1の二重記載禁止ルール
- 不採用案: AGENTS.mdに全ルールを統合 → プロジェクト固有の地雷回避ルールが汎用指示と混在
- 将来見直し条件: Claude Codeが@importを正式サポートした場合

## D-002: vision.md の配置 — docs/ ディレクトリへ移動
- 日付: 2026-05-09
- 対象: architecture
- 決定: vision.md をルートから docs/vision.md に移動
- 採用理由: v9.1 Memory Layer仕様。state/decisions/issuesと同一ディレクトリに統一
- 不採用案: ルートに残す → 一貫性が崩れる
- 将来見直し条件: なし

## D-003: Service Worker — cache.addAll 禁止
- 日付: 2026-05-09（既存判断の記録）
- 対象: architecture
- 決定: install イベントで cache.addAll を使わず、fetch イベントで cache.put
- 採用理由: addAll は1URLでも失敗すると全体が失敗し、古いSWが永続化する
- 参照例: CLAUDE.md 自己改善セクション
- 将来見直し条件: なし

## D-004: データストア — IndexedDB (Dexie.js) + 遅延初期化
- 日付: 2026-05-09（既存判断の記録）
- 対象: architecture
- 決定: Dexieインスタンスを getDb() + Proxy で遅延初期化
- 採用理由: SSR環境でのモジュールトップレベル評価を防止
- 将来見直し条件: Next.js の SSR 仕様が変わった場合

## D-005: Observability — MVP段階では後回し
- 日付: 2026-05-09
- 対象: architecture
- 決定: MVP段階では構造化ログ・APMは導入しない。console.error/warn/info の使い分けのみ
- 採用理由: 個人利用PWAのため。本番運用で問題が出たら導入
- 将来見直し条件: ユーザー数が増えた場合、本番障害が追跡困難になった場合

## D-006: ディレクトリ構造 — domain/api/hooks に責務分離
- 日付: 2026-05-09
- 対象: architecture
- 決定: pure domain logic を `src/lib/domain/`、外部API補助を `src/lib/api/`、React副作用を `src/hooks/` に分ける
- 採用理由: 300行超ファイルを分割し、UI / domain / data の責務混在を減らすため
- 不採用案: PRODUCT-OPTIMIZATION.md の全構成を一括導入 → diffが大きくなり既存機能の回帰リスクが高い
- 将来見直し条件: テスト基盤導入後に `taskDb.ts` を query/mutation 単位へ追加分割する場合

## D-007: Service Worker管理 — 今回は既存ファイルを維持
- 日付: 2026-05-09
- 対象: architecture
- 決定: `src/components/pwa-register.tsx` は64行でゲート内のため、今回は抽出しない
- 採用理由: Service Workerは既存の地雷回避ルールが多く、不要な移動は回帰リスクになるため
- 不採用案: `lib/services/sw-manager.ts` へ即時抽出 → 動作差分の検証コストが高い
- 将来見直し条件: SW更新UIや複数登録パスが増えた場合

## D-008: テスト基盤 — Node built-in test を先行採用
- 日付: 2026-05-09
- 対象: process
- 決定: pure domain helper は Node.js built-in test runner で検証し、Playwright/Vitest導入は別タスクで実施
- 採用理由: 追加依存なしで最低限の再現テストを導入し、品質改善リファクタと依存追加を分離するため
- 不採用案: 依存を即時追加してE2E/Unitを実装 → ロックファイル変更とテスト設定変更が大きくなる
- 将来見直し条件: 次の機能追加またはバグ修正に着手する前

## D-009: Google Auth — GIS OAuth2 参照を事前確定
- 日付: 2026-05-09
- 対象: api
- 決定: `requestGoogleToken` は `google.accounts.oauth2` をローカル変数へ確定してから `initTokenClient` を呼ぶ
- 採用理由: TypeScript narrowing を Promise 内でも維持し、GIS未ロード時は明示的に拒否するため
- 実在例:
  - 初回ロード直後で GIS script が未完了の場合、`window.google` が存在しない
  - script は読み込まれたが accounts API 初期化前の場合、`google.accounts` が存在しない
  - OAuth2 API が利用不能な場合、`google.accounts.oauth2` が存在しない
- 不採用案: non-null assertion の追加のみ → 実行時の欠落検出が弱くなる
- 将来見直し条件: GIS loader を明示導入し、読み込み状態を UI で管理する場合

## D-010: Task Plant Phase1-7 実装方針（UI/API/DB/Workflow）
- 日付: 2026-05-09
- 対象: ui/api/db/workflow
- 決定: `docs/implementation-plan.md` の Phase 1→7 を順守し、追加依存なしで実装する
- 実在例:
  - UI例1: 下部ナビを「ホーム / カレンダー / 植物」の3タブに拡張し、`/plant` への導線を統一
  - UI例2: ホームのタスクカード右端に展開トグルを追加し、既存の「カードタップで編集」導線は維持
  - UI例3: `/all` のリスト表示に「今日以降のみ表示」トグルを追加し、既定値をONにする
  - API例1: Gmail APIで直近7日/最大20件を取得し、Geminiでタスク候補抽出後にユーザー選択で反映
  - API例2: Google Calendar APIで将来イベント最大30件を取得し、タスク形式へ変換して取り込む
  - API例3: Google Identity Servicesを`layout.tsx`へ読み込み、`use-google-auth.ts`経由でOAuth接続する
  - DB例1: Dexie `version(2)` で `plantState` テーブルを追加し、`version(1)` は維持する
  - DB例2: `plantState(id=1)` に週次完了数/累計完了数/週開始日を保存し、週跨ぎで `weeklyCompleted` をリセット
  - DB例3: 植物成長段階を `weeklyCompleted` から算出し、タスク完了/取消で増減を同期する
  - Workflow例1: 各Phase完了ごとに `npx tsc --noEmit && pnpm lint` を実行して次Phaseへ進む
  - Workflow例2: IndexedDBを使う画面は `dynamic(..., { ssr: false, loading })` で遅延描画する
  - Workflow例3: 最終検証で `npx tsc --noEmit` / `pnpm lint` / `pnpm build` をすべて通す
- 不採用案: PixiJS導入（依存追加が必要でコストゼロ制約に反する）
- 将来見直し条件: OAuthスコープ追加や月次植物ロジック変更が発生した場合

## D-011: 12か月植物デザイン — 実物の成長差をSVGに反映
- 日付: 2026-05-09
- 対象: ui
- 決定: 4アーキタイプの内部構成は維持しつつ、`PlantSpecies.nameEn` ごとに12種類の蕾・葉・花形を描き分ける
- 採用理由: 月替わり植物が同一テンプレートに見えると、1年周期の報酬体験が弱くなるため
- 実在例:
  - 樹木系: 桜は蕾から開花へ段階があり、梅は丸い5弁と目立つ雄しべ、蝋梅は葉の少ない枝に黄色い蝋質花を咲かせる
  - 蔓/低木系: 藤は垂れる総状花序、紫陽花は低木の葉と球状の装飾花房として表現する
  - 草花/球根系: 朝顔は双葉・蔓・漏斗状花、コスモスは細い分枝と舌状花、金木犀は葉腋の小花群、シクラメンは斑入り葉と反り返る花弁として表現する
- 不採用案: 4アーキタイプのみの色違い継続 → 12か月分の差が弱く、実物モデルの要求に合わない
- 将来見直し条件: 写真素材やCanvas/bitmap表現を採用して、より写実寄りにする場合

## D-012: Task.description フィールド — vision.md 未記載の拡張
- 日付: 2026-05-09
- 対象: db
- 決定: `Task` に `description?: string` を追加（vision.md のデータモデルには記載なし）
- 採用理由: タスクカードの展開表示で「詳細メモ」を入力・表示するため実装時に追加
- 将来見直し条件: vision.md のデータモデルセクションに正式追記する
- 影響ファイル: `src/lib/db.ts`, `src/components/home/task-add-modal.tsx`, `src/components/home/task-edit-modal.tsx`, `src/components/home/task-card.tsx`

## Future Changes
- Codex CLI を本格導入した場合、state.md の Write Lock 運用を厳格化
- ユーザー数増加時に Observability Gate の本格対応

## D-009: pm-zero v9.3移行 — tasks.md と repo-map.md を一次構造に追加
- 日付: 2026-05-15
- 対象: process
- 決定: 実行タスクは `tasks.md`、現在ポインタは `docs/state.md`、リポジトリナビゲーションは `docs/repo-map.md` に分離する
- 採用理由: pm-zero v9.3 の Task Ledger Gate / Repo Map Gate に合わせ、タスク状態と現在状態の重複を防ぐため
- 不採用案: `docs/state.md` にタスク一覧を残す → `tasks.md` と責務が重複し、更新漏れが起きやすい
- 将来見直し条件: pm-zero の次版で台帳責務が変更された場合

## D-010: 検証コマンド — package.json と scripts/verify.mjs を一致させる
- 日付: 2026-05-15
- 対象: process
- 決定: `pnpm typecheck`, `pnpm test`, `pnpm verify` を package.json に追加し、`scripts/verify.mjs` はそれらを呼ぶ
- 採用理由: AGENTS.md / OS-KERNEL.md が要求するコマンドと実在する npm scripts がズレていたため
- 不採用案: `npx tsc --noEmit` などを文書側に残す → v9.3標準コマンドと異なり、次セッションで迷う
- 将来見直し条件: テストランナーをVitest/Playwrightへ移行した場合

## D-011: パッケージ管理 — pnpmへ単一化
- 日付: 2026-05-15
- 対象: process
- 決定: `pnpm-lock.yaml` を唯一のロックファイルとし、旧 `package-lock.json` は削除する
- 採用理由: AGENTS.md / README.md / docs/repo-map.md がpnpmを一次パッケージマネージャーとして定義しており、npmロックが残ると依存更新経路が分岐するため
- 不採用案: `package-lock.json` を残して注意書きだけ追加 → 次回の自動実行でnpm/pnpmの混在が再発しやすい
- 将来見直し条件: プロジェクト標準をnpmへ戻す場合

## D-013: 植物画面復旧 — plantState + 共通下部ナビ
- 日付: 2026-05-15
- 対象: UI / domain
- 決定: 植物状態は既存の `plantState` 永続化を使い、下部ナビは `src/components/navigation/bottom-nav.tsx` に共通化する
- 実例1: `/` の下部ナビに「ホーム / カレンダー / 植物」を表示し、植物タブから `/plant` へ遷移する
- 実例2: `/all` の下部ナビも同じ3タブを使い、ページごとの複製差分で植物タブが消えないようにする
- 実例3: `/plant` は今月の植物名、今週の完了数、成長段階、SVG植物を表示し、IndexedDB読み込み失敗時も画面全体を空にしない
- 採用理由: リモート側で導入済みの `plantState` と同期しつつ、ナビ重複をなくすことで同種の表示欠落を防げるため
- 不採用案: 各画面に下部ナビを個別実装し続ける → ページ追加時にタブ欠落が再発しやすい
- 将来見直し条件: 月跨ぎ履歴、植物図鑑、手動育成状態など永続化が必要になった場合
