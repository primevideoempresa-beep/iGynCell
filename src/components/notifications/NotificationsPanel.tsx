import React from 'react';
import {
  Bell,
  AlertTriangle,
  Wrench,
  DollarSign,
  TrendingUp,
  Info,
  CheckCircle2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem, ViewTab } from '../../types';
import { formatDateTime } from '../../utils/formatters';

export const NotificationsPanel: React.FC = () => {
  const { currentUser, isRole } = useAuth();
  const {
    notifications: allNotifications,
    markNotificationRead,
    clearAllNotifications,
    setCurrentTab
  } = useApp();

  const isAdmin = isRole(['admin', 'manager']);

  // Filter notifications for non-admins
  const notifications = isAdmin ? allNotifications : allNotifications.filter(n => {
    // If it's an assignment/completion notification, check if the current user's name is in the message or title
    // This is a bit of a heuristic since we don't have employeeId on NotificationItem yet
    if (n.type === 'order_assigned' || n.type === 'order_completed') {
      return n.message.includes(currentUser?.name || '') || n.title.includes(currentUser?.name || '');
    }
    // Stock alerts and info are for everyone
    return true;
  });

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'stock_alert':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'order_assigned':
      case 'order_completed':
        return <Wrench className="h-5 w-5 text-cyan-400" />;
      case 'financial_due':
        return <DollarSign className="h-5 w-5 text-purple-400" />;
      case 'sale_target':
        return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      default:
        return <Info className="h-5 w-5 text-slate-400" />;
    }
  };

  const handleNavigate = (notif: NotificationItem) => {
    markNotificationRead(notif.id);
    if (notif.linkTab) {
      setCurrentTab(notif.linkTab);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Central de Notificações & Alertas
          </h2>
          <p className="text-xs text-slate-400">
            Avisos automáticos de estoque baixo, novas ordens de serviço, contas a pagar e metas
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <CheckCircle2 className="h-4 w-4 text-slate-400" />
            <span>Marcar Todas como Lidas</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-40 text-slate-400" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma notificação no momento</p>
            <p className="text-xs text-slate-500 mt-1">
              Novos alertas operacionais e atualizações de OS aparecerão aqui em tempo real.
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition ${
                !notif.read
                  ? 'border-cyan-500/40 bg-slate-900 shadow-md shadow-cyan-950/20'
                  : 'border-slate-800 bg-slate-900/50 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800">
                  {getNotifIcon(notif.type)}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{notif.title}</h3>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300">{notif.message}</p>
                  <p className="text-2xs text-slate-500 font-mono">
                    {formatDateTime(notif.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notif.linkTab && (
                  <button
                    onClick={() => handleNavigate(notif)}
                    className="flex items-center gap-1 rounded-lg bg-cyan-600/20 border border-cyan-500/30 px-3 py-1 text-2xs font-semibold text-cyan-300 hover:bg-cyan-600/30 transition"
                  >
                    <span>Ver Módulo</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {!notif.read && (
                  <button
                    onClick={() => markNotificationRead(notif.id)}
                    className="rounded-lg p-1 text-slate-400 hover:text-white"
                    title="Marcar como lida"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
