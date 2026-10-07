import { OSStatus, UserRole } from '../types';

export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return dateString;
  }
};

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
};

export const formatCpfCnpj = (val: string): string => {
  if (!val) return '';
  const cleaned = val.replace(/\D/g, '').slice(0, 14);
  if (cleaned.length === 0) return '';
  
  // Format as CPF (up to 11 digits)
  if (cleaned.length <= 11) {
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  
  // Format as CNPJ (12 to 14 digits)
  if (cleaned.length <= 12) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  }
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
};

export const getOSStatusInfo = (status: OSStatus): { label: string; bgClass: string; textClass: string; dotClass: string } => {
  switch (status) {
    case 'open':
      return {
        label: 'Aberta',
        bgClass: 'bg-amber-500/10 border-amber-500/30',
        textClass: 'text-amber-400',
        dotClass: 'bg-amber-400'
      };
    case 'in_progress':
      return {
        label: 'Em Andamento',
        bgClass: 'bg-sky-500/10 border-sky-500/30',
        textClass: 'text-sky-400',
        dotClass: 'bg-sky-400'
      };
    case 'waiting_parts':
      return {
        label: 'Aguardando Peça',
        bgClass: 'bg-purple-500/10 border-purple-500/30',
        textClass: 'text-purple-400',
        dotClass: 'bg-purple-400'
      };
    case 'completed':
      return {
        label: 'Concluída',
        bgClass: 'bg-emerald-500/10 border-emerald-500/30',
        textClass: 'text-emerald-400',
        dotClass: 'bg-emerald-400'
      };
    case 'delivered':
      return {
        label: 'Entregue',
        bgClass: 'bg-teal-500/10 border-teal-500/30',
        textClass: 'text-teal-400',
        dotClass: 'bg-teal-400'
      };
    case 'cancelled':
      return {
        label: 'Cancelada',
        bgClass: 'bg-rose-500/10 border-rose-500/30',
        textClass: 'text-rose-400',
        dotClass: 'bg-rose-400'
      };
    default:
      return {
        label: status,
        bgClass: 'bg-slate-500/10 border-slate-500/30',
        textClass: 'text-slate-400',
        dotClass: 'bg-slate-400'
      };
  }
};

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'manager':
      return 'Gerente';
    case 'seller':
      return 'Vendedor';
    case 'technician':
      return 'Técnico';
    default:
      return role;
  }
};
