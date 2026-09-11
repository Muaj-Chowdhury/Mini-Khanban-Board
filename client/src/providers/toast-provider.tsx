"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastKind = "success" | "error";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

export function ToastProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(message: string, kind: ToastKind = "success") {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
  }

  function dismissToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[70] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <ToastMessage
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastMessage({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const dismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(dismiss, 3500);
    return () => window.clearTimeout(timeoutId);
  }, [dismiss]);

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-md border bg-white px-4 py-3 text-sm shadow-lg ${
        toast.kind === "error"
          ? "border-red-200 text-red-700"
          : "border-green-200 text-green-700"
      }`}
    >
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="text-gray-400 hover:text-gray-700"
      >
        x
      </button>
    </div>
  );
}
