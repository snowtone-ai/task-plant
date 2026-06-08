# Task Plant

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PWA](https://img.shields.io/badge/PWA-IndexedDB-green)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-orange?logo=google)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

> 「今、何をすべきか」を瞬時に把握できるタスク管理アプリ。タスクを完了するたびに植物が育つ

個人向けタスク管理PWAです。AIへの音声入力でタスクを登録でき、GmailやGoogleカレンダーとも連携します。Vercel上で公開されています。

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

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Next.js 16, TypeScript, Tailwind CSS v4, Dexie.js |
| インフラ | Vercel |
| AI / 外部連携 | Gemini 2.5 Flash, Google OAuth, Gmail API, Google Calendar API |

---

## 設計の工夫

- PWA + IndexedDB（Dexie.js）によりオフラインファーストで動作する設計
- ドメインロジック（カテゴリ・植物成長・タスク日付計算）を`lib/domain/`に純粋関数として分離し、テスト容易性を確保

---

## セットアップ

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

---

## ライセンス

MIT
