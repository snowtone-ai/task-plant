"use client";

import { useEffect, useState } from "react";
import { Calendar, CalendarPlus, List, Plus } from "lucide-react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { type Category, type Task } from "@/lib/db";
import { getAllTasks } from "@/lib/taskDb";
import {
  buildCategoryDotMap,
  doesTaskApplyToDate,
  sortTasksByDateTime,
  sortTasksByTime,
  taskForDisplayDate,
  todayDateString,
} from "@/lib/domain/task-date";
import { TaskEditModal } from "@/components/home/task-edit-modal";
import { TaskAddModal } from "@/components/home/task-add-modal";
import { CalendarImportModal } from "@/components/calendar/calendar-import-modal";
import { CalendarView } from "./calendar-view";
import { ListView } from "./list-view";
import { SelectedDateSheet } from "./selected-date-sheet";

export function AllScreen() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showFutureOnly, setShowFutureOnly] = useState(true);

  async function loadTasks() {
    const tasks = await getAllTasks();
    setAllTasks(tasks);
    return tasks;
  }

  useEffect(() => {
    const fallback = setTimeout(() => setLoading(false), 1500);

    // IndexedDB is an external client store; initial hydration sync belongs here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks()
      .catch((err) => console.error("[all] initial load failed:", err))
      .finally(() => {
        clearTimeout(fallback);
        setLoading(false);
      });

    return () => clearTimeout(fallback);
  }, []);

  const today = todayDateString();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const dotMap = buildCategoryDotMap(allTasks, year, month);
  const selectedDateTasks = selectedDate
    ? sortTasksByTime(
        allTasks
          .filter((task) => doesTaskApplyToDate(task, selectedDate))
          .map((task) => taskForDisplayDate(task, selectedDate))
      )
    : [];
  const filteredTasks = sortTasksByDateTime(
    allTasks
      .filter((task) => categoryFilter === "all" || task.category === categoryFilter)
      .filter((task) => !showFutureOnly || task.dueDate >= today)
      .map((task) => taskForDisplayDate(task, today))
  );

  function prevMonth() {
    setCurrentMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1));
    setSelectedDate(null);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="px-4 pt-8 pb-3 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">全タスク</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCalendarModal(true)}
            className="p-2 text-muted-foreground transition-transform active:scale-95"
            aria-label="カレンダーからインポート"
          >
            <CalendarPlus className="size-5" />
          </button>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}>
        {loading ? (
          <LoadingState />
        ) : view === "calendar" ? (
          <CalendarView
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            today={today}
            dotMap={dotMap}
            onSelectDate={setSelectedDate}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
        ) : (
          <ListView
            tasks={filteredTasks}
            today={today}
            categoryFilter={categoryFilter}
            showFutureOnly={showFutureOnly}
            onCategoryFilterChange={setCategoryFilter}
            onShowFutureOnlyChange={setShowFutureOnly}
            onEditTask={setEditingTask}
          />
        )}
      </main>

      <BottomNav currentPath="/all" />
      <button
        type="button"
        aria-label="タスクを追加"
        onClick={() => setShowAddModal(true)}
        className="fixed right-4 flex size-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg active:scale-95 transition-transform"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <Plus className="size-6" />
      </button>

      {selectedDate && (
        <SelectedDateSheet
          selectedDate={selectedDate}
          tasks={selectedDateTasks}
          onClose={() => setSelectedDate(null)}
          onEditTask={setEditingTask}
        />
      )}
      {showAddModal && (
        <TaskAddModal
          onClose={() => setShowAddModal(false)}
          onTaskCreated={() => loadTasks().catch(console.error)}
        />
      )}
      <CalendarImportModal
        open={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onTasksCreated={() => loadTasks().catch(console.error)}
      />
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={() => loadTasks().catch(console.error)}
          onDeleted={() => {
            setEditingTask(null);
            loadTasks().catch(console.error);
          }}
        />
      )}
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: "calendar" | "list";
  onChange: (view: "calendar" | "list") => void;
}) {
  return (
    <div className="flex items-center rounded-xl bg-muted p-1 gap-1">
      <button type="button" onClick={() => onChange("calendar")} aria-pressed={view === "calendar"} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "calendar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
        <Calendar className="size-3.5" />
        カレンダー
      </button>
      <button type="button" onClick={() => onChange("list")} aria-pressed={view === "list"} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
        <List className="size-3.5" />
        リスト
      </button>
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
