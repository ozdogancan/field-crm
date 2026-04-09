import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ToastTone = 'success' | 'warning' | 'danger' | 'info';

interface ToastState {
  visible: boolean;
  title?: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextType {
  toast: ToastState | null;
  showToast: (message: string, options?: { title?: string; tone?: ToastTone; durationMs?: number }) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: null,
  showToast: () => {},
  hideToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast((current) => (current ? { ...current, visible: false } : null));
    setTimeout(() => setToast(null), 180);
  }, []);

  const showToast = useCallback(
    (
      message: string,
      options?: { title?: string; tone?: ToastTone; durationMs?: number },
    ) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({
        visible: true,
        title: options?.title,
        message,
        tone: options?.tone || 'info',
      });

      timeoutRef.current = setTimeout(() => {
        setToast((current) => (current ? { ...current, visible: false } : null));
        setTimeout(() => setToast(null), 180);
      }, options?.durationMs || 2600);
    },
    [],
  );

  const value = useMemo(() => ({ toast, showToast, hideToast }), [toast, showToast, hideToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  return useContext(ToastContext);
}
