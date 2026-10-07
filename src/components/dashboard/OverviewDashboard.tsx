import React from 'react';
import {
  Wrench,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Award,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  FileDown,
  Plus,
  ShoppingCart,
  Boxes,
  Clock,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatNumber, formatDate, getOSStatusInfo } from '../../utils/formatters';
import {
  exportOrdersToPDF,
  exportSalesToPDF,
  exportFinancialToPDF,
  exportToCSV
} from '../../utils/exportUtils';

interface OverviewDashboardProps {
  onOpenNewOS: () => void;
  onOpenNewSale: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onOpenNewOS,
  onOpenNewSale
}) => {
  const { currentUser, hasPermission } = useAuth();
  const {
    orders: allOrders,
    sales: allSales,
    products,
    techParts,
    clients,
    financialEntries: allFinancialEntries,
    commissions: allCommissions,
    settings,
    setCurrentTab
  } = useApp();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Filter data based on role
  const orders = isAdmin ? allOrders : allOrders.filter(o => o.assignedTechnicianId === currentUser?.id);
  const sales = isAdmin ? allSales : allSales.filter(s => s.sellerId === currentUser?.id);
  const commissions = isAdmin ? allCommissions : allCommissions.filter(c => c.employeeId === currentUser?.id);
  const financialEntries = isAdmin ? allFinancialEntries : []; 
  const productsFiltered = isAdmin ? products : [];
  const partsFiltered = isAdmin ? techParts : [];

  // Metrics Calculations
  const openOrders = orders.filter(o => o.status === 'open' || o.status === 'in_progress');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
  
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalOrdersRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenue = totalSalesRevenue + totalOrdersRevenue;

  const lowStockParts = partsFiltered.filter(p => p.quantity <= p.minQuantity);
  const lowStockProducts = productsFiltered.filter(p => p.quantity <= p.minQuantity);
  const totalLowStock = lowStockParts.length + lowStockProducts.length;

  const pendingCommissions = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const pendingReceivables = financialEntries
    .filter(f => f.type === 'income' && f.status === 'pending')
    .reduce((sum, f) => sum + f.amount, 0);

  // Per-employee performance
  const employeePerformance = isAdmin ? [
    { name: 'Lucas Santos', role: 'Técnico Especialista', osCount: 14, revenue: 6420 },
    { name: 'Matheus Oliveira', role: 'Técnico Solda', osCount: 11, revenue: 4180 },
    { name: 'Beatriz Lima', role: 'Consultora Vendas', salesCount: 22, revenue: 14200 },
    { name: 'Gabriel Costa', role: 'Vendedor Balcão', salesCount: 19, revenue: 9850 }
  ] : [];

  // Daily revenue mock for interactive SVG bar chart
  // In a real app this would be filtered server-side, here we just show the user's portion if not admin
  const weeklyData = isAdmin ? [
    { day: 'Segunda', sales: 1850, orders: 1200 },
    { day: 'Terça', sales: 2400, orders: 1800 },
    { day: 'Quarta', sales: 3100, orders: 1400 },
    { day: 'Quinta', sales: 2900, orders: 2200 },
    { day: 'Sexta', sales: 4600, orders: 3100 },
    { day: 'Sábado', sales: 5200, orders: 2800 },
    { day: 'Hoje', sales: 3350, orders: 1980 }
  ] : [
    { day: 'Hoje', sales: sales.length * 150, orders: orders.length * 200 } // Rough estimate for the chart if not admin
  ];

  const maxWeekly = Math.max(...weeklyData.map(d => d.sales + d.orders));

  // Export general summary
  const handleExportDashboardCSV = () => {
    const headers = ['Métrica', 'Valor', 'Observação'];
    const rows = [
      ['Ordens de Serviço Abertas', openOrders.length, 'Em atendimento no laboratório'],
      ['Ordens Concluídas/Entregues', completedOrders.length, 'Total acumulado'],
      ['Total de Vendas Balcão', sales.length, `Faturamento: ${formatCurrency(totalSalesRevenue)}`],
      ['Faturamento Total Geral', formatCurrency(totalRevenue), 'Vendas + Serviços'],
      ['Clientes Cadastrados', clients.length, 'Carteira ativa'],
      ['Itens com Estoque Baixo', totalLowStock, 'Necessita reposição'],
      ['Comissões Pendentes a Pagar', formatCurrency(pendingCommissions), 'A pagar aos colaboradores'],
      ['Contas a Receber', formatCurrency(pendingReceivables), 'Valores pendentes de clientes']
    ];
    exportToCSV(`iGyn_Cell_Resumo_Executivo_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Olá, {currentUser?.name}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Painel operacional da unidade Central Park Shopping, Loja 34 - Porto Seguro - BA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportDashboardCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          {hasPermission('orders') && (
            <button
              onClick={onOpenNewOS}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-950 hover:bg-cyan-500 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova OS</span>
            </button>
          )}

          {hasPermission('sales') && (
            <button
              onClick={onOpenNewSale}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition active:scale-95"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Nova Venda</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* OS Abertas */}
          <div
            onClick={() => setCurrentTab('orders')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition hover:border-cyan-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-2xs font-semibold uppercase tracking-wider">OS Abertas</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
                <Wrench className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-extrabold tabular-nums text-white">
                {openOrders.length}
              </span>
              <span className="text-2xs text-cyan-400">em andamento</span>
            </div>
          </div>

          {/* OS Concluídas */}
          <div
            onClick={() => setCurrentTab('orders')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition hover:border-emerald-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-2xs font-semibold uppercase tracking-wider">OS Concluídas</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-extrabold tabular-nums text-white">
                {completedOrders.length}
              </span>
              <span className="text-2xs text-emerald-400">entregues / prontas</span>
            </div>
          </div>

          {/* Faturamento Total */}
          <div
            onClick={() => setCurrentTab('financial')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition hover:border-emerald-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-2xs font-semibold uppercase tracking-wider">Faturamento Geral</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-extrabold tabular-nums text-emerald-400 truncate">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>

          {/* Total Clientes */}
          <div
            onClick={() => setCurrentTab('clients')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition hover:border-purple-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-2xs font-semibold uppercase tracking-wider">Carteira de Clientes</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-extrabold tabular-nums text-white">
                {clients.length}
              </span>
              <span className="text-2xs text-slate-400">ativos</span>
            </div>
          </div>

          {/* Estoque Baixo */}
          <div
            onClick={() => setCurrentTab('parts')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition hover:border-amber-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-2xs font-semibold uppercase tracking-wider">Estoque Baixo</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-extrabold tabular-nums text-amber-400">
                {totalLowStock}
              </span>
              <span className="text-2xs text-amber-300/80">itens em alerta</span>
            </div>
          </div>

          {/* Comissões a Pagar */}
          <div
            onClick={() => setCurrentTab('commissions')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition hover:border-emerald-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-2xs font-semibold uppercase tracking-wider">Comissões a Pagar</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-extrabold tabular-nums text-white truncate">
                {formatCurrency(pendingCommissions)}
              </span>
            </div>
          </div>

          {/* Contas a Receber */}
          <div
            onClick={() => setCurrentTab('financial')}
            className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition hover:border-sky-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-2xs font-semibold uppercase tracking-wider">Contas a Receber</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-extrabold tabular-nums text-sky-400 truncate">
                {formatCurrency(pendingReceivables)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Sales & Services Trend Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Fluxo de Faturamento: Vendas vs Ordens de Serviço
              </h3>
              <p className="text-2xs text-slate-400">
                Desempenho diário acumulado na semana atual
              </p>
            </div>
            <div className="flex items-center gap-3 text-2xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" />
                <span className="text-slate-300">Vendas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-slate-300">Serviços / OS</span>
              </div>
            </div>
          </div>

          {/* Clean Interactive SVG Bar Chart */}
          <div className="pt-4">
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 border-b border-slate-800 pb-2">
              {weeklyData.map((d, index) => {
                const totalDay = d.sales + d.orders;
                const salesHeight = Math.max(10, Math.round((d.sales / maxWeekly) * 160));
                const ordersHeight = Math.max(8, Math.round((d.orders / maxWeekly) * 160));

                return (
                  <div key={index} className="flex flex-col items-center gap-1.5 group h-full justify-end">
                    <div className="text-2xs font-mono tabular-nums text-slate-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {formatCurrency(totalDay)}
                    </div>
                    <div className="w-full max-w-[36px] flex flex-col gap-1 items-center">
                      <div
                        style={{ height: `${ordersHeight}px` }}
                        className="w-full rounded-t bg-emerald-500/80 group-hover:bg-emerald-400 transition"
                        title={`Serviços: ${formatCurrency(d.orders)}`}
                      />
                      <div
                        style={{ height: `${salesHeight}px` }}
                        className="w-full rounded-b bg-cyan-500/80 group-hover:bg-cyan-400 transition"
                        title={`Vendas: ${formatCurrency(d.sales)}`}
                      />
                    </div>
                    <span className="text-2xs text-slate-400 font-medium truncate max-w-full">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Top Team Collaborators Performance */}
        {isAdmin && (
          <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Desempenho da Equipe
              </h3>
              <p className="text-2xs text-slate-400">
                Produtividade e faturamento gerado
              </p>
            </div>

            <div className="space-y-3">
              {employeePerformance.map((emp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">{emp.name}</p>
                    <p className="text-2xs text-slate-400">{emp.role}</p>
                    <div className="text-2xs text-cyan-400 font-medium">
                      {emp.osCount ? `${emp.osCount} reparos concluídos` : `${emp.salesCount} vendas realizadas`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold tabular-nums text-emerald-400">
                      {formatCurrency(emp.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid: Recent OSs & Recent Sales */}
      {(orders.length > 0 || sales.length > 0) && (
        <div className={`grid grid-cols-1 ${orders.length > 0 && sales.length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
          {/* Recent Service Orders */}
          {orders.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Últimas Ordens de Serviço
                  </h3>
                  <p className="text-2xs text-slate-400">
                    Aparelhos em manutenção no laboratório
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('orders')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Ver todas →
                </button>
              </div>

              <div className="space-y-2.5">
                {orders.slice(0, 4).map(order => {
                  const statusInfo = getOSStatusInfo(order.status);
                  return (
                    <div
                      key={order.id}
                      onClick={() => setCurrentTab('orders')}
                      className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 hover:border-slate-700 transition cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">{order.id}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-xs font-medium text-slate-200">{order.brand} {order.model}</span>
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-slate-400">
                          <span>Cliente: {order.clientName}</span>
                          <span>·</span>
                          <span>Téc: {order.assignedTechnicianName}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`rounded px-2 py-0.5 font-mono text-2xs font-semibold border ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                          {statusInfo.label}
                        </span>
                        <span className="font-mono text-xs font-bold tabular-nums text-slate-200">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Counter Sales */}
          {sales.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Últimas Vendas no Balcão
                  </h3>
                  <p className="text-2xs text-slate-400">
                    Aparelhos novos, seminovos e acessórios
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('sales')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Ver todas →
                </button>
              </div>

              <div className="space-y-2.5">
                {sales.slice(0, 4).map(sale => (
                  <div
                    key={sale.id}
                    onClick={() => setCurrentTab('sales')}
                    className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 hover:border-slate-700 transition cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{sale.id}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-xs font-medium text-slate-200 truncate max-w-[180px]">
                          {sale.items.map(i => i.name).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-2xs text-slate-400">
                        <span>{sale.clientName}</span>
                        <span>·</span>
                        <span>Vendedor: {sale.sellerName}</span>
                        <span>·</span>
                        <span className="font-mono uppercase">{sale.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-mono text-xs font-bold tabular-nums text-emerald-400">
                        {formatCurrency(sale.totalAmount)}
                      </span>
                      <span className="font-mono text-2xs text-slate-400 tabular-nums">
                        Comissão: {formatCurrency(sale.commissionAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
