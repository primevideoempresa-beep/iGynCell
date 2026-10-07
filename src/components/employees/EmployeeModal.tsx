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
  QrCode,
  Copy,
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
  const { currentUser, isRole, unlockUser } = useAuth();

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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

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
      setTwoFactorEnabled(!!employeeToEdit.twoFactorEnabled);
      setTwoFactorSecret(employeeToEdit.twoFactorSecret || '');
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
      setTwoFactorEnabled(false);
      setTwoFactorSecret('');
    }
  }, [employeeToEdit, isOpen]);

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTwoFactorSecret(secret);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(twoFactorSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const otpAuthUri = `otpauth://totp/iGynCell:${email || 'colaborador'}?secret=${twoFactorSecret}&issuer=iGynCell`;

  const handleDelete = () => {
    if (!employeeToEdit) return;
    if (currentUser?.id === employeeToEdit.id) {
      alert('Você não pode excluir o colaborador atualmente conectado na sessão.');
      return;
    }
    deleteEmployee(employeeToEdit.id);
    onClose();
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
        allowedTabs,
        twoFactorEnabled,
        twoFactorSecret
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
        allowedTabs,
        twoFactorEnabled,
        twoFactorSecret
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Segurança: Autenticação de 2 Fatores (2FA)</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={twoFactorEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setTwoFactorEnabled(enabled);
                  if (enabled && !twoFactorSecret) {
                    generateSecret();
                  }
                }}
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              <span className="ml-2 text-2xs font-medium text-slate-400">{twoFactorEnabled ? 'Ativado' : 'Desativado'}</span>
            </label>
          </div>

          {twoFactorEnabled && (
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/80 p-4 rounded-xl border border-slate-800/50">
              <div className="bg-white p-2 rounded-lg shrink-0">
                <QRCodeSVG 
                  value={otpAuthUri} 
                  size={120}
                  level="H"
                  includeMargin={false}
                />
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-2xs font-bold text-white mb-1">Passo 1: Escaneie o QR Code</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Use o Google Authenticator ou similar para escanear a imagem ao lado.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-2xs font-bold text-white">Passo 2: Ou use a Chave de Configuração</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-xs text-cyan-400 font-bold tracking-widest truncate">
                      {twoFactorSecret}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Copiar chave"
                    >
                      {copiedSecret ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Insira esta chave manualmente no app se não conseguir escanear o QR Code.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

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
