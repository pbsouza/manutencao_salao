import React, { useEffect, useState } from 'react';
import {
  BellRing,
  Clock,
  ExternalLink,
  Info,
  ShieldAlert,
  Sparkles,
  Volume2,
  Wrench,
  X,
} from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { AppNotification } from '../types';

export const NotificationToast: React.FC = () => {
  const { setActiveTab, selectService, services, markNotificationAsRead } = useMaintenance();
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);

  useEffect(() => {
    const handleNotificationEvent = (event: Event) => {
      const customEvent = event as CustomEvent<AppNotification>;
      if (customEvent.detail) {
        const notif = customEvent.detail;
        setActiveToasts((prev) => [notif, ...prev.slice(0, 2)]);

        // Auto remove after 6 seconds
        setTimeout(() => {
          setActiveToasts((prev) => prev.filter((t) => t.id !== notif.id));
        }, 6000);
      }
    };

    window.addEventListener('sr-notification-event', handleNotificationEvent);
    return () => {
      window.removeEventListener('sr-notification-event', handleNotificationEvent);
    };
  }, []);

  const handleToastClick = (toast: AppNotification) => {
    markNotificationAsRead(toast.id);
    if (toast.serviceId) {
      const found = services.find((s) => s.id === toast.serviceId);
      if (found) selectService(found);
    }
    if (toast.linkTab) {
      setActiveTab(toast.linkTab);
    }
    setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id));
  };

  const removeToast = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (activeToasts.length === 0) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'GUT_ALERT':
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'ASSIGNMENT':
        return <Wrench className="w-5 h-5 text-blue-500" />;
      case 'PREVENTIVE':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'DUE_DATE':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <BellRing className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleToastClick(toast)}
          className="pointer-events-auto bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 flex items-start gap-3.5 transform transition-all duration-200 animate-in slide-in-from-top-4 cursor-pointer hover:bg-slate-800 group"
        >
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0 group-hover:scale-105 transition">
            {getIcon(toast.type)}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded-md border border-blue-800/50">
                Alerta
              </span>
              <span className="text-[10px] text-slate-400">Agora</span>
            </div>
            <h4 className="text-xs font-bold text-white leading-tight truncate">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-snug line-clamp-2">{toast.body}</p>

            {(toast.linkTab || toast.serviceId) && (
              <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-blue-400 group-hover:text-blue-300">
                <span>Clique para abrir detalhes</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            )}
          </div>

          <button
            onClick={(e) => removeToast(toast.id, e)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
