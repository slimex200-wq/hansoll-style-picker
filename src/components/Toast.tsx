"use client";

import { useEffect, useState } from "react";

interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error";
}

let addToastFn: ((text: string, type: "success" | "error") => void) | null = null;

export function showToast(text: string, type: "success" | "error" = "success") {
  addToastFn?.(text, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (text, type) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
            t.type === "success"
              ? "bg-green-600 text-white"
              : "bg-[#DC3545] text-white"
          }`}
        >
          {t.type === "success" ? "\u2713 " : "\u2717 "}
          {t.text}
        </div>
      ))}
    </div>
  );
}
