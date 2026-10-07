import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  FileDown,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Trash2,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { FinancialEntry } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportFinancialToPDF, exportToCSV } from '../../utils/exportUtils';
import { FinancialEntryModal } from './FinancialEntryModal';

export const FinancialDashboard: React.FC = () => {
  const {
    financialEntries,
    updateFinancialStatus,
    deleteFinancialEntry,
    settings,
    searchTerm,
    setSearchTerm
  } = useApp();
  const { isRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'receivables' | 'payables' | 'dre'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<'income' | 'expense'>('expense');

  // Filter entries
  const filteredEntries = financialEntries.filter(entry => {
    // Type filter
    if (activeTab === 'receivables' && entry.type !== 'income') return false;
    if (activeTab === 'payables' && entry.type !== 'expense') return false;

    // Search
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.recipientOrPayer.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status
    if (statusFilter !== 'all' && entry.status !== statusFilter) return false;

    return true;
  });

  // Calculations
  const totalIncomePaid = financialEntries
    .filter(e => e.type === 'income' && e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncomePending = financialEntries
    .filter(e => e.type === 'income' && e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpensePaid = financialEntries
    .filter(e => e.type === 'expense' && e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpensePending = financialEntries
    .filter(e => e.type === 'expense' && e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const realizedBalance = totalIncomePaid - totalExpensePaid;
  const projectedBalance = (totalIncomePaid + totalIncomePending) - (totalExpensePaid + totalExpensePending);

  const handleOpenAdd = (type: 'income' | 'expense') => {
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  const handleExportPDF = () => {
    exportFinancialToPDF(financialEntries, settings);
  };

  const handleExportCSV = () => {
    const headers = [
      'Código',
      'Data Vencimento',
      'Tipo',
      'Categoria',
      'Descrição',
      'Favorecido / Pagador',
      'Valor',
      'Status',
      'Data Pagamento'
    ];
    const rows = filteredEntries.map(e => [
      e.id,
      formatDate(e.dueDate),
      e.type === 'income' ? 'RECEITA' : 'DESPESA',
      e.category,
      e.description,
      e.recipientOrPayer,
      e.amount,
      e.status.toUpperCase(),
      e.paymentDate ? formatDate(e.paymentDate) : '-'
    ]);
    exportToCSV(`iGyn_Cell_Financeiro_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Gestão Financeira & Fluxo de Caixa
          </h2>
          <p className="text-xs text-slate-400">
            Contas a pagar, contas a receber, pagamentos de fornecedores e aluguel do Central Park
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
            onClick={() => handleOpenAdd('income')}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Receber</span>
          </button>

          <button
            onClick={() => handleOpenAdd('expense')}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-rose-950 hover:bg-rose-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>+ Pagar</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span>Contas a Receber</span>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-emerald-400">
              {formatCurrency(totalIncomePending)}
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Recebido: {formatCurrency(totalIncomePaid)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Contas a Pagar</span>
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-rose-400">
              {formatCurrency(totalExpensePending)}
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Liquidado: {formatCurrency(totalExpensePaid)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Saldo Realizado em Caixa
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`font-mono text-xl font-extrabold tabular-nums ${
                realizedBalance >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatCurrency(realizedBalance)}
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Entradas - Saídas pagas
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-cyan-400">
            Saldo Projetado
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`font-mono text-xl font-extrabold tabular-nums ${
                projectedBalance >= 0 ? 'text-cyan-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(projectedBalance)}
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Prevendo todos os vencimentos
          </p>
        </div>
      </div>

      {/* Segmented Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        {/* Navigation Tabs */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos os Lançamentos
          </button>
          <button
            onClick={() => setActiveTab('receivables')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'receivables' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            📥 Contas a Receber
          </button>
          <button
            onClick={() => setActiveTab('payables')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'payables' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            📤 Contas a Pagar
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar lançamento..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="all">Status: Todos</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago / Liquidado</option>
          </select>
        </div>
      </div>

      {/* Financial Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <tr>
                <th className="p-3">Cód</th>
                <th className="p-3">Vencimento</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Favorecido / Pagador</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Nenhum lançamento financeiro encontrado.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const isIncome = entry.type === 'income';
                  const isPaid = entry.status === 'paid';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-900/90 transition">
                      <td className="p-3 font-mono font-bold text-cyan-400">{entry.id}</td>
                      <td className="p-3 font-mono text-2xs text-slate-300">{formatDate(entry.dueDate)}</td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-2xs font-bold ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isIncome ? 'RECEITA' : 'DESPESA'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{entry.category}</td>
                      <td className="p-3 font-medium text-white max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </td>
                      <td className="p-3 text-slate-300 text-2xs">{entry.recipientOrPayer}</td>
                      <td
                        className={`p-3 text-right font-mono font-bold tabular-nums ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(entry.amount)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-2xs font-semibold ${
                            isPaid
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {isPaid ? 'LIQUIDADO' : 'PENDENTE'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!isPaid ? (
                            <button
                              onClick={() => updateFinancialStatus(entry.id, 'paid')}
                              className="rounded bg-emerald-600 px-2 py-1 text-2xs font-bold text-white hover:bg-emerald-500 transition"
                            >
                              Dar Baixa
                            </button>
                          ) : (
                            <button
                              onClick={() => updateFinancialStatus(entry.id, 'pending')}
                              className="rounded bg-slate-800 px-2 py-1 text-2xs text-slate-400 hover:text-white"
                            >
                              Desfazer
                            </button>
                          )}
                          {isRole(['admin', 'manager']) && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja excluir o lançamento ${entry.id}?`)) {
                                  deleteFinancialEntry(entry.id);
                                }
                              }}
                              className="rounded p-1 text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FinancialEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={modalDefaultType}
      />
    </div>
  );
};
