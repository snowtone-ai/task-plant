# implementation-plan.md — Task Plant Evolution

> 対象実行者: CodeX 5.5 medium  
> 策定者: Claude 4.6 Opus（計画係）  
> 策定日: 2026-05-09  
> ブランチ: `feat/task-plant`（作成済み）

---

## 全体概要

既存の `task-manager` PWA を **Task Plant** へ進化させる。  
タスク管理機能の強化（Gmail/Calendar連携、UI改善）＋ 植物成長システム（裏機能）の追加。

**コストゼロ制約**: すべて無料枠 / OSS で実現する。  
**ターゲット端末**: OPPO Reno 3A (Android Chrome PWA)

---

## 完了済み作業（計画係が実施済み）

以下は既に `feat/task-plant` ブランチに反映済み。再実装不要。

| 完了項目 | ファイル |
|---|---|
| GitHubリポジトリ名変更 | `Snowtone-ai/task-plant` |
| git remote URL 更新 | `.git/config` |
| パッケージ名変更 | `package.json` → `"name": "task-plant"` |
| PWA manifest 名変更 | `src/app/manifest.ts` → `"Task Plant"` |
| layout metadata 変更 | `src/app/layout.tsx` → `"Task Plant"` |
| Google OAuth 基盤 | `src/lib/api/google-auth.ts`（新規作成済み） |
| Google Auth フック | `src/hooks/use-google-auth.ts`（新規作成済み） |
| 植物ドメインロジック | `src/lib/domain/plant.ts`（新規作成済み） |

---

## フェーズ一覧（CodeX が実装する範囲）

| Phase | 内容 | 依存 | 新規ファイル数 | 変更ファイル数 |
|---|---|---|---|---|
| 1 | GIS スクリプト読み込み + DB スキーマ拡張 | なし | 0 | 2 |
| 2 | 植物成長システム | Phase 1 | 8 | 3 |
| 3 | Gmail タスク自動生成 | Phase 1 | 3 | 1 |
| 4 | Google Calendar インポート | Phase 1 | 2 | 1 |
| 5 | UI/UX 刷新（ナビ・展開・フィルタ・フリップ） | Phase 2 | 0 | 4 |
| 6 | アプリアイコン刷新 | なし | 1 | 1 |
| 7 | 最終検証 | 全フェーズ | 0 | 0 |

**各フェーズ完了ごとに `npx tsc --noEmit && pnpm lint` を実行し、エラー0で次へ進むこと。**

---

## Phase 1: 基盤整備

### 1-1. GIS スクリプトを layout.tsx に追加

**ファイル: `src/app/layout.tsx`**

`import Script from "next/script"` を追加し、`<body>` 直前（`<html>` の子の先頭位置）に以下を挿入:

```tsx
<Script
  src="https://accounts.google.com/gsi/client"
  strategy="beforeInteractive"
/>
```

### 1-2. DB スキーマに plantState テーブルを追加

**ファイル: `src/lib/db.ts`**

#### 型定義を追加（`Streak` interface の後）:

```typescript
export interface PlantState {
  id?: number;
  weeklyCompleted: number;
  lifetimeCompleted: number;
  weekStartDate: string; // YYYY-MM-DD (月曜起点)
  lastUpdated: string;   // ISO datetime
}
```

#### DB クラスに plantState テーブルを追加:

```typescript
class TaskManagerDB extends Dexie {
  tasks!: Table<Task, string>;
  streaks!: Table<Streak, string>;
  plantState!: Table<PlantState, number>;  // ← 追加

  constructor() {
    super("TaskManagerDB");
    this.version(1).stores({
      tasks: "id, dueDate, category, completed, recurrence",
      streaks: "date",
    });
    // ← 追加: version 2 で plantState テーブルを追加
    this.version(2).stores({
      tasks: "id, dueDate, category, completed, recurrence",
      streaks: "date",
      plantState: "++id",
    });
  }
}
```

> **注意**: Dexie のバージョニングは累積。version(1) を消さず version(2) を追加する。

---

## Phase 2: 植物成長システム

### 2-1. usePlant フック

**新規ファイル: `src/hooks/use-plant.ts`**

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { getDb, type PlantState } from "@/lib/db";
import {
  calcGrowthStage,
  getCurrentSpecies,
  type GrowthStage,
  type PlantSpecies,
} from "@/lib/domain/plant";

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  // 月曜起点: 日曜=0 → 6日前, 月曜=1 → 0日前, ...
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function usePlant() {
  const [state, setState] = useState<PlantState | null>(null);
  const species: PlantSpecies = getCurrentSpecies();
  const stage: GrowthStage = state ? calcGrowthStage(state.weeklyCompleted) : 0;

  useEffect(() => {
    async function load() {
      const db = getDb();
      let ps = await db.plantState.get(1);
      const weekStart = getWeekStart();
      const now = new Date().toISOString();

      if (!ps) {
        ps = {
          id: 1,
          weeklyCompleted: 0,
          lifetimeCompleted: 0,
          weekStartDate: weekStart,
          lastUpdated: now,
        };
        await db.plantState.put(ps);
      } else if (ps.weekStartDate < weekStart) {
        ps = { ...ps, weeklyCompleted: 0, weekStartDate: weekStart, lastUpdated: now };
        await db.plantState.put(ps);
      }
      setState(ps);
    }
    load().catch((err) => console.error("[plant] load failed:", err));
  }, []);

  const incrementCompleted = useCallback(async () => {
    const db = getDb();
    const ps = await db.plantState.get(1);
    if (!ps) return;
    const updated: PlantState = {
      ...ps,
      weeklyCompleted: ps.weeklyCompleted + 1,
      lifetimeCompleted: ps.lifetimeCompleted + 1,
      lastUpdated: new Date().toISOString(),
    };
    await db.plantState.put(updated);
    setState(updated);
  }, []);

  const decrementCompleted = useCallback(async () => {
    const db = getDb();
    const ps = await db.plantState.get(1);
    if (!ps || ps.weeklyCompleted <= 0) return;
    const updated: PlantState = {
      ...ps,
      weeklyCompleted: ps.weeklyCompleted - 1,
      lifetimeCompleted: Math.max(0, ps.lifetimeCompleted - 1),
      lastUpdated: new Date().toISOString(),
    };
    await db.plantState.put(updated);
    setState(updated);
  }, []);

  return { state, species, stage, incrementCompleted, decrementCompleted };
}
```

### 2-2. タスク完了時に植物成長を連動

**ファイル: `src/hooks/use-home-screen.ts`**

`handleToggle` 関数内で、タスクを完了にした時（`!task.completed` が true の時）に `incrementCompleted()` を呼ぶ。  
タスク完了を取り消した時に `decrementCompleted()` を呼ぶ。

実装方法:
1. `useHomeScreen` の先頭で `usePlant()` を呼ぶ（循環依存に注意: `usePlant` は IndexedDB 専用なので問題ない）
2. `handleToggle` 内の `updateCompletionEffects` の後に:
   - `isCompleting === true` なら `incrementCompleted()`
   - `isCompleting === false` なら `decrementCompleted()`

```typescript
// handleToggle 内、updateCompletionEffects の後に追加:
if (!task.completed) {
  await plant.incrementCompleted();
} else {
  await plant.decrementCompleted();
}
```

> `plant` は `const plant = usePlant()` で取得した戻り値。

### 2-3. 植物 SVG コンポーネント（4アーキタイプ）

**重要**: 各コンポーネントは props として `stage: 0|1|2|3|4|5`、`color: string`、`accentColor: string` を受け取る。  
全 SVG に `className="plant-sway"` を付けて CSS で風揺れを表現する。  
SVG viewBox は `"0 0 300 400"` で統一。

#### 新規ファイル: `src/components/plant/upright-flower.tsx`

対象植物: バラ(5月)・ひまわり(7月)・菊(11月)・シクラメン(12月)

描画仕様（全て SVG `<path>` / `<circle>` / `<ellipse>` で実装）:
- stage 0: 茶色い土の入った鉢（楕円 + 台形）のみ
- stage 1: 鉢の中心から細い緑の茎が伸びる（高さ 30%）
- stage 2: 茎が伸びる（高さ 50%）+ 左右に小さな葉2枚
- stage 3: 茎が伸びる（高さ 70%）+ 葉4枚 + 先端に閉じたつぼみ（楕円、`color` で着色）
- stage 4: 花びら6枚展開（`color` で着色、中心は `accentColor`）+ 葉4枚
- stage 5: 花びら8枚 + 中心黄色 + 葉6枚 + 全体が少し大きくなる（transform: scale(1.05)）

```tsx
"use client";

interface Props {
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  color: string;
  accentColor: string;
}

export function UprightFlower({ stage, color, accentColor }: Props) {
  return (
    <svg viewBox="0 0 300 400" className="plant-sway w-full h-full">
      {/* 鉢 */}
      <ellipse cx="150" cy="370" rx="55" ry="14" fill="#8B6914" />
      <path d="M100 355 L115 385 L185 385 L200 355 Z" fill="#A0782A" />
      <ellipse cx="150" cy="355" rx="50" ry="12" fill="#B8860B" />

      {/* 土 */}
      <ellipse cx="150" cy="355" rx="42" ry="8" fill="#5C3317" />

      {/* 茎 (stage >= 1) */}
      {stage >= 1 && (
        <line
          x1="150" y1="348"
          x2="150" y2={stage === 1 ? 280 : stage === 2 ? 230 : 180}
          stroke="#2D6A2D" strokeWidth="5" strokeLinecap="round"
        />
      )}

      {/* 葉 (stage >= 2) */}
      {stage >= 2 && (
        <>
          <ellipse cx="130" cy="300" rx="20" ry="8" fill="#3A8C3A" transform="rotate(-30 130 300)" />
          <ellipse cx="170" cy="310" rx="20" ry="8" fill="#3A8C3A" transform="rotate(30 170 310)" />
        </>
      )}
      {stage >= 3 && (
        <>
          <ellipse cx="125" cy="260" rx="22" ry="9" fill="#45A045" transform="rotate(-25 125 260)" />
          <ellipse cx="175" cy="270" rx="22" ry="9" fill="#45A045" transform="rotate(25 175 270)" />
        </>
      )}
      {stage >= 5 && (
        <>
          <ellipse cx="120" cy="230" rx="18" ry="7" fill="#50B050" transform="rotate(-35 120 230)" />
          <ellipse cx="180" cy="240" rx="18" ry="7" fill="#50B050" transform="rotate(35 180 240)" />
        </>
      )}

      {/* つぼみ (stage 3) */}
      {stage === 3 && (
        <ellipse cx="150" cy="170" rx="12" ry="18" fill={color} opacity="0.8" />
      )}

      {/* 開花 (stage 4-5) */}
      {stage >= 4 && (
        <g transform={stage === 5 ? "translate(150,160) scale(1.15)" : "translate(150,160)"}>
          {Array.from({ length: stage === 5 ? 8 : 6 }).map((_, i) => (
            <ellipse
              key={i}
              cx="0" cy="-22"
              rx="12" ry="20"
              fill={color}
              transform={`rotate(${i * (360 / (stage === 5 ? 8 : 6))})`}
              opacity="0.9"
            />
          ))}
          <circle cx="0" cy="0" r="10" fill={stage === 5 ? "#FFD700" : accentColor} />
        </g>
      )}
    </svg>
  );
}
```

> 上記は **参考実装**。残り3アーキタイプも同じパターンで作成する。

#### 新規ファイル: `src/components/plant/cherry-blossom.tsx`

対象植物: 梅(1月)・蝋梅(2月)・桜(3月)

描画仕様:
- 鉢の代わりに地面（楕円 + 土色）
- 主幹が Y 字に分岐する3本の枝（`<path>` の curve）
- stage 0: 地面のみ
- stage 1: 主幹のみ（短い幹）
- stage 2: Y 字分岐の枝
- stage 3: 枝先に小さなつぼみ（5-8個の `<circle>` r=4）
- stage 4: つぼみが開花（`<circle>` r=6, `color` 着色）10-15個
- stage 5: 満開（20+ 個の花）+ 散り花アニメーション用 CSS class `petal-fall` を付けた数個の `<circle>`

#### 新規ファイル: `src/components/plant/hanging-cluster.tsx`

対象植物: 藤(4月)・紫陽花(6月)

描画仕様:
- 上部に横に広がる枝
- 枝から垂れ下がる/ドーム状の花房
- stage 0: 鉢のみ
- stage 1: 茎と上部の枝
- stage 2: 枝に葉
- stage 3: 小さな花房が垂れ始める
- stage 4: 花房が成長（`color` 着色の `<ellipse>` クラスター）
- stage 5: 花房が最大サイズ + 色が鮮やかに

#### 新規ファイル: `src/components/plant/delicate-flower.tsx`

対象植物: 朝顔(8月)・コスモス(9月)・金木犀(10月)

描画仕様:
- 細い茎が複数（2-3本）蔓状に伸びる
- 小さな花弁が複数箇所に咲く
- stage 4-5: 3-5 個の花頭が各茎の先に配置

### 2-4. PlantRenderer（ルーター）

**新規ファイル: `src/components/plant/plant-renderer.tsx`**

```typescript
"use client";

import { UprightFlower } from "./upright-flower";
import { CherryBlossom } from "./cherry-blossom";
import { HangingCluster } from "./hanging-cluster";
import { DelicateFlower } from "./delicate-flower";
import type { GrowthStage, PlantSpecies } from "@/lib/domain/plant";

interface Props {
  species: PlantSpecies;
  stage: GrowthStage;
}

export function PlantRenderer({ species, stage }: Props) {
  const { color, accentColor, archetype } = species;
  const p = { stage, color, accentColor };

  switch (archetype) {
    case "cherry":   return <CherryBlossom {...p} />;
    case "hanging":  return <HangingCluster {...p} />;
    case "delicate": return <DelicateFlower {...p} />;
    default:         return <UprightFlower {...p} />;
  }
}
```

### 2-5. CSS 風揺れアニメーション

**ファイル: `src/app/globals.css`（末尾に追加）**

```css
/* ── Plant animations ──────────────────────────────────────────────── */
@keyframes plant-sway {
  0%   { transform: rotate(0deg) translateX(0); }
  25%  { transform: rotate(1.5deg) translateX(2px); }
  75%  { transform: rotate(-1.5deg) translateX(-2px); }
  100% { transform: rotate(0deg) translateX(0); }
}

.plant-sway {
  animation: plant-sway 3s ease-in-out infinite;
  transform-origin: bottom center;
}

@keyframes petal-fall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
}

.petal-fall {
  animation: petal-fall 2.5s ease-in forwards;
}

/* ── Card flip (Task ↔ Plant) ──────────────────────────────────────── */
@keyframes flip-out {
  from { transform: perspective(1200px) rotateY(0deg); opacity: 1; }
  to   { transform: perspective(1200px) rotateY(90deg); opacity: 0; }
}

@keyframes flip-in {
  from { transform: perspective(1200px) rotateY(-90deg); opacity: 0; }
  to   { transform: perspective(1200px) rotateY(0deg); opacity: 1; }
}

.flip-exit {
  animation: flip-out 0.3s ease-in forwards;
}

.flip-enter {
  animation: flip-in 0.3s ease-out forwards;
}
```

### 2-6. PixiJS パーティクルオーバーレイ（stage >= 4 専用）

**新規ファイル: `src/components/plant/plant-particles.tsx`**

このコンポーネントは `active: boolean` と `color: string` を受け取り、  
stage 4-5 の時のみ花びらが舞うパーティクルエフェクトを Canvas に描画する。

```typescript
"use client";

import { useEffect, useRef } from "react";

interface Props {
  color: string;
  active: boolean;
}

export function PlantParticles({ color, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 400;

    interface Petal {
      x: number; y: number; r: number;
      vx: number; vy: number; rot: number; vr: number;
      alpha: number;
    }
    const petals: Petal[] = [];

    function spawn() {
      petals.push({
        x: 80 + Math.random() * 140,
        y: 40 + Math.random() * 60,
        r: 3 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0.5 + Math.random() * 1,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.1,
        alpha: 0.9,
      });
    }

    let frame = 0;
    function tick() {
      frame++;
      if (frame % 12 === 0 && petals.length < 15) spawn();

      ctx!.clearRect(0, 0, 300, 400);
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.alpha -= 0.005;

        if (p.alpha <= 0 || p.y > 400) {
          petals.splice(i, 1);
          continue;
        }

        ctx!.save();
        ctx!.globalAlpha = p.alpha;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.fillStyle = color;
        ctx!.beginPath();
        ctx!.ellipse(0, 0, p.r, p.r * 1.5, 0, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [color, active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      width={300}
      height={400}
    />
  );
}
```

> **設計変更**: PixiJS ライブラリの追加を回避し、Canvas 2D API で直接実装する。  
> これにより `pnpm add pixi.js @pixi/react` が不要になり、バンドルサイズ増加を防ぐ。  
> OPPO Reno 3A のパフォーマンスにも優しい。  
> **`pixi.js` と `@pixi/react` は `pnpm add` しないこと。**

### 2-7. 植物画面コンポーネント

**新規ファイル: `src/components/plant/plant-screen.tsx`**

```typescript
"use client";

import { usePlant } from "@/hooks/use-plant";
import { PlantRenderer } from "./plant-renderer";
import { PlantParticles } from "./plant-particles";
import { getStageLabel, calcProgress } from "@/lib/domain/plant";

export default function PlantScreen() {
  const { species, stage, state } = usePlant();
  const isBlooming = stage >= 4;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-4rem)] px-4">
      {/* 植物情報 */}
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-foreground">{species.name}</p>
        <p className="text-sm text-muted-foreground">
          {getStageLabel(stage)} · 今週 {state?.weeklyCompleted ?? 0}件完了
        </p>
      </div>

      {/* 植物キャンバス */}
      <div className="relative w-[300px] h-[400px]">
        <PlantRenderer species={species} stage={stage} />
        <PlantParticles color={species.color} active={isBlooming} />
      </div>

      {/* 次のステージまでのプログレス */}
      {stage < 5 && (
        <div className="mt-6 w-64">
          <p className="text-xs text-center text-muted-foreground mb-1">
            次のステージまで
          </p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${calcProgress(state?.weeklyCompleted ?? 0, stage)}%` }}
            />
          </div>
        </div>
      )}
      {stage === 5 && (
        <p className="mt-6 text-sm font-semibold text-green-600">
          満開です！タスクを完了し続けて維持しましょう
        </p>
      )}
    </div>
  );
}
```

### 2-8. 植物ページ

**新規ファイル: `src/app/plant/page.tsx`**

```typescript
"use client";

import dynamic from "next/dynamic";

const PlantScreen = dynamic(() => import("@/components/plant/plant-screen"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-dvh">
      <p className="text-sm text-muted-foreground">読み込み中…</p>
    </div>
  ),
});

export default function PlantPage() {
  return <PlantScreen />;
}
```

> **CLAUDE.md ルール準拠**: `"use client"` + `dynamic(() => import(...), { ssr: false, loading })` パターン。  
> IndexedDB を使うため SSR を無効化。`loading` を省略しない。

---

## Phase 3: Gmail タスク自動生成

### 3-1. Gmail API クライアント

**新規ファイル: `src/lib/api/gmail.ts`**

```typescript
import { getToken } from "./google-auth";

export interface GmailMessage {
  id: string;
  subject: string;
  snippet: string;
  date: string;
  from: string;
}

const BASE = "https://gmail.googleapis.com/gmail/v1";

async function authFetch(path: string): Promise<unknown> {
  const token = getToken("gmail");
  if (!token) throw new Error("Gmail not authenticated");
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  return res.json();
}

/** 過去7日間のメールを最大20件取得 */
export async function fetchRecentMessages(): Promise<GmailMessage[]> {
  const query = encodeURIComponent("newer_than:7d");
  const list = (await authFetch(`/users/me/messages?q=${query}&maxResults=20`)) as {
    messages?: { id: string }[];
  };
  if (!list.messages?.length) return [];

  const results = await Promise.all(
    list.messages.map(async (m) => {
      const msg = (await authFetch(
        `/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=From`
      )) as {
        payload?: { headers?: { name: string; value: string }[] };
        snippet?: string;
      };
      const headers = msg.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
      return {
        id: m.id,
        subject: get("Subject"),
        snippet: msg.snippet ?? "",
        date: get("Date"),
        from: get("From"),
      };
    })
  );
  return results;
}
```

### 3-2. Gemini でメールからタスク候補を抽出

**新規ファイル: `src/lib/api/gmail-task-extractor.ts`**

```typescript
import type { GmailMessage } from "./gmail";
import type { Category, Recurrence } from "@/lib/db";

export interface TaskCandidate {
  messageId: string;
  subject: string;
  from: string;
  task: {
    title: string;
    dueDate: string | null;
    dueTime: string | null;
    category: Category;
    recurrence: Recurrence;
  };
  selected: boolean; // UI用の選択状態
}

/** 既存の Gemini API キーを使用してメールからタスクを抽出 */
export async function extractTasksFromEmails(
  messages: GmailMessage[]
): Promise<TaskCandidate[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not set");

  const prompt = `
以下のメール一覧を見て、タスクが含まれているものだけを抽出してください。
タスクとは「期限がある行動」「提出・返信・予約・申し込みなどの具体的なアクション」を指します。
ニュースレター・広告・通知メールはタスクではありません。

メール一覧:
${messages.map((m, i) => `[${i}] 件名: ${m.subject} / 差出人: ${m.from} / 要約: ${m.snippet}`).join("\n")}

以下のJSON配列で返してください。タスクがないメールは含めないでください:
[
  {
    "index": 0,
    "title": "タスク名（簡潔に）",
    "dueDate": "YYYY-MM-DD または null",
    "dueTime": "HH:MM または null",
    "category": "job" | "university" | "life"
  }
]
タスクが1件もなければ空配列 [] を返してください。
`.trim();

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!res.ok) return [];
    const json = await res.json();
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    const parsed: { index: number; title: string; dueDate: string | null; dueTime: string | null; category: Category }[] = JSON.parse(text);

    return parsed.map((p) => ({
      messageId: messages[p.index]?.id ?? "",
      subject: messages[p.index]?.subject ?? "",
      from: messages[p.index]?.from ?? "",
      task: {
        title: p.title,
        dueDate: p.dueDate,
        dueTime: p.dueTime,
        category: p.category,
        recurrence: "none" as Recurrence,
      },
      selected: true,
    }));
  } catch (err) {
    console.error("[gmail-extractor] Gemini parse failed:", err);
    return [];
  }
}
```

### 3-3. Gmail インポートモーダル

**新規ファイル: `src/components/gmail/gmail-import-modal.tsx`**

UI フロー:
1. **認証ステップ**: 「Gmailと接続」ボタン → `useGoogleAuth("gmail").connect()`
2. **読み込みステップ**: スピナー表示 → `fetchRecentMessages()` → `extractTasksFromEmails()`
3. **確認ステップ**: 抽出されたタスク候補リスト。各行にチェックボックス + タスク名 + 期限 + メール件名。「選択したタスクを追加」ボタン
4. **完了ステップ**: 「N件のタスクを追加しました」表示 → 閉じる

Props: `open: boolean`, `onClose: () => void`, `onTasksCreated: () => void`

UIスタイル: 既存の `task-add-modal.tsx` と同じ全画面モーダル（`fixed inset-0`）。  
shadcn/ui の Dialog を使ってもよい。

### 3-4. ホーム画面にインポートボタン追加

**ファイル: `src/components/home/home-screen.tsx`**

`<header>` 内の右端に `Mail` アイコンボタンを追加:

```tsx
import { Mail } from "lucide-react";
// + GmailImportModal の import

// header 内:
<header className="px-4 pt-8 pb-3 flex items-center justify-between">
  <div>
    <p className="text-xs text-muted-foreground">{dateLabel}</p>
    <h1 className="text-2xl font-bold tracking-tight text-foreground">今日のタスク</h1>
  </div>
  <button
    type="button"
    onClick={() => setShowGmailModal(true)}
    className="p-2 text-muted-foreground active:scale-95 transition-transform"
    aria-label="Gmailからインポート"
  >
    <Mail className="size-5" />
  </button>
</header>
```

state に `showGmailModal` を追加し、`GmailImportModal` をレンダリング。

---

## Phase 4: Google Calendar インポート

### 4-1. Calendar API クライアント

**新規ファイル: `src/lib/api/google-calendar.ts`**

```typescript
import { getToken } from "./google-auth";
import type { Category, Recurrence } from "@/lib/db";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

const BASE = "https://www.googleapis.com/calendar/v3";

async function authFetch(path: string): Promise<unknown> {
  const token = getToken("calendar");
  if (!token) throw new Error("Calendar not authenticated");
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
  return res.json();
}

/** 今日以降のイベントを最大30件取得 */
export async function fetchUpcomingEvents(): Promise<CalendarEvent[]> {
  const timeMin = encodeURIComponent(new Date().toISOString());
  const data = (await authFetch(
    `/calendars/primary/events?timeMin=${timeMin}&maxResults=30&singleEvents=true&orderBy=startTime`
  )) as { items?: CalendarEvent[] };
  return data.items ?? [];
}

/** CalendarEvent → Task 形式に変換 */
export function calendarEventToTaskData(event: CalendarEvent) {
  const dateStr = event.start.date ?? event.start.dateTime?.slice(0, 10) ?? "";
  const timeStr = event.start.dateTime ? event.start.dateTime.slice(11, 16) : null;
  return {
    title: event.summary ?? "(無題)",
    dueDate: dateStr,
    dueTime: timeStr,
    category: "life" as Category,
    recurrence: "none" as Recurrence,
  };
}
```

### 4-2. Calendar インポートモーダル

**新規ファイル: `src/components/calendar/calendar-import-modal.tsx`**

`gmail-import-modal.tsx` と同じ UI 構造（4ステップ）。

差異:
- `useGoogleAuth("calendar")` を使用
- Gemini API は不要（カレンダーイベントはそのままタスクに変換）
- 各行: チェックボックス + イベント名 + 日時 + カテゴリ選択（デフォルト: "life"）

### 4-3. カレンダー画面にインポートボタン追加

**ファイル: `src/components/all/all-screen.tsx`**

`<header>` にカレンダーインポートボタン（`CalendarPlus` アイコン）を追加。  
Gmail と同じパターン。

---

## Phase 5: UI/UX 刷新

### 5-1. 下部ナビゲーション共通化 + 植物タブ追加

**現在の問題**: `BottomNav` が `home-screen.tsx` と `all-screen.tsx` に**重複定義**されている。

**解決策**: 共通の `BottomNav` コンポーネントを `src/components/layout/bottom-nav.tsx` に抽出する。  
ただし、ファイル新規作成を最小化するため、既存の2箇所を直接編集してもよい。

3タブ構成:

```tsx
import { Home, Calendar, Leaf } from "lucide-react";

// 3つのタブ:
const tabs = [
  { href: "/",     label: "ホーム",     icon: Home },
  { href: "/all",  label: "カレンダー", icon: Calendar },
  { href: "/plant", label: "植物",      icon: Leaf },
];
```

現在のページに `text-orange-500`（アクティブ色）、それ以外に `text-muted-foreground` を適用。

**変更ファイル**: `src/components/home/home-screen.tsx` と `src/components/all/all-screen.tsx` の `BottomNav` 関数。

### 5-2. タスク管理 ↔ 植物画面のカードフリップ遷移

フリップアニメーションは CSS で実装済み（Phase 2-5 の globals.css）。

適用方法:  
`BottomNav` の植物タブをタップした時に、`flip-exit` → ページ遷移 → `flip-enter` を適用する。

シンプルな実装:
- `usePathname()` で現在パスを監視
- ページコンテンツの `<main>` ラッパーに `flip-enter` クラスを付与（初回レンダリング時）
- Next.js の App Router ではページ遷移時にコンポーネントが再マウントされるため、`flip-enter` を `useEffect` で一定時間後に除去

各ページの `<main>` またはルートの `<div>` に:

```tsx
const [flipped, setFlipped] = useState(true);
useEffect(() => {
  const timer = setTimeout(() => setFlipped(false), 300);
  return () => clearTimeout(timer);
}, []);

return (
  <div className={flipped ? "flip-enter" : ""}>
    {/* ... */}
  </div>
);
```

> **注意**: これは植物画面との遷移のみ。ホーム↔カレンダー間はフリップ不要。  
> 実装が複雑になりすぎる場合は、植物ページのみに `flip-enter` を付けるだけでもよい。

### 5-3. タスクカード展開/折りたたみ

**ファイル: `src/components/home/task-card.tsx`**

既存のカード構造に以下を追加:

1. カード右端に `ChevronDown` ボタン（`lucide-react`）
2. タップで `expanded` state をトグル
3. 展開時にカテゴリ・時刻・繰り返し詳細 + 編集/削除クイックアクションを表示

```tsx
import { ChevronDown } from "lucide-react";

// 既存の TaskCard 内に追加:
const [expanded, setExpanded] = useState(false);

// カード内、カテゴリバッジの右に展開ボタンを追加:
<button
  type="button"
  onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
  className="p-1 text-muted-foreground"
  aria-label={expanded ? "折りたたむ" : "展開する"}
>
  <ChevronDown
    className={`size-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
  />
</button>

// カード本体の下（閉じタグの直前）に展開コンテンツ:
{expanded && (
  <div className="mt-2 pl-9 pr-4 pb-1 text-xs text-muted-foreground space-y-1 border-t border-border/50 pt-2">
    <p>カテゴリ: {config.label}</p>
    {task.dueTime && <p>期限時刻: {task.dueTime}</p>}
    {task.recurrence !== "none" && <p>繰り返し: {task.recurrence}</p>}
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={() => onTap(task)} className="text-orange-500 underline">
        編集
      </button>
    </div>
  </div>
)}
```

> **注意**: 既存の「カード本体タップ → 編集モーダル」は維持する。  
> 展開ボタンのクリックは `e.stopPropagation()` でモーダル起動を防ぐ。

### 5-4. リストビュー「今日以降」フィルタ

**ファイル: `src/components/all/list-view.tsx`**

カテゴリフィルタの横に「今日以降」トグルを追加:

```tsx
// Props に追加:
showFutureOnly: boolean;
onShowFutureOnlyChange: (v: boolean) => void;

// カテゴリフィルタの下に追加:
<label className="flex items-center gap-2 px-4 pb-3 text-sm text-muted-foreground">
  <input
    type="checkbox"
    checked={showFutureOnly}
    onChange={(e) => onShowFutureOnlyChange(e.target.checked)}
    className="rounded border-border"
  />
  今日以降のみ表示
</label>
```

**ファイル: `src/components/all/all-screen.tsx`**

`AllScreen` に `showFutureOnly` state を追加（デフォルト `true`）。  
`filteredTasks` のフィルタリングに条件を追加:

```typescript
const [showFutureOnly, setShowFutureOnly] = useState(true);

const filteredTasks = sortTasksByDateTime(
  allTasks
    .filter((task) => categoryFilter === "all" || task.category === categoryFilter)
    .filter((task) => !showFutureOnly || task.dueDate >= today)
    .map((task) => taskForDisplayDate(task, today))
);
```

`ListView` に `showFutureOnly` と `onShowFutureOnlyChange` を渡す。

---

## Phase 6: アプリアイコン刷新

### 6-1. SVG アイコン作成

**新規ファイル: `public/icon.svg`**

デザイン仕様:
- 512x512 viewBox
- 背景: 深緑グラデーション（`#1a5c2a` → `#2d8a45`）、角丸 100px
- 中央: 白い植物スプラウト（茎 + 左右の葉 + 先端の芽）
- 右上: 小さなチェックマーク（白、opacity 0.8）
- 下部: 白い土台の楕円（opacity 0.3）

以下の SVG を `public/icon.svg` として保存:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a5c2a"/>
      <stop offset="100%" style="stop-color:#2d8a45"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <path d="M256 420 C256 420 256 300 256 260" stroke="white" stroke-width="18" stroke-linecap="round" fill="none"/>
  <path d="M256 320 C220 300 190 270 200 240 C230 260 256 280 256 320Z" fill="white" opacity="0.9"/>
  <path d="M256 300 C292 280 322 250 312 220 C282 240 256 260 256 300Z" fill="white"/>
  <circle cx="256" cy="235" r="22" fill="white"/>
  <path d="M370 100 L390 125 L430 85" stroke="white" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.8"/>
  <ellipse cx="256" cy="430" rx="60" ry="16" fill="white" opacity="0.3"/>
</svg>
```

### 6-2. PNG アイコン生成

SVG → PNG 変換は手動（以下のいずれか）:
1. ブラウザで SVG を開き、スクリーンショットをリサイズ
2. オンラインツール（svgtopng.com 等）で 192x192 と 512x512 を生成
3. Playwright MCP で自動変換

生成した PNG を以下に配置（既存ファイルを上書き）:
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-maskable-192.png`（同じ画像 + パディング）
- `public/icons/icon-maskable-512.png`（同じ画像 + パディング）

### 6-3. manifest.ts にSVGアイコンを追加

既存のアイコン配列に追加:

```typescript
{
  src: "/icon.svg",
  sizes: "any",
  type: "image/svg+xml",
},
```

---

## Phase 7: 最終検証

### 7-1. ビルドチェック

```bash
npx tsc --noEmit
pnpm lint
pnpm build
```

3つとも **エラー 0** であること。

### 7-2. Playwright MCP 動作検証

`pnpm dev` を起動し、以下をブラウザで確認:

| # | 確認項目 | パス | 期待結果 |
|---|---|---|---|
| 1 | ホーム画面表示 | `/` | 今日のタスクが表示される |
| 2 | 植物タブ表示 | ナビバー | 3つ目のタブ「植物」がある |
| 3 | 植物画面表示 | `/plant` | 今月の植物名が表示され、SVG植物が描画される |
| 4 | カードフリップ | 植物タブタップ | フリップアニメーションで画面が切り替わる |
| 5 | タスクカード展開 | `/` のカードの矢印 | 展開ボタンで詳細情報が開く |
| 6 | リストフィルタ | `/all` → リスト表示 | 「今日以降のみ」チェックボックスが動作する |
| 7 | Gmail ボタン | `/` ヘッダー右 | メールアイコンが表示される |
| 8 | Calendar ボタン | `/all` ヘッダー | カレンダーインポートアイコンが表示される |

### 7-3. ユーザー目視確認依頼

実装者は以下をユーザーに依頼すること:

> ブラウザで http://localhost:3000 を開き、以下を確認してください:
> 1. 下部ナビに「ホーム / カレンダー / 植物」の3タブが表示されている
> 2. 「植物」タブをタップすると植物画面に切り替わる
> 3. 植物画面に今月の花の名前と SVG 植物が表示されている
> 4. ホームに戻り、タスクカードの右端の矢印をタップすると詳細が展開される
> 5. Gmail アイコン（ヘッダー右）をタップするとインポート画面が開く

---

## 新規ファイル一覧（CodeX が作成するもの）

```
src/
  app/
    plant/page.tsx
  components/
    plant/
      plant-screen.tsx
      plant-renderer.tsx
      plant-particles.tsx
      upright-flower.tsx
      cherry-blossom.tsx
      hanging-cluster.tsx
      delicate-flower.tsx
    gmail/
      gmail-import-modal.tsx
    calendar/
      calendar-import-modal.tsx
  lib/
    api/
      gmail.ts
      gmail-task-extractor.ts
      google-calendar.ts
  hooks/
    use-plant.ts
public/
  icon.svg
```

## 変更ファイル一覧（CodeX が編集するもの）

```
src/app/layout.tsx              — GIS script 追加
src/app/globals.css             — アニメーション CSS 追加
src/lib/db.ts                   — PlantState 型 + version(2) 追加
src/hooks/use-home-screen.ts    — usePlant 連動追加
src/components/home/home-screen.tsx  — Gmail ボタン + BottomNav 3タブ化
src/components/home/task-card.tsx    — 展開/折りたたみ追加
src/components/all/all-screen.tsx    — Calendar ボタン + BottomNav 3タブ化 + showFutureOnly
src/components/all/list-view.tsx     — 「今日以降」フィルタ追加
src/app/manifest.ts                  — SVG アイコン追加
```

## 計画係が作成済み（CodeX は編集しないこと）

```
src/lib/api/google-auth.ts      — 作成済み
src/hooks/use-google-auth.ts    — 作成済み
src/lib/domain/plant.ts         — 作成済み
package.json                    — 名前変更済み
```

---

## 依存パッケージ

**追加不要**。PixiJS は不採用（Canvas 2D API で代替）。  
GIS スクリプトは CDN から `<Script>` タグで読み込む。  
既存の依存のみで全機能を実装する。

---

## 制約リマインダー

- 1ファイル300行、1関数50行を目安（AGENTS.md）
- `"use client"` はブラウザAPI / state が必要な場合のみ（CLAUDE.md）
- `dynamic(() => import(...), { ssr: false, loading })` で IndexedDB 使用コンポーネントをラップ（CLAUDE.md）
- Dexie の `new Dexie()` はモジュールトップレベルではなく遅延初期化（既存パターンに従う）
- `<html>` タグに `suppressHydrationWarning` 必須（既存で対応済み）
- Tailwind のスタイルは `globals.css` の `@theme` で定義。`tailwind.config.ts` は作らない
- `.env` / `.env.local` をコミットしない
- force push / reset --hard 禁止
