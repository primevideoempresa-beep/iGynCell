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
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ViewTab } from '../../types';
import { TwoFactorModal } from '../auth/TwoFactorModal';

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
  const { currentUser, switchUser, employees, logout, hasPermission } = useAuth();
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
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

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

                <div className="border-t border-slate-800 pt-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setShow2FAModal(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Autenticação 2FA</span>
                    </div>
                    <span className={`text-3xs font-bold px-1.5 py-0.5 rounded ${
                      currentUser?.twoFactorEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {currentUser?.twoFactorEnabled ? 'Ativada' : 'Desativada'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Configurações da Loja</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition"
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

      <TwoFactorModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
      />
    </header>
  );
};
