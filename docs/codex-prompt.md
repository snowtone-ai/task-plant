# Codex CLI 実行プロンプト

> このファイルの内容をCodex CLIに渡して実行する。

---

## プロンプト本文

```
あなたは Task Plant PWA の実装者です。既存の task-manager を Task Plant へ進化させます。

## 前提

- ブランチ: `feat/task-plant`（チェックアウト済み）
- 実装計画書: `docs/implementation-plan.md` を必ず最初に全文読み、Phase 1 から Phase 7 まで順番に実装してください
- 計画係が作成済みのファイル（編集禁止）:
  - `src/lib/api/google-auth.ts`
  - `src/hooks/use-google-auth.ts`
  - `src/lib/domain/plant.ts`
- 技術スタック: Next.js 16+ (App Router) / React 19 / TypeScript strict / Tailwind CSS v4 / Dexie.js / pnpm

## 絶対に守るルール

1. **実装計画書に忠実に従う**。計画書にないファイルを作らない。計画書にない機能を追加しない
2. **各フェーズ完了ごとに `pnpm typecheck && pnpm lint` を実行**し、エラー 0 を確認してから次フェーズへ進む
3. **依存パッケージを追加しない**（`pnpm add` 禁止）。PixiJS は不採用。Canvas 2D API で実装する
4. **計画係が作成済みの 3 ファイルを編集しない**
5. `"use client"` は状態管理・ブラウザ API が必要な時だけ。コンポーネントツリーの末端に配置
6. IndexedDB を使うコンポーネントは `dynamic(() => import(...), { ssr: false, loading: () => <フォールバック> })` でラップ。`loading` 省略禁止
7. Dexie の DB インスタンスは遅延初期化（`getDb()` パターン）。モジュールトップレベルでインスタンス化しない
8. Tailwind スタイルは `globals.css` の `@theme` で定義。`tailwind.config.ts` を作らない
9. 1ファイル 300 行、1関数 50 行を目安に分割
10. `.env` / `.env.local` をコミットしない。force push / reset --hard 禁止
11. `<html>` タグには `suppressHydrationWarning` を付ける（既存で対応済み、変更しないこと）

## 実装順序

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

各フェーズの詳細は `docs/implementation-plan.md` に記載済み。コードスニペットも含まれているので、そのまま使用して構わない。ただし型エラーや lint エラーが出た場合は計画書のコードより TypeScript の型安全性を優先して修正すること。

## 完了条件

- `pnpm typecheck` → エラー 0
- `pnpm lint` → エラー 0
- `pnpm build` → 成功
- `docs/implementation-plan.md` の新規ファイル一覧と変更ファイル一覧がすべて実装済み
- 植物 SVG コンポーネント 4 種（upright / cherry / hanging / delicate）がそれぞれ stage 0-5 を描画可能

## 最終報告

全フェーズ完了後、以下を報告してください:
1. 作成したファイル一覧
2. 変更したファイル一覧
3. `pnpm typecheck && pnpm lint && pnpm build` の結果
4. ユーザーに以下の目視確認を依頼:

> ブラウザで http://localhost:3000 を開き、以下を確認してください:
> 1. 下部ナビに「ホーム / カレンダー / 植物」の 3 タブが表示されている
> 2. 「植物」タブをタップすると植物画面に切り替わる
> 3. 植物画面に今月の花の名前と SVG 植物が表示されている
> 4. ホームに戻り、タスクカードの右端の矢印をタップすると詳細が展開される
> 5. Gmail アイコン（ヘッダー右）をタップするとインポート画面が開く

では、`docs/implementation-plan.md` を読むところから始めてください。
```
