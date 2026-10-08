import React, { useState, useEffect } from 'react';
import { Employee, UserRole, ViewTab } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { formatPhone } from '../../utils/formatters';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Users, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Phone, 
  Percent, 
  Image, 
  Trash2, 
  AlertTriangle, 
  Check,
  CheckCircle2,
  Unlock,
  X
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit
}) => {
  const { addEmployee, updateEmployee, deleteEmployee } = useApp();
  const { currentUser, isRole, unlockUser, setup2FA, confirm2FA, disable2FA } = useAuth();

  const isAdmin = isRole(['admin', 'manager']);
  const isEditingSelf = employeeToEdit?.id === currentUser?.id;
  const canEditSensitive = isAdmin && !isEditingSelf || (isAdmin && isEditingSelf); 
  
  const isLocked = employeeToEdit?.lockoutUntil && new Date(employeeToEdit.lockoutUntil).getTime() > Date.now();
  // Wait, if it's admin editing themselves, they should be able to edit everything.
  // Actually, if you are an admin, you can edit everything. 
  // If you are NOT an admin, you can only edit name, email, phone, avatar if it's yourself.

  const canEditPermissions = isAdmin;
  const canDelete = isAdmin && employeeToEdit && currentUser?.id !== employeeToEdit.id;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<UserRole>('seller');
  const [roleLabel, setRoleLabel] = useState('Consultor de Vendas');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [phone, setPhone] = useState('(73) 99147-4434');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [commissionRateSales, setCommissionRateSales] = useState<number>(5);
  const [commissionRateTech, setCommissionRateTech] = useState<number>(10);
  const [allowedTabs, setAllowedTabs] = useState<ViewTab[]>([
    'dashboard',
    'sales',
    'clients',
    'commissions',
    'notifications'
  ]);
  
  // 2FA Setup State
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [qrCodeUri, setQrCodeUri] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [isConfirming2FA, setIsConfirming2FA] = useState(false);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const allTabs: { id: ViewTab; label: string }[] = [
    { id: 'dashboard', label: '📊 Visão Geral' },
    { id: 'orders', label: '📝 Ordens de Serviço' },
    { id: 'sales', label: '💰 Vendas & PDV' },
    { id: 'inventory', label: '📦 Estoque de Produtos' },
    { id: 'parts', label: '🔧 Peças & Lab' },
    { id: 'clients', label: '👤 Clientes' },
    { id: 'financial', label: '💳 Financeiro' },
    { id: 'commissions', label: '🏆 Comissões' },
    { id: 'employees', label: '👥 Colaboradores' },
    { id: 'notifications', label: '🔔 Notificações' },
    { id: 'settings', label: '⚙️ Configurações' }
  ];

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (employeeToEdit) {
      setName(employeeToEdit.name);
      setEmail(employeeToEdit.email);
      setPassword(employeeToEdit.password || '123456');
      setRole(employeeToEdit.role);
      setRoleLabel(employeeToEdit.roleLabel);
      setAvatar(employeeToEdit.avatar);
      setPhone(employeeToEdit.phone);
      setStatus(employeeToEdit.status);
      setCommissionRateSales(employeeToEdit.commissionRateSales);
      setCommissionRateTech(employeeToEdit.commissionRateTech);
      setAllowedTabs(employeeToEdit.allowedTabs);
    } else {
      setName('');
      setEmail('');
      setPassword('123456');
      setRole('seller');
      setRoleLabel('Consultor de Vendas');
      setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      setPhone('(73) 99147-4434');
      setStatus('active');
      setCommissionRateSales(5);
      setCommissionRateTech(0);
      setAllowedTabs(['dashboard', 'sales', 'clients', 'commissions', 'notifications']);
    }
  }, [employeeToEdit, isOpen]);

  const handleDelete = () => {
    if (!employeeToEdit) return;
    if (currentUser?.id === employeeToEdit.id) {
      alert('Você não pode excluir o colaborador atualmente conectado na sessão.');
      return;
    }
    deleteEmployee(employeeToEdit.id);
    onClose();
  };

  const handleStartSetup2FA = async () => {
    setTwoFactorError('');
    try {
      if (!employeeToEdit) return;
      const { secret, qrCodeUri } = await setup2FA(employeeToEdit.id);
      setTwoFactorSecret(secret);
      setQrCodeUri(qrCodeUri);
      setIsSettingUp2FA(true);
    } catch (err: any) {
      setTwoFactorError(err.message);
    }
  };

  const handleConfirmActivation = async () => {
    setTwoFactorError('');
    setIsConfirming2FA(true);
    try {
      if (!employeeToEdit) return;
      const ok = await confirm2FA(employeeToEdit.id, twoFactorSecret, confirmationCode);
      if (ok) {
        setIsSettingUp2FA(false);
        setConfirmationCode('');
      } else {
        setTwoFactorError('Código incorreto. Tente novamente.');
      }
    } catch (err: any) {
      setTwoFactorError(err.message);
    } finally {
      setIsConfirming2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!employeeToEdit) return;
    if (confirm('Tem certeza que deseja desativar a proteção 2FA para este colaborador?')) {
      const ok = await disable2FA(employeeToEdit.id);
      if (!ok) alert('Erro ao desativar 2FA.');
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    switch (newRole) {
      case 'admin':
        setRoleLabel('Administrador & Proprietário');
        setCommissionRateSales(5);
        setCommissionRateTech(10);
        setAllowedTabs(allTabs.map(t => t.id));
        break;
      case 'manager':
        setRoleLabel('Gerente Geral');
        setCommissionRateSales(4);
        setCommissionRateTech(8);
        setAllowedTabs(['dashboard', 'orders', 'sales', 'inventory', 'parts', 'clients', 'financial', 'commissions', 'notifications', 'settings']);
        break;
      case 'technician':
        setRoleLabel('Técnico Especialista em Celulares');
        setCommissionRateSales(3);
        setCommissionRateTech(12);
        setAllowedTabs(['dashboard', 'orders', 'parts', 'clients', 'commissions', 'notifications']);
        break;
      case 'seller':
        setRoleLabel('Consultor de Vendas & Balcão');
        setCommissionRateSales(5);
        setCommissionRateTech(0);
        setAllowedTabs(['dashboard', 'sales', 'clients', 'commissions', 'notifications']);
        break;
    }
  };

  const toggleTabPermission = (tabId: ViewTab) => {
    if (allowedTabs.includes(tabId)) {
      setAllowedTabs(allowedTabs.filter(t => t !== tabId));
    } else {
      setAllowedTabs([...allowedTabs, tabId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (employeeToEdit) {
      updateEmployee(employeeToEdit.id, {
        name,
        email,
        password,
        role,
        roleLabel,
        avatar,
        phone,
        status,
        commissionRateSales,
        commissionRateTech,
        allowedTabs
      });
    } else {
      addEmployee({
        name,
        email,
        password,
        role,
        roleLabel,
        avatar,
        phone,
        status,
        commissionRateSales,
        commissionRateTech,
        allowedTabs
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? `Editar Colaborador: ${employeeToEdit.name}` : 'Cadastrar Novo Colaborador'}
      subtitle="Defina perfil de acesso, senha, taxas de comissão e permissões"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center justify-center space-y-2 mb-6 pb-2 border-b border-slate-800/50">
          <div 
            className="relative group cursor-pointer" 
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-slate-800 group-hover:border-cyan-500 transition-all shadow-xl shadow-black/40">
              <img
                src={avatar}
                alt="Avatar Preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
              <Image className="h-6 w-6 text-white mb-1" />
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Alterar Foto</span>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-slate-500 font-medium italic">Selecione qualquer imagem para o perfil</p>
            {avatar !== 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' && (
              <button
                type="button"
                onClick={() => setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')}
                className="flex items-center gap-1 text-[10px] font-bold text-rose-400 hover:text-rose-300 transition"
              >
                <X className="h-3 w-3" />
                <span>Remover Foto</span>
              </button>
            )}
          </div>
        </div>

        {isLocked && (
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-200">CONTA BLOQUEADA</p>
                <p className="text-[10px] text-rose-400/80">Esta conta está temporariamente bloqueada por excesso de tentativas.</p>
              </div>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => employeeToEdit && unlockUser(employeeToEdit.id)}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-2xs font-bold text-white hover:bg-rose-500 transition"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>Desbloquear Agora</span>
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Ana Clara Santos"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">E-mail de Login *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ex: ana.vendas@igyncell.com.br"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Senha de Acesso *</label>
            <input
              type="text"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Telefone / WhatsApp</label>
            <input
              type="text"
              maxLength={15}
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              placeholder="(73) 90000-0000"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Status da Conta</label>
            <select
              value={status}
              disabled={!isAdmin}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="active">Ativo (Permitido Acesso)</option>
              <option value="inactive">Inativo (Bloqueado)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Cargo / Nível de Acesso *</label>
            <select
              value={role}
              disabled={!isAdmin}
              onChange={e => handleRoleChange(e.target.value as UserRole)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-cyan-400 font-bold outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="admin">Administrador (Acesso Completo)</option>
              <option value="manager">Gerente (Vendas, Estoque, OS, Finanças)</option>
              <option value="technician">Técnico (Ordens de Serviço, Peças, Clientes)</option>
              <option value="seller">Vendedor (Vendas, Clientes, Suas Comissões)</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Título / Função Exibida</label>
            <input
              type="text"
              value={roleLabel}
              disabled={!isAdmin}
              onChange={e => setRoleLabel(e.target.value)}
              placeholder="Ex: Consultor Especialista Apple"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">
              Comissão sobre Vendas de Balcão (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={commissionRateSales}
              disabled={!isAdmin}
              onChange={e => setCommissionRateSales(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-emerald-400 font-bold outline-none focus:border-cyan-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">
              Comissão sobre Mão de Obra de OS (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={commissionRateTech}
              disabled={!isAdmin}
              onChange={e => setCommissionRateTech(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-cyan-400 font-bold outline-none focus:border-cyan-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Two-Factor Authentication (2FA) Section */}
        {employeeToEdit && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className={`h-5 w-5 ${employeeToEdit.twoFactorEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Autenticação de Dois Fatores (2FA)</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {employeeToEdit.twoFactorEnabled ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ATIVADO
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        DESATIVADO
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!employeeToEdit.twoFactorEnabled ? (
                !isSettingUp2FA ? (
                  <button
                    type="button"
                    onClick={handleStartSetup2FA}
                    className="rounded-lg bg-cyan-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-cyan-500 transition"
                  >
                    Ativar 2FA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSettingUp2FA(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold text-rose-400 hover:bg-rose-500/20 transition"
                >
                  Desativar 2FA
                </button>
              )}
            </div>

            {isSettingUp2FA && (
              <div className="bg-slate-950/80 p-5 rounded-xl border border-cyan-500/20 space-y-5 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="bg-white p-2 rounded-lg shrink-0 shadow-lg">
                    <QRCodeSVG value={qrCodeUri} size={130} level="M" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-2xs font-bold text-white mb-1">1. Escaneie o código</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Abra o Google Authenticator ou similar e aponte a câmera.
                      </p>
                    </div>

                    <div>
                      <p className="text-2xs font-bold text-white mb-1">2. Ou digite a chave manual</p>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-cyan-400 font-bold tracking-widest text-center">
                        {twoFactorSecret}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <p className="text-2xs font-bold text-white">3. Confirme a ativação</p>
                  <p className="text-[10px] text-slate-400">
                    Digite o código de 6 dígitos exibido no seu aplicativo autenticador:
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={confirmationCode}
                      onChange={e => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000 000"
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-mono font-bold tracking-[0.3em] text-center text-white outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      disabled={confirmationCode.length < 6 || isConfirming2FA}
                      onClick={handleConfirmActivation}
                      className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition disabled:opacity-40"
                    >
                      {isConfirming2FA ? 'Validando...' : 'Confirmar e Ativar'}
                    </button>
                  </div>
                  {twoFactorError && (
                    <p className="text-[10px] font-bold text-rose-400">{twoFactorError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Permitted Modules Checklist */}
        {isAdmin && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-400">
              Módulos Permitidos no Menu Lateral
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-2xs text-slate-300">
              {allTabs.map(tab => (
                <label key={tab.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedTabs.includes(tab.id)}
                    onChange={() => toggleTabPermission(tab.id)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                  />
                  <span>{tab.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions & Confirmation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div>
            {canDelete && (
              !isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition active:scale-95"
                  title="Excluir este colaborador do sistema"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>Excluir Colaborador</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/60 bg-rose-950/40 p-1.5 text-xs">
                  <div className="flex items-center gap-1 text-2xs font-semibold text-rose-200 px-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span>Confirmar exclusão?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-2xs font-bold text-white hover:bg-rose-500 transition shadow-sm"
                  >
                    <Check className="h-3 w-3" />
                    <span>Sim, Excluir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-2xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                  >
                    Cancelar
                  </button>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950 hover:from-cyan-500 hover:to-blue-500 transition active:scale-95"
            >
              {employeeToEdit ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
