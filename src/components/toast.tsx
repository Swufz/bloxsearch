"use client";

import { createContext, useContext, useMemo, useState } from "react";

type Toast = {
  id: number;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast(message) {
        const id = Date.now() + Math.random();
        setToasts((items) => [...items, { id, message }]);
        window.setTimeout(() => {
          setToasts((items) => items.filter((toast) => toast.id !== id));
        }, 3200);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[9999] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-xl border border-slate-700 bg-slate-950/95 px-4 py-3 text-sm text-slate-100 shadow-2xl shadow-black/40 backdrop-blur"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast(message: string) {
        window.alert(message);
      },
    };
  }
  return context;
}
