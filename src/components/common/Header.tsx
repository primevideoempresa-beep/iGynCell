import React, { useState } from 'react';
import {
  Bell,
  Search,
  User,
  LogOut,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Building2,
  Phone,
  Menu,
  X,
  FileText,
  Plus,
  Clock,
  KeyRound,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ViewTab } from '../../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewOS: () => void;
  onOpenNewSale: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenNewOS,
  onOpenNewSale
}) => {
  const {
    currentUser,
    switchUser,
    employees,
    logout,
    hasPermission,
    twoFactorSessionExpiresAt,
    twoFactorRemainingSeconds,
    renew2FASession,
    setShowReauthModal
  } = useAuth();
  const {
    currentTab,
    setCurrentTab,
    searchTerm,
    setSearchTerm,
    unreadNotificationsCount: rawCount,
    notifications,
    settings
  } = useApp();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  
  // Filter count for the badge if not admin
  const unreadNotificationsCount = isAdmin ? rawCount : notifications.filter(n => {
    if (!n.read) {
      if (n.type === 'order_assigned' || n.type === 'order_completed') {
        return n.message.includes(currentUser?.name || '') || n.title.includes(currentUser?.name || '');
      }
      return true;
    }
    return false;
  }).length;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [show2FAMenu, setShow2FAMenu] = useState(false);
  const [renewCodeInput, setRenewCodeInput] = useState('');
  const [renewMsg, setRenewMsg] = useState('');

  const expiryTimeFormatted = twoFactorSessionExpiresAt
    ? new Date(twoFactorSessionExpiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const expiryFullFormatted = twoFactorSessionExpiresAt
    ? new Date(twoFactorSessionExpiresAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Não definido';

  const hoursLeft = Math.floor(twoFactorRemainingSeconds / 3600);
  const minutesLeft = Math.floor((twoFactorRemainingSeconds % 3600) / 60);

  const handleQuickRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewCodeInput) return;
    const ok = await renew2FASession(renewCodeInput);
    if (ok) {
      setRenewMsg('Sessão renovada!');
      setRenewCodeInput('');
      setTimeout(() => setRenewMsg(''), 2500);
    } else {
      setRenewMsg('Código inválido!');
    }
  };

  const getBreadcrumbTitle = (tab: ViewTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Visão Geral do Painel';
      case 'orders':
        return 'Gestão de Ordens de Serviço (OS)';
      case 'sales':
        return 'Frente de Caixa & Vendas (PDV)';
      case 'inventory':
        return 'Controle de Estoque & Acessórios';
      case 'parts':
        return 'Laboratório & Peças Técnicas';
      case 'clients':
        return 'Carteira de Clientes';
      case 'financial':
        return 'Financeiro & Fluxo de Caixa';
      case 'commissions':
        return 'Controle de Comissões';
      case 'employees':
        return 'Equipe & Permissões';
      case 'notifications':
        return 'Central de Notificações';
      case 'settings':
        return 'Configurações do Sistema';
      default:
        return 'Painel iGyn Cell';
    }
  };

  return (
    <header className="relative z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 backdrop-blur-md lg:px-6">
      {/* Zone 1: Mobile toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
          title="Abrir Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-cyan-400">iGyn Cell</span>
            <span>/</span>
            <span className="text-slate-300 capitalize">{currentTab}</span>
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-white sm:text-base">
            {getBreadcrumbTitle(currentTab)}
          </h1>
        </div>
      </div>

      {/* Zone 3: Profile & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 2FA Status & Validity Badge ("Até quando funciona") */}
        <div className="relative">
          <button
            onClick={() => setShow2FAMenu(!show2FAMenu)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1.5 hover:bg-emerald-950/70 transition"
            title="Status da Autenticação em Dois Fatores (2FA) e Validade da Sessão"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-3xs font-extrabold uppercase text-emerald-400 leading-none">
                2FA ATIVO
              </span>
              <span className="text-3xs text-emerald-200/90 font-mono leading-tight">
                Até {expiryTimeFormatted} ({hoursLeft}h {minutesLeft}m)
              </span>
            </div>
          </button>

          {show2FAMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShow2FAMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-2xl shadow-black/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Segurança 2FA Ativa</h4>
                      <p className="text-3xs text-emerald-300">Obrigatório para Todos</p>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-3xs font-mono font-bold text-emerald-300">
                    PROTEGIDO
                  </span>
                </div>

                <div className="rounded-lg bg-slate-950 p-2.5 space-y-1.5 text-2xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Colaborador:</span>
                    <strong className="text-white truncate max-w-[140px]">{currentUser?.name}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Validade da Sessão:</span>
                    <span className="font-mono text-emerald-400 font-bold">{expiryFullFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Tempo Restante:</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {hoursLeft}h {minutesLeft}m
                    </span>
                  </div>
                </div>

                {/* Quick Renew Form */}
                <form onSubmit={handleQuickRenew} className="space-y-1.5">
                  <label className="text-3xs font-semibold text-slate-300 block">Renovar sessão 2FA:</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      maxLength={8}
                      value={renewCodeInput}
                      onChange={e => setRenewCodeInput(e.target.value.replace(/[^0-9-]/g, ''))}
                      placeholder="Código 6 dígitos"
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-mono text-center text-white outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={!renewCodeInput}
                      className="rounded-lg bg-cyan-600 px-2.5 py-1 text-2xs font-bold text-white hover:bg-cyan-500 disabled:opacity-40"
                    >
                      Renovar
                    </button>
                  </div>
                  {renewMsg && (
                    <span className="text-3xs font-bold text-cyan-400 block">{renewMsg}</span>
                  )}
                </form>

                <div className="border-t border-slate-800 pt-1 flex justify-between items-center text-3xs">
                  <button
                    type="button"
                    onClick={() => {
                      setRenewCodeInput('123456');
                    }}
                    className="text-amber-300 hover:underline font-mono"
                  >
                    Usar 123456
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('settings');
                      setShow2FAMenu(false);
                    }}
                    className="font-bold text-cyan-400 hover:text-cyan-300"
                  >
                    Configurações 2FA →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Account / Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 p-1.5 hover:border-slate-700 transition"
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'Usuário'}
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-md object-cover border border-slate-700"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-100 leading-tight max-w-[120px] truncate">
                {currentUser?.name || 'Colaborador'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl shadow-black/60">
                <div className="border-b border-slate-800 px-3 py-2">
                  <p className="text-xs font-semibold text-white">{currentUser?.name}</p>
                  <p className="text-2xs text-slate-400">{currentUser?.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-cyan-950/60 px-2 py-0.5 text-2xs font-medium text-cyan-300 border border-cyan-800/40">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{currentUser?.roleLabel}</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      setCurrentTab('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Dados da Loja ({settings.storeName})</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sair da Sessão</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
