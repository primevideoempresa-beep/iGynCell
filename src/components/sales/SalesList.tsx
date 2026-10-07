import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  FileDown,
  Calendar,
  User,
  CreditCard,
  DollarSign,
  ChevronDown,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { exportSalesToPDF, exportToCSV } from '../../utils/exportUtils';
import { NewSaleModal } from './NewSaleModal';

export const SalesList: React.FC = () => {
  const { sales, cancelSale, settings, employees, searchTerm, setSearchTerm } = useApp();
  const { currentUser, isRole } = useAuth();

  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const isAdmin = isRole(['admin', 'manager']);

  const filteredSales = sales.filter(sale => {
    // Role based access: sellers only see their own sales unless admin/manager
    if (!isAdmin && sale.sellerId !== currentUser?.id) return false;

    // Search
    const matchesSearch =
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Seller
    if (sellerFilter !== 'all' && sale.sellerId !== sellerFilter) return false;

    // Payment
    if (paymentFilter !== 'all' && sale.paymentMethod !== paymentFilter) return false;

    // RBAC: if user is seller only, can toggle between own and all or see own
    return true;
  });

  const totalSalesAmount = filteredSales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const totalCommissionsAmount = filteredSales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.commissionAmount, 0);

  const handleExportPDF = () => {
    exportSalesToPDF(filteredSales, settings);
  };

  const handleExportCSV = () => {
    const headers = [
      'Código Venda',
      'Data / Hora',
      'Cliente',
      'Vendedor',
      'Itens Vendidos',
      'Subtotal',
      'Desconto',
      'Valor Total',
      'Forma Pagamento',
      'Taxa Comissão (%)',
      'Valor Comissão',
      'Status'
    ];
    const rows = filteredSales.map(s => [
      s.id,
      formatDateTime(s.createdAt),
      s.clientName,
      s.sellerName,
      s.items.map(i => `${i.quantity}x ${i.name}`).join(' | '),
      s.subtotal,
      s.discount,
      s.totalAmount,
      s.paymentMethod.toUpperCase(),
      s.commissionRate,
      s.commissionAmount,
      s.status
    ]);
    exportToCSV(`iGyn_Cell_Relatorio_Vendas_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Vendas & Frente de Caixa (PDV)
          </h2>
          <p className="text-xs text-slate-400">
            Registro de vendas de smartphones, capinhas, películas e acessórios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => setIsNewSaleOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-950 hover:bg-emerald-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Venda (PDV)</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, produto, código..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
            />
          </div>

          {isAdmin && (
            <select
              value={sellerFilter}
              onChange={e => setSellerFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
            >
              <option value="all">Todos os Vendedores</option>
              {employees.filter(e => e.role === 'seller' || e.role === 'admin' || e.role === 'manager').map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}

          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="all">Forma: Todas</option>
            <option value="pix">PIX</option>
            <option value="credit">Cartão de Crédito</option>
            <option value="debit">Cartão de Débito</option>
            <option value="cash">Dinheiro / Espécie</option>
          </select>
        </div>

        <span className="text-2xs font-mono text-slate-400">
          {filteredSales.length} registros
        </span>
      </div>

      {/* Summary Metrics */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 bg-slate-950/90 px-4 py-4 backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
              Total em Vendas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl font-extrabold tabular-nums text-emerald-400">
                {formatCurrency(totalSalesAmount)}
              </span>
              <span className="text-2xs text-slate-400">({filteredSales.length} transações)</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
              Comissões de Vendas Geradas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl font-extrabold tabular-nums text-cyan-400">
                {formatCurrency(totalCommissionsAmount)}
              </span>
              <span className="text-2xs text-slate-400">a pagar</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
              Ticket Médio por Venda
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl font-extrabold tabular-nums text-white">
                {filteredSales.length > 0 ? formatCurrency(totalSalesAmount / filteredSales.length) : 'R$ 0,00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Data Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <tr>
                <th className="p-3">Cód Venda</th>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Itens</th>
                <th className="p-3">Vendedor</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3 text-right">Comissão</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Status</th>
                {isRole(['admin', 'manager']) && <th className="p-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Nenhuma venda encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-900/90 transition">
                    <td className="p-3 font-mono font-bold text-cyan-400">{sale.id}</td>
                    <td className="p-3 text-2xs text-slate-400 font-mono">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="p-3 font-medium text-white">{sale.clientName}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate" title={sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                      {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="p-3 text-slate-400">{sale.sellerName}</td>
                    <td className="p-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-2xs uppercase text-slate-300 border border-slate-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-slate-400">
                      {formatCurrency(sale.commissionAmount)} ({sale.commissionRate}%)
                    </td>
                    <td className="p-3 text-right font-mono font-bold tabular-nums text-emerald-400">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-2xs font-semibold ${
                          sale.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {sale.status === 'completed' ? 'Concluída' : 'Cancelada'}
                      </span>
                    </td>
                    {isRole(['admin', 'manager']) && (
                      <td className="p-3 text-center">
                        {sale.status === 'completed' && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente cancelar a venda ${sale.id}?`)) {
                                cancelSale(sale.id);
                              }
                            }}
                            title="Cancelar Venda"
                            className="rounded p-1 text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
      />
    </div>
  );
};
