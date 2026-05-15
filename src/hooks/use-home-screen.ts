"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { type Task } from "@/lib/db";
import {
  getTasksForDate,
  getCurrentStreakCount,
  recordStreak,
  syncPlantStateFromTasks,
  toggleTaskComplete,
} from "@/lib/taskDb";
import {
  getNotificationPermission,
  requestNotificationPermission,
  scheduleTaskNotifications,
  sendTestNotification,
  type NotificationPermissionState,
} from "@/lib/notifications";
import { todayDateString } from "@/lib/domain/task-date";
import { usePlant } from "./use-plant";

export function useHomeScreen() {
  const plant = usePlant();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalInitialTitle, setAddModalInitialTitle] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [allCompleteMessage, setAllCompleteMessage] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermissionState>("unsupported");
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false);
  const [testNotifSent, setTestNotifSent] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const today = todayDateString();

  async function loadTasks() {
    const loaded = await getTasksForDate(today);
    setTasks(loaded);
    return loaded;
  }

  async function refreshStreak() {
    setStreakCount(await getCurrentStreakCount());
  }

  useEffect(() => {
    initializeNotificationState(setNotifPermission, setNotifBannerDismissed);
    const fallback = setTimeout(() => setLoading(false), 1500);

    Promise.all([loadTasks(), refreshStreak()])
      .catch((err) => console.error("[home] initial load failed:", err))
      .finally(() => {
        clearTimeout(fallback);
        setLoading(false);
      });

    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  useEffect(() => {
    if (notifPermission === "granted") {
      scheduleTaskNotifications().catch(console.error);
    }
  }, [notifPermission]);

  async function handleRequestNotification() {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    if (result === "granted") await scheduleTaskNotifications();
  }

  function handleDismissNotifBanner() {
    localStorage.setItem("notif-banner-dismissed", "1");
    setNotifBannerDismissed(true);
  }

  async function handleTestNotification() {
    await sendTestNotification();
    setTestNotifSent(true);
    setTimeout(() => setTestNotifSent(false), 3000);
  }

  async function handleToggle(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    await toggleTaskComplete(taskId);
    const newTasks = await loadTasks();
    await updateCompletionEffects({
      isCompleting: !task.completed,
      allDone: newTasks.length > 0 && newTasks.every((item) => item.completed),
      today,
      refreshStreak,
      setAllCompleteMessage,
    });
    if (!task.completed) {
      await plant.incrementCompleted();
    } else {
      await plant.decrementCompleted();
    }
    await syncPlantStateFromTasks();
    scheduleTaskNotifications().catch(console.error);
  }

  function openAddModal(initialTitle = "") {
    setAddModalInitialTitle(initialTitle);
    setShowAddModal(true);
  }

  function onTasksChanged() {
    Promise.all([loadTasks(), syncPlantStateFromTasks()]).catch(console.error);
    scheduleTaskNotifications().catch(console.error);
  }

  return {
    tasks,
    loading,
    showAddModal,
    addModalInitialTitle,
    editingTask,
    allCompleteMessage,
    streakCount,
    notifPermission,
    notifBannerDismissed,
    testNotifSent,
    showGmailModal,
    setShowAddModal,
    setShowGmailModal,
    setEditingTask,
    handleRequestNotification,
    handleDismissNotifBanner,
    handleTestNotification,
    handleToggle,
    openAddModal,
    onTasksChanged,
  };
}

function initializeNotificationState(
  setPermission: (state: NotificationPermissionState) => void,
  setDismissed: (dismissed: boolean) => void
) {
  try {
    setPermission(getNotificationPermission());
  } catch (err) {
    console.error("[home] notif permission check failed:", err);
  }
  try {
    setDismissed(localStorage.getItem("notif-banner-dismissed") === "1");
  } catch (err) {
    console.error("[home] localStorage read failed:", err);
  }
}

async function updateCompletionEffects({
  isCompleting,
  allDone,
  today,
  refreshStreak,
  setAllCompleteMessage,
}: {
  isCompleting: boolean;
  allDone: boolean;
  today: string;
  refreshStreak: () => Promise<void>;
  setAllCompleteMessage: (visible: boolean) => void;
}) {
  if (isCompleting && allDone) {
    await recordStreak(today, true);
    await refreshStreak();
    fireAllCompleteConfetti();
    setAllCompleteMessage(true);
    setTimeout(() => setAllCompleteMessage(false), 3000);
    return;
  }
  if (isCompleting) {
    fireNormalConfetti();
    return;
  }
  if (!allDone) {
    await recordStreak(today, false);
    await refreshStreak();
  }
}

function fireNormalConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.6 },
    colors: ["#f97316", "#fb923c", "#fbbf24", "#a3e635", "#34d399"],
  });
}

function fireAllCompleteConfetti() {
  confetti({
    particleCount: 120,
    angle: 60,
    spread: 70,
    origin: { x: 0, y: 0.6 },
    colors: ["#f97316", "#fb923c", "#fbbf24", "#a3e635", "#34d399", "#60a5fa"],
  });
  confetti({
    particleCount: 120,
    angle: 120,
    spread: 70,
    origin: { x: 1, y: 0.6 },
    colors: ["#f97316", "#fb923c", "#fbbf24", "#a3e635", "#34d399", "#60a5fa"],
  });
  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ["#f97316", "#fbbf24", "#34d399", "#60a5fa", "#c084fc"],
    });
  }, 200);
}
