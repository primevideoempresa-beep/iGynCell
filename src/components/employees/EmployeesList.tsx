import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  FileDown,
  ShieldCheck,
  Mail,
  Phone,
  Edit,
  Trash2,
  LogIn,
  Key,
  CheckCircle2,
  XCircle,
  Percent,
  Lock,
  Unlock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Employee, UserRole } from '../../types';
import { formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import { EmployeeModal } from './EmployeeModal';

export const EmployeesList: React.FC = () => {
  const { employees, deleteEmployee, updateEmployee, searchTerm, setSearchTerm } = useApp();
  const { currentUser, switchUser, isRole, unlockUser } = useAuth();

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedEmployeeToEdit, setSelectedEmployeeToEdit] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.roleLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm);

    if (!matchesSearch) return false;

    if (roleFilter !== 'all' && emp.role !== roleFilter) return false;

    return true;
  });

  const handleOpenNew = () => {
    setSelectedEmployeeToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmployeeToEdit(emp);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (emp: Employee) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    updateEmployee(emp.id, { status: newStatus });
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nome',
      'E-mail',
      'Cargo',
      'Função',
      'Telefone',
      'Status',
      'Comissão Vendas (%)',
      'Comissão Serviços (%)',
      'Cadastrado Em'
    ];
    const rows = filteredEmployees.map(e => [
      e.id,
      e.name,
      e.email,
      e.role.toUpperCase(),
      e.roleLabel,
      e.phone,
      e.status.toUpperCase(),
      e.commissionRateSales,
      e.commissionRateTech,
      formatDate(e.createdAt)
    ]);
    exportToCSV(`iGyn_Cell_Colaboradores_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
      case 'manager':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
      case 'technician':
        return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
      case 'seller':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Gestão de Colaboradores & Permissões (RBAC)
          </h2>
          <p className="text-xs text-slate-400">
            Cadastre funcionários, gerencie credenciais, permissões de módulos e taxas de comissão
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          {isRole(['admin', 'manager']) && (
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-cyan-950 hover:bg-cyan-500 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Colaborador</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const isCurrent = emp.id === currentUser?.id;
          const isLocked = emp.lockoutUntil && new Date(emp.lockoutUntil).getTime() > Date.now();
          
          return (
            <div
              key={emp.id}
              className={`rounded-2xl border bg-slate-900/80 p-5 space-y-4 transition ${
                isCurrent
                  ? 'border-cyan-500/60 ring-1 ring-cyan-500/30'
                  : isLocked
                  ? 'border-rose-500/60 ring-1 ring-rose-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header Profile */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-xl object-cover border border-slate-700"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                        isLocked ? 'bg-rose-500' : emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{emp.name}</span>
                      {isCurrent && (
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-2xs text-cyan-300 font-bold">
                          Você
                        </span>
                      )}
                      {isLocked && (
                        <span className="rounded bg-rose-500/20 px-1.5 py-0.2 font-mono text-2xs text-rose-300 font-bold flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          BLOQUEADO
                        </span>
                      )}
                    </h3>
                    <span className={`inline-block mt-1 rounded px-2 py-0.5 font-mono text-2xs font-semibold border ${getRoleBadgeStyle(emp.role)}`}>
                      {emp.roleLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isLocked && isRole(['admin', 'manager']) && (
                    <button
                      onClick={() => unlockUser(emp.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                      title="Desbloquear Conta Manualmente"
                    >
                      <Unlock className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => switchUser(emp.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition"
                    title="Alternar login para este colaborador"
                  >
                    <LogIn className="h-4 w-4" />
                  </button>
                  {(isRole(['admin', 'manager']) || isCurrent) && (
                    <button
                      onClick={() => handleEdit(emp)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                      title={isCurrent ? "Meu Perfil" : "Editar Colaborador"}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-2xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="font-mono">{emp.phone}</span>
                </div>
              </div>

              {/* Commission Rates Badge */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 flex items-center justify-between text-2xs">
                <div>
                  <span className="text-slate-400 block">Comissão Vendas:</span>
                  <span className="font-mono font-bold text-emerald-400">{emp.commissionRateSales}%</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Comissão Mão de Obra OS:</span>
                  <span className="font-mono font-bold text-cyan-400">{emp.commissionRateTech}%</span>
                </div>
              </div>

              {/* Footer Status & Permissions */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Status:</span>
                  <button
                    onClick={() => handleToggleStatus(emp)}
                    className={`font-semibold underline ${
                      emp.status === 'active' ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {emp.status === 'active' ? 'Ativo' : 'Inativo'}
                  </button>
                </div>

                <span className="text-2xs text-slate-400 font-mono">
                  {emp.allowedTabs.length} módulos liberados
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employeeToEdit={selectedEmployeeToEdit}
      />
    </div>
  );
};
