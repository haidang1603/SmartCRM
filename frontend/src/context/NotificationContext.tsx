import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => addNotification('success', message), [addNotification]);
  const showError = useCallback((message: string) => addNotification('error', message), [addNotification]);
  const showInfo = useCallback((message: string) => addNotification('info', message), [addNotification]);

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {notifications.map((n) => (
          <div key={n.id} className={`toast toast-${n.type} animate-slide-in`}>
            <div className="toast-icon">
              {n.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
              {n.type === 'error' && <AlertCircle size={18} className="text-rose-500" />}
              {n.type === 'info' && <Info size={18} className="text-blue-500" />}
            </div>
            <div className="toast-message">{n.message}</div>
            <button
              onClick={() => removeNotification(n.id)}
              className="toast-close"
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
