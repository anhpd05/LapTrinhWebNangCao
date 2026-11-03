'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { Toast } from '@/components/ui/toast';

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast | null>(null);

/**
 * Giữ toast ở trên bảng và form. Dòng bị xoá sẽ biến mất khỏi bảng ngay khi trang làm mới,
 * nên toast không thể sống trong DeleteButton (nó bị unmount cùng dòng).
 */
export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const close = useCallback(() => setMessage(null), []);

  return (
    <ToastContext.Provider value={setMessage}>
      {children}
      <Toast message={message} onClose={close} />
    </ToastContext.Provider>
  );
}

export function useAdminToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useAdminToast phải được dùng bên trong AdminToastProvider');
  return show;
}
