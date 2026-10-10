import React from 'react';
import {
  LayoutDashboard,
  Users,
  Wrench,
  ShoppingCart,
  Boxes,
  Cpu,
  UserCheck,
  Landmark,
  Award,
  Bell,
  Settings,
  Smartphone,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ViewTab } from '../../types';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ViewTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  roleRequired?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { currentUser, hasPermission, logout } = useAuth();
  const {
    currentTab,
    setCurrentTab,
    orders,
    techParts,
    products,
    financialEntries,
    commissions,
    unreadNotificationsCount,
    settings
  } = useApp();

  const openOrdersCount = orders.filter(o => o.status === 'open' || o.status === 'in_progress').length;
  const lowStockCount =
    techParts.filter(p => p.quantity <= p.minQuantity).length +
    products.filter(p => p.quantity <= p.minQuantity).length;
  const pendingFinanceCount = financialEntries.filter(f => f.status === 'pending').length;
  const pendingCommCount = commissions.filter(c => {
    if (currentUser?.role === 'seller' || currentUser?.role === 'technician') {
      return c.status === 'pending' && c.employeeId === currentUser?.id;
    }
    return c.status === 'pending';
  }).length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: LayoutDashboard
    },
    {
      id: 'orders',
      label: 'Ordens de Serviço',
      icon: Wrench,
      badge: openOrdersCount > 0 ? openOrdersCount : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
    },
    {
      id: 'sales',
      label: 'Vendas & PDV',
      icon: ShoppingCart
    },
    {
      id: 'inventory',
      label: 'Estoque de Produtos',
      icon: Boxes,
      badge: products.filter(p => p.quantity <= p.minQuantity).length > 0 ? products.filter(p => p.quantity <= p.minQuantity).length : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    {
      id: 'parts',
      label: 'Peças & Laboratório',
      icon: Cpu,
      badge: techParts.filter(p => p.quantity <= p.minQuantity).length > 0 ? techParts.filter(p => p.quantity <= p.minQuantity).length : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: UserCheck
    },
    {
      id: 'financial',
      label: 'Financeiro',
      icon: Landmark,
      badge: pendingFinanceCount > 0 ? pendingFinanceCount : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    },
    {
      id: 'commissions',
      label: 'Comissões',
      icon: Award,
      badge: pendingCommCount > 0 ? pendingCommCount : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    },
    {
      id: 'employees',
      label: 'Colaboradores',
      icon: Users
    },
    {
      id: 'audit',
      label: 'Auditoria & Logs',
      icon: ShieldCheck,
      badgeColor: 'bg-cyan-500/20 text-cyan-300'
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings
    }
  ];

  const handleSelectTab = (tab: ViewTab) => {
    setCurrentTab(tab);
    onCloseMobile();
  };

  const visibleNavItems = navItems.filter(item => hasPermission(item.id));

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto bg-slate-950 p-4 border-r border-slate-800/80">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white shadow-lg shadow-cyan-950">
            <img src="/src/assets/images/apple_logo_1791598870314.jpg" alt="Apple Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">
                iGyn<span className="text-cyan-400">Cell</span>
              </span>
            </div>
            <span className="text-2xs text-slate-400 truncate max-w-[150px]">
              {settings.locationDetails}
            </span>
          </div>
        </div>

        {/* Current User Quick Badge */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-lg object-cover border border-slate-700"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-slate-200 truncate">
                {currentUser?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="space-y-1">
          <div className="px-2 pb-2 text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Módulos do Sistema
          </div>
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-950'
                    : 'text-slate-300 hover:bg-slate-900/90 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-2xs tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Store Info */}
      <div className="space-y-3 pt-6 border-t border-slate-800/80">
        <div className="rounded-lg bg-slate-900/40 p-2.5 text-2xs text-slate-400 border border-slate-800/60 space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Porto Seguro - BA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="font-mono">{settings.phone}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800/80 py-2 text-xs font-medium text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Encerrar Acesso</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 w-72 max-w-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
