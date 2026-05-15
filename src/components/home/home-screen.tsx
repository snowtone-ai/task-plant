"use client";

import { Mail, Plus } from "lucide-react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { useHomeScreen } from "@/hooks/use-home-screen";
import { todayDateString } from "@/lib/domain/task-date";
import { GmailImportModal } from "@/components/gmail/gmail-import-modal";
import { TaskCard } from "./task-card";
import { TaskAddModal } from "./task-add-modal";
import { TaskEditModal } from "./task-edit-modal";
import { VoiceInputButton } from "./voice-input-button";

export function HomeScreen() {
  const screen = useHomeScreen();
  const completedCount = screen.tasks.filter((task) => task.completed).length;
  const totalCount = screen.tasks.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const dateLabel = new Date(`${todayDateString()}T00:00:00`).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-4 pt-8 pb-3">
        <div>
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">今日のタスク</h1>
        </div>
        <button
          type="button"
          onClick={() => screen.setShowGmailModal(true)}
          className="p-2 text-muted-foreground transition-transform active:scale-95"
          aria-label="Gmailからインポート"
        >
          <Mail className="size-5" />
        </button>
      </header>

      {screen.streakCount > 0 && (
        <div className="px-4 pb-1">
          <p className="text-sm font-semibold text-orange-500">
            🔥 {screen.streakCount}日連続全完了！
          </p>
        </div>
      )}

      <NotificationPanel
        permission={screen.notifPermission}
        dismissed={screen.notifBannerDismissed}
        hasTasks={screen.tasks.length > 0}
        testSent={screen.testNotifSent}
        onRequest={screen.handleRequestNotification}
        onDismiss={screen.handleDismissNotifBanner}
        onTest={screen.handleTestNotification}
      />
      <ProgressPanel
        completedCount={completedCount}
        totalCount={totalCount}
        progressPct={progressPct}
      />

      {screen.allCompleteMessage && (
        <div className="mx-4 mb-2 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 text-center animate-bounce">
          <p className="text-sm font-bold text-orange-600">🎉 全タスク完了！すごい！</p>
        </div>
      )}

      <main className="flex-1 px-4 pt-2" style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}>
        {screen.loading ? (
          <LoadingState />
        ) : screen.tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {screen.tasks.map((task) => (
              <li key={task.id}>
                <TaskCard task={task} onToggle={screen.handleToggle} onTap={screen.setEditingTask} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav currentPath="/" />
      <FloatingActions
        onVoiceTaskCreated={screen.onTasksChanged}
        onFallbackToManual={screen.openAddModal}
        onAdd={() => screen.openAddModal()}
      />

      {screen.showAddModal && (
        <TaskAddModal
          onClose={() => screen.setShowAddModal(false)}
          onTaskCreated={screen.onTasksChanged}
          initialTitle={screen.addModalInitialTitle}
        />
      )}
      <GmailImportModal
        open={screen.showGmailModal}
        onClose={() => screen.setShowGmailModal(false)}
        onTasksCreated={screen.onTasksChanged}
      />
      {screen.editingTask && (
        <TaskEditModal
          task={screen.editingTask}
          onClose={() => screen.setEditingTask(null)}
          onSaved={screen.onTasksChanged}
          onDeleted={screen.onTasksChanged}
        />
      )}
    </div>
  );
}

function NotificationPanel({
  permission,
  dismissed,
  hasTasks,
  testSent,
  onRequest,
  onDismiss,
  onTest,
}: {
  permission: string;
  dismissed: boolean;
  hasTasks: boolean;
  testSent: boolean;
  onRequest: () => void;
  onDismiss: () => void;
  onTest: () => void;
}) {
  if (!dismissed && permission === "default" && hasTasks) {
    return (
      <div className="mx-4 mb-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-700">🔔 締切通知を有効にしますか？</p>
            <p className="mt-0.5 text-xs text-orange-600">締切前日・当日の朝9時にリマインドします</p>
          </div>
          <button type="button" aria-label="通知バナーを閉じる" onClick={onDismiss} className="text-orange-400 hover:text-orange-600 text-lg leading-none">×</button>
        </div>
        <button type="button" onClick={onRequest} className="mt-2 w-full rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white active:scale-95 transition-transform">
          通知を許可する
        </button>
      </div>
    );
  }
  if (permission !== "granted" || dismissed) return null;

  return (
    <div className="mx-4 mb-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-green-700">🔔 通知が有効です</p>
        <button type="button" onClick={onDismiss} className="text-green-400 hover:text-green-600 text-lg leading-none">×</button>
      </div>
      <button type="button" onClick={onTest} className="mt-2 w-full rounded-lg border border-green-300 bg-white py-2 text-sm font-semibold text-green-700 active:scale-95 transition-transform">
        {testSent ? "✓ 送信しました！" : "テスト通知を送る"}
      </button>
    </div>
  );
}

function ProgressPanel({
  completedCount,
  totalCount,
  progressPct,
}: {
  completedCount: number;
  totalCount: number;
  progressPct: number;
}) {
  return (
    <div className="px-4 pb-2">
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{totalCount > 0 ? `${completedCount}/${totalCount} 完了` : "タスクなし"}</span>
        {totalCount > 0 && completedCount === totalCount && <span className="font-semibold text-orange-500">全完了！</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-orange-500 transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-sm text-muted-foreground">読み込み中...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 text-6xl select-none">🎉</div>
      <p className="text-base font-semibold text-foreground">今日のタスクはありません</p>
      <p className="mt-1 text-sm text-muted-foreground">右下の「+」ボタンからタスクを追加しましょう</p>
    </div>
  );
}

function FloatingActions({
  onVoiceTaskCreated,
  onFallbackToManual,
  onAdd,
}: {
  onVoiceTaskCreated: () => void;
  onFallbackToManual: (prefill?: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="fixed right-4 flex flex-col items-end gap-3" style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
      <VoiceInputButton onTaskCreated={onVoiceTaskCreated} onFallbackToManual={onFallbackToManual} />
      <button type="button" aria-label="タスクを追加" onClick={onAdd} className="flex size-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg active:scale-95 transition-transform">
        <Plus className="size-6" />
      </button>
    </div>
  );
}
