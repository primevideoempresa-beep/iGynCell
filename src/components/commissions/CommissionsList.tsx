import React, { useState } from 'react';
import {
  Award,
  Search,
  FileDown,
  DollarSign,
  User,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Percent
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { CommissionRecord } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { exportCommissionsToPDF, exportToCSV } from '../../utils/exportUtils';

export const CommissionsList: React.FC = () => {
  const { commissions, markCommissionPaid, employees, settings, searchTerm, setSearchTerm } = useApp();
  const { currentUser, isRole } = useAuth();

  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>(
    currentUser?.role === 'seller' || currentUser?.role === 'technician'
      ? currentUser.id
      : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isRestrictedUser = currentUser?.role === 'seller' || currentUser?.role === 'technician';

  // Filter commissions based on RBAC & UI filters
  const filteredCommissions = commissions.filter(c => {
    // RBAC check: seller / tech only view their own
    if (isRestrictedUser && c.employeeId !== currentUser?.id) {
      return false;
    }

    if (!isRestrictedUser && selectedEmployeeFilter !== 'all' && c.employeeId !== selectedEmployeeFilter) {
      return false;
    }

    // Search
    const matches =
      c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matches) return false;

    // Status
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;

    return true;
  });

  // Calculate aggregated metrics
  const totalBaseGenerated = filteredCommissions.reduce((sum, c) => sum + c.baseAmount, 0);
  const totalCommissionEarned = filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalCommissionPaid = filteredCommissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalCommissionPending = filteredCommissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const handleExportPDF = () => {
    exportCommissionsToPDF(filteredCommissions, settings);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Data Gerada',
      'Colaborador',
      'Origem',
      'Referência (OS/Venda)',
      'Descrição',
      'Valor Base (R$)',
      'Taxa (%)',
      'Valor Comissão (R$)',
      'Status',
      'Data de Pagamento'
    ];
    const rows = filteredCommissions.map(c => [
      c.id,
      formatDate(c.createdAt),
      c.employeeName,
      c.type === 'sale' ? 'Venda Balcão' : 'Ordem de Serviço',
      c.referenceId,
      c.description,
      c.baseAmount,
      c.rate,
      c.commissionAmount,
      c.status === 'paid' ? 'PAGO' : 'PENDENTE',
      c.paidAt ? formatDate(c.paidAt) : '-'
    ]);
    exportToCSV(`iGyn_Cell_Comissoes_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Painel de Comissões dos Colaboradores
          </h2>
          <p className="text-xs text-slate-400">
            {isRestrictedUser
              ? `Visualizando desempenho individual de ${currentUser?.name}`
              : 'Acompanhamento de comissões sobre vendas de balcão e serviços de assistência técnica'}
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
        </div>
      </div>

      {/* 4 Standard Commission KPI Cards (as specified in the prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Vendas Realizadas */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Base Produzida / Vendas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-white">
              {formatCurrency(totalBaseGenerated)}
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            {filteredCommissions.length} atendimentos
          </p>
        </div>

        {/* Comissão Total */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-cyan-400">
            Comissão Gerada
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-cyan-400">
              {formatCurrency(totalCommissionEarned)}
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Total acumulado
          </p>
        </div>

        {/* Comissão Paga */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-400">
            Comissão Já Paga
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-emerald-400">
              {formatCurrency(totalCommissionPaid)}
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            Liquidada em folha
          </p>
        </div>

        {/* Comissão Pendente */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-amber-400">
            Comissão Pendente
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-amber-400">
              {formatCurrency(totalCommissionPending)}
            </span>
          </div>
          <p className="text-2xs text-slate-400 mt-0.5">
            A ser liquidada
          </p>
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
              placeholder="Buscar por colaborador, código OS/Venda..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
            />
          </div>

          {!isRestrictedUser && (
            <select
              value={selectedEmployeeFilter}
              onChange={e => setSelectedEmployeeFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
            >
              <option value="all">Todos os Colaboradores</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.roleLabel})
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="all">Status: Todos</option>
            <option value="pending">Pendente</option>
            <option value="paid">Paga / Liquidada</option>
          </select>
        </div>

        <span className="text-2xs font-mono text-slate-400">
          {filteredCommissions.length} registros
        </span>
      </div>

      {/* Commissions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <tr>
                <th className="p-3">Cód</th>
                <th className="p-3">Data</th>
                <th className="p-3">Colaborador</th>
                <th className="p-3">Origem</th>
                <th className="p-3">Referência</th>
                <th className="p-3">Descrição</th>
                <th className="p-3 text-right">Base de Cálculo</th>
                <th className="p-3 text-center">Taxa</th>
                <th className="p-3 text-right">Comissão</th>
                <th className="p-3 text-center">Status</th>
                {isRole(['admin', 'manager']) && <th className="p-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    Nenhum registro de comissão encontrado.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map(comm => {
                  const isPaid = comm.status === 'paid';
                  return (
                    <tr key={comm.id} className="hover:bg-slate-900/90 transition">
                      <td className="p-3 font-mono font-bold text-cyan-400">{comm.id}</td>
                      <td className="p-3 font-mono text-2xs text-slate-400">{formatDate(comm.createdAt)}</td>
                      <td className="p-3 font-medium text-white">{comm.employeeName}</td>
                      <td className="p-3 text-2xs text-slate-400">
                        {comm.type === 'sale' ? 'Venda Balcão' : 'Ordem de Serviço'}
                      </td>
                      <td className="p-3 font-mono font-bold text-cyan-300">{comm.referenceId}</td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={comm.description}>
                        {comm.description}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400 tabular-nums">
                        {formatCurrency(comm.baseAmount)}
                      </td>
                      <td className="p-3 text-center font-mono text-cyan-400 font-semibold">
                        {comm.rate}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold tabular-nums text-emerald-400">
                        {formatCurrency(comm.commissionAmount)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-2xs font-semibold ${
                            isPaid
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {isPaid ? 'PAGO' : 'PENDENTE'}
                        </span>
                      </td>
                      {isRole(['admin', 'manager']) && (
                        <td className="p-3 text-center">
                          {!isPaid ? (
                            <button
                              onClick={() => markCommissionPaid(comm.id)}
                              className="rounded bg-emerald-600 px-2.5 py-1 text-2xs font-bold text-white hover:bg-emerald-500 transition shadow-sm"
                            >
                              Pagar Comissão
                            </button>
                          ) : (
                            <span className="text-2xs text-slate-500 font-mono">
                              {comm.paidAt ? formatDate(comm.paidAt) : 'Quitado'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
