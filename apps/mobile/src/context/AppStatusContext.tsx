import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type AppNoticeTone = 'warning' | 'danger' | 'info';

interface AppNotice {
  title: string;
  message: string;
  tone: AppNoticeTone;
}

interface AppStatusContextType {
  notice: AppNotice | null;
  setNotice: (notice: AppNotice | null) => void;
  clearNotice: () => void;
}

const AppStatusContext = createContext<AppStatusContextType>({
  notice: null,
  setNotice: () => {},
  clearNotice: () => {},
});

export function AppStatusProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNoticeState] = useState<AppNotice | null>(null);

  const setNotice = useCallback((nextNotice: AppNotice | null) => {
    setNoticeState(nextNotice);
  }, []);

  const clearNotice = useCallback(() => {
    setNoticeState(null);
  }, []);

  const value = useMemo(() => ({ notice, setNotice, clearNotice }), [notice, setNotice, clearNotice]);

  return <AppStatusContext.Provider value={value}>{children}</AppStatusContext.Provider>;
}

export function useAppStatus() {
  return useContext(AppStatusContext);
}
