# Task Plant

## 概要

大学生活と就職活動のマルチタスクを整理し、「今、何をすべきか」を瞬時に把握することに特化した個人向けタスク管理PWA（ウェブアプリをスマホアプリのように動かす技術）です。AIへの音声入力でタスクを登録でき、GmailやGoogleカレンダーとも連携します。タスクを完了するたびに植物が育つ視覚的なゲーミフィケーション要素も搭載しています。個人利用専用として設計されており、Vercel上で公開されています。

---

## 主な機能

- Gemini AIへの音声または文章入力から、タスク名・期限・カテゴリを自動抽出して登録できる
- Gmailの受信メールからAIがタスク候補を検出し、ワンタップで取り込める
- Googleカレンダーの予定をタスクとして取り込み、締切管理を一元化できる
- 毎日・毎週・毎月の繰り返しタスクを自動生成できる
- 週次完了数に応じて植物が育つ12か月・4アーキタイプの成長演出と毎日の完了ストリーク（連続達成記録）が確認できる
- オフライン状態でも動作し（IndexedDB使用）、スマートフォンのホーム画面にアプリとして追加できる

---

## 技術スタック

フロントエンド：Next.js 16（Reactベースのウェブアプリフレームワーク）、TypeScript、Tailwind CSS v4、Dexie.js（ブラウザ内データベースIndexedDBのラッパー）
インフラ・環境：Vercel（ホスティングプラットフォーム）
AI・外部API：Gemini 2.5 Flash API（Google製AI）、Google Identity Services OAuth2（ログイン認証）、Gmail API、Google Calendar API

---

## アーキテクチャの特徴

- PWA（Progressive Web App）＋IndexedDB（Dexie.js）によりオフラインファーストで動作する設計
- ドメインロジック（カテゴリ・植物成長・タスク日付計算）を`lib/domain/`に純粋関数として分離し、テスト容易性を確保

---

## 開発環境のセットアップ

必要なツール：Node.js、pnpm、Gemini APIキー、Google OAuth 2.0クライアントID

`.env.local` を作成して以下を設定します。

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

```bash
pnpm install
pnpm dev
```

| コマンド | 内容 |
|---|---|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | 本番ビルド |
| `pnpm lint` | コード品質チェック |
| `npx tsc --noEmit` | 型チェック |
