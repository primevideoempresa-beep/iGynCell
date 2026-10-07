import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  RefreshCw,
  UserCheck,
  Lock,
  Clock,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  Activity,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, fetchAuditLogs, employees, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAuditLogs();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch =
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (entityFilter !== 'all' && log.entity !== entityFilter) return false;
      if (userFilter !== 'all' && log.userId !== userFilter) return false;

      return true;
    });
  }, [auditLogs, searchTerm, actionFilter, entityFilter, userFilter]);

  const handleExportCSV = () => {
    const headers = ['ID Log', 'Data / Hora', 'Usuário', 'Cargo', 'Ação', 'Entidade', 'ID Referência', 'Detalhes', 'Endereço IP'];
    const rows = filteredLogs.map(l => [
      l.id,
      formatDateTime(l.createdAt),
      l.userName,
      l.userRole,
      l.action,
      l.entity,
      l.entityId || '-',
      l.details,
      l.ipAddress || '127.0.0.1'
    ]);
    exportToCSV(`iGyn_Cell_Auditoria_Seguranca_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'LOGIN_FAILED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold animate-pulse';
      case 'LOGOUT':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'CREATE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'UPDATE':
      case 'STATUS_CHANGE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'DELETE':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'PAYMENT':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'BACKUP':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  // Metrics summary
  const totalLogins = auditLogs.filter(l => l.action === 'LOGIN').length;
  const totalFailed = auditLogs.filter(l => l.action === 'LOGIN_FAILED').length;
  const totalOSActions = auditLogs.filter(l => l.entity === 'ServiceOrder').length;
  const totalFinancial = auditLogs.filter(l => l.entity === 'Financial' || l.action === 'PAYMENT').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-cyan-400" />
            <span>Auditoria & Logs de Segurança do Sistema</span>
          </h2>
          <p className="text-xs text-slate-400">
            Registro de todas as atividades, logins, alterações em Ordens de Serviço, estoque e operações financeiras
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Security Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Total de Eventos</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-xl font-mono font-extrabold text-white">{auditLogs.length}</p>
          <span className="text-3xs text-slate-500">Registros gravados no banco</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Logins Autenticados</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-mono font-extrabold text-emerald-400">{totalLogins}</p>
          <span className="text-3xs text-emerald-400/80">Com verificação 2FA / RBAC</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Tentativas Bloqueadas</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-xl font-mono font-extrabold text-rose-400">{totalFailed}</p>
          <span className="text-3xs text-rose-400/80">Proteção anti-Brute Force ativa</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Ações em OS & Financeiro</span>
            <Lock className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-xl font-mono font-extrabold text-purple-400">{totalOSActions + totalFinancial}</p>
          <span className="text-3xs text-purple-400/80">Rastreabilidade completa de autor</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por colaborador, OS, IP, detalhes..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="all">Todas as Ações</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="DELETE">DELETE</option>
            <option value="PAYMENT">PAYMENT</option>
            <option value="BACKUP">BACKUP</option>
          </select>

          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="all">Todas as Entidades</option>
            <option value="Auth">Autenticação / Acesso</option>
            <option value="ServiceOrder">Ordens de Serviço</option>
            <option value="Sale">Vendas de Balcão</option>
            <option value="Financial">Financeiro</option>
            <option value="TechPart">Estoque de Peças</option>
            <option value="Employee">Colaboradores</option>
            <option value="Settings">Configurações</option>
            <option value="Backup">Backup</option>
          </select>

          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
          >
            <option value="all">Todos os Colaboradores</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.roleLabel})
              </option>
            ))}
          </select>
        </div>

        <span className="text-2xs font-mono text-slate-400 whitespace-nowrap">
          Exibindo {filteredLogs.length} registros
        </span>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <tr>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Colaborador</th>
                <th className="p-3">Ação</th>
                <th className="p-3">Módulo</th>
                <th className="p-3">Detalhes do Evento</th>
                <th className="p-3 text-right">IP / Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhum registro de auditoria encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/90 transition">
                    <td className="p-3 text-2xs font-mono text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{log.userName}</p>
                      <span className="text-3xs font-mono text-cyan-400 uppercase tracking-wide">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block rounded px-2 py-0.5 font-mono text-2xs uppercase border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-2xs text-slate-300">
                      {log.entity} {log.entityId && <span className="text-cyan-400">#{log.entityId}</span>}
                    </td>
                    <td className="p-3 text-slate-200 max-w-md">
                      {log.details}
                    </td>
                    <td className="p-3 text-right text-2xs font-mono text-slate-400 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
