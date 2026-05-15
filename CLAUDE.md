# Claude Code Adapter -- pm-zero v9.3

@AGENTS.md

## Claude-specific
- Claude CodeはCLAUDE.mdを読む。共通ルールはAGENTS.mdを一次ソースにする。
- 計画、設計、レビュー、文章品質判断を優先する。
- 実装タスクはtasks.mdに書く。
- ナビゲーションにはdocs/repo-map.md Summaryを使い、詳細セクションは必要時に読む。
- ファイル操作、git、build、test、lintはグローバル設定とプロジェクト境界に従い自動実行する。
- Codex CLIと同じbranchを同時編集しない。
- /resume /escape /audit /reference /ev /env-guide /console-debug /verify は .claude/skills/index.md の該当章を読む。

## Shell Policy
- Primary: PowerShell for all project operations.
- Project paths use Windows paths with backslash in PowerShell.
- Node.js scripts run with node scripts/name.mjs.

## Version Policy
- ユーザーが現在設定しているClaude Codeバージョンを維持する。
- Phase 0でローカルバージョンを検証する。

## 技術スタック
Next.js 16+ (App Router) / React 19 / TypeScript (strict: true) / Tailwind CSS v4 / pnpm / Vercel
PWA構成（next-pwa） / IndexedDB（Dexie.js） / Web Speech API / Gemini 2.5 Flash API

## 地雷回避ルール
- Tailwind のスタイル設定時 → globals.css の @theme で定義する。tailwind.config.ts は作らない（v4 CSS-First Configuration）
- ページコンポーネントで params/searchParams を使う時 → 必ず await で非同期アクセスする（Next.js 16で同期アクセスは完全削除済み）
- cookies() / headers() を使う時 → 必ず await する（Next.js 16で同期アクセスは完全削除済み）
- middleware を使う時 → ファイル名は proxy.ts、エクスポート関数名も proxy にする（Next.js 16で middleware.ts は廃止）
- パッケージの依存関係エラー時 → --force ではなく pnpm を使う
- Vercel にデプロイする前 → npx tsc --noEmit && pnpm lint && pnpm build をローカルで実行する
- Server Component をデフォルトにする。"use client" は状態管理やブラウザAPIが必要な時だけ追加し、コンポーネントツリーの末端（リーフ）に配置する
- @tailwind base/components/utilities を使わない → @import "tailwindcss" の1行に置き換える
- postcss.config に postcss-import や autoprefixer を書かない → Tailwind v4 が内部処理する
- IndexedDB（Dexie.js）を使うコンポーネントを page.tsx から呼ぶ時 → `"use client"` + `dynamic(() => import(...), { ssr: false, loading: <フォールバックUI> })` でSSRを無効化する。Server Componentで `ssr: false` を使うとビルドエラーになるため、page.tsx 自体を `"use client"` にする。`loading` プロパティを省略するとchunk解決失敗時に画面が真っ白になるため必須
- Dexie の `new Dexie()` はモジュールトップレベルではなく **遅延初期化**にする（`getDb()` + Proxy）。モジュールロード時にインスタンス化するとSSRで `typeof window === "undefined"` の環境でも評価されてしまう

## 知識同期ルール（Context7 MCP）
- Next.js / React / Tailwind / shadcn/ui / Dexie.js のAPIを使う時 → 必ず Context7 MCP で公式ドキュメントを確認してから実装する。推測で実装しない。例外なし

## Web調査ルール（Brave Search MCP）
- エラーの解決策を調べる時 → Brave Search MCP で最新の情報を検索する
- ライブラリの選定・比較を行う時 → Brave Search MCP で現在の評価・互換性を確認する

## 外部サービス事前調査ルール
- 外部API・サービス・AIモデルを使う時 → 実装前に Brave Search MCP で以下を必ず確認する：
  (1) 現在の最新バージョン/モデル名（古いバージョンを使わない）
  (2) 無料枠の制限（RPM / TPM / 日次クォータ / 月次クォータ）
  (3) 料金体系（従量課金の単価、無料枠超過時の挙動）
  (4) レート制限の回避策（バックオフ、バッチ処理、キュー）
- 調査結果を vision.md の制約セクション（または該当タスクのコメント）に記録する
- 「たぶんこのモデル/バージョンで大丈夫」は禁止。確認してから使う

## 自己検証ルール（Playwright MCP + ユーザー目視）
- UI機能の実装後 → Playwright MCP でブラウザ上の動作を検証する
- 検証完了後 → ユーザーに「ブラウザで http://localhost:3000/[パス] を開き、[具体的に何が見えるか] を確認してください」と指示する。AIの自己申告だけで完了としない
- 機能実装後 → vision.md の Acceptance Criteria の各項目について合否を1行ずつ報告する

## エラーループ脱出ルール
- 同じエラーを2回修正して直らない時 → 修正を止めて以下を実行する：
  (1) 根本原因の仮説を述べる
  (2) 試した修正とその結果を列挙する
  (3) 解決に不足している情報を特定する
  (4) ユーザーに判断を仰ぐ

## 3層境界
- ✅ Always: テスト実行、lint通過確認、動作確認コミット、Plan Mode でのタスク開始
- ⚠️ Ask first: 新規依存の追加、DB/APIスキーマ変更、設定ファイル（package.json等）の変更
- 🚫 Never: .env のコミット、node_modules 編集、失敗テストの削除

## コンテキスト管理
- /compact 時は変更ファイル一覧と現在のタスク状況を必ず保持する
- 3タスク完了ごと、または30分経過時 → /context でトークン使用率を確認しユーザーに報告する

## 自己改善
- 間違えた時 → このファイルにルールを追加して再発防止する（最終行に記載）
- `<html>` タグを書く時 → `suppressHydrationWarning` を必ず付ける。VS Code等のブラウザ拡張が `--vsc-domain` などの属性を注入してhydration mismatchを起こすため
- Service Worker の `install` イベントで `cache.addAll([...])` を **使ってはいけない**。`addAll` は全URLの成功を要求するため、1つでも404/networkエラーだとinstall全体が失敗し、古いSWが永続化して全ユーザーが詰む（「読み込み中のまま」バグの真因）。install は `self.skipWaiting()` のみで絶対に失敗しない形にし、キャッシュは `fetch` イベントで都度 `cache.put` する
- `controllerchange` リスナーは **`navigator.serviceWorker.controller` の有無に関わらず常に登録** する。条件付き登録だと初回SW登録時の controller 取得イベントを取りこぼす
- Service Worker 登録時は必ず `{ updateViaCache: "none" }` を指定し、`reg.update()` を毎ロード呼び出す。これでブラウザの HTTP キャッシュをバイパスして `/sw.js` を常に最新版で取得する
- PWA の `loading` state は **1.5秒以内** にフォールバック解除する。5秒だとADHDユーザーが「壊れた」と判定してアプリを閉じる
