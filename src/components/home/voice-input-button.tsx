"use client";

import { useCallback, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { createTask } from "@/lib/taskDb";
import { parseTaskFromText } from "@/lib/gemini";
import { RateLimitError, redactSecret } from "@/lib/errors";
import { todayDateString } from "@/lib/domain/task-date";

interface VoiceInputButtonProps {
  onTaskCreated: () => void;
  onFallbackToManual: (prefill?: string) => void;
}

type VoiceStatus = "idle" | "listening" | "processing" | "error" | "success";

export function VoiceInputButton({
  onTaskCreated,
  onFallbackToManual,
}: VoiceInputButtonProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    // Cross-browser SpeechRecognition (webkit prefix for Chrome/Android)
    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setErrorMsg("このブラウザは音声入力に対応していません");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript?.trim() ?? "";
      if (!transcript) {
        setErrorMsg("音声がうまく取得できませんでした。もう一度お試しください");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2500);
        return;
      }
      setStatus("processing");

      parseTaskFromText(transcript, todayDateString())
        .then(async (parsed) => {
          await createTask({
            title: parsed.title,
            dueDate: parsed.dueDate,
            dueTime: parsed.dueTime,
            category: parsed.category,
            completed: false,
            completedAt: null,
            recurrence: "none",
          });
          onTaskCreated();
          const isToday = parsed.dueDate === todayDateString();
          const dateObj = new Date(parsed.dueDate + "T00:00:00");
          const dateLabel = isToday
            ? "今日"
            : dateObj.toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
          setSuccessMsg(`「${parsed.title}」を${dateLabel}に追加しました`);
          setStatus("success");
          setTimeout(() => setStatus("idle"), 3000);
        })
        .catch((err: unknown) => {
          console.error("[VoiceInput] error:", redactSecret(err));
          if (err instanceof RateLimitError) {
            setErrorMsg("AI解析が一時的に利用できません。手動で入力してください");
            setStatus("error");
            setTimeout(() => {
              setStatus("idle");
              onFallbackToManual(transcript);
            }, 2000);
          } else {
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMsg(`エラー: ${msg}`);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 5000);
          }
        });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        setStatus("idle");
        return;
      }
      if (event.error === "aborted") {
        setStatus("idle");
        return;
      }
      setErrorMsg("音声の認識に失敗しました");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    };

    recognition.onend = () => {
      // If still "listening" (no result arrived), go back to idle
      setStatus((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognition.start();
  }, [onTaskCreated, onFallbackToManual]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const handleClick = () => {
    if (status === "listening") {
      stopListening();
    } else if (status === "idle") {
      startListening();
    }
  };

  const buttonColor =
    status === "listening"
      ? "bg-red-500"
      : status === "processing"
        ? "bg-gray-400"
        : status === "error"
          ? "bg-gray-400"
          : status === "success"
            ? "bg-green-500"
            : "bg-orange-400";

  const isDisabled = status === "processing" || status === "error" || status === "success";

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Status popup */}
      {(status === "listening" || status === "processing" || status === "error" || status === "success") && (
        <div
          className={`max-w-xs rounded-xl border px-3 py-2 text-xs font-medium ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-600"
              : status === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : status === "listening"
                  ? "border-orange-200 bg-orange-50 text-orange-600"
                  : "border-gray-200 bg-gray-50 text-gray-600"
          }`}
        >
          {status === "listening" && "聞いています..."}
          {status === "processing" && "AI解析中..."}
          {status === "error" && errorMsg}
          {status === "success" && successMsg}
        </div>
      )}

      <button
        type="button"
        aria-label="音声入力"
        onClick={handleClick}
        disabled={isDisabled}
        className={`flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed ${buttonColor} ${status === "listening" ? "animate-pulse" : ""}`}
      >
        {status === "processing" ? (
          <Loader2 className="size-6 animate-spin" />
        ) : status === "listening" ? (
          <MicOff className="size-6" />
        ) : status === "success" ? (
          <span className="text-lg">✓</span>
        ) : (
          <Mic className="size-6" />
        )}
      </button>
    </div>
  );
}
