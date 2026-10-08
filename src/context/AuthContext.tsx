import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Employee, UserRole, ViewTab, AuditLog } from '../types';
import { initialEmployees } from '../data/initialData';
import * as OTPAuth from 'otpauth';
import { getApiBaseUrl, apiSetup2FA, apiConfirm2FA, apiDisable2FA } from '../services/api';

export interface LoginResult {
  success: boolean;
  requires2FA?: boolean;
  error?: string;
  user?: Employee;
}

interface AuthContextType {
  currentUser: Employee | null;
  employees: Employee[];
  sessionToken: string | null;
  isAwaiting2FA: boolean;
  pendingUser2FA: Employee | null;
  login: (email: string, pass: string, twoFactorCode?: string) => Promise<LoginResult>;
  verify2FA: (code: string) => Promise<boolean>;
  cancel2FA: () => void;
  switchUser: (id: string) => void;
  logout: () => void;
  hasPermission: (tab: ViewTab) => boolean;
  isRole: (roles: UserRole[]) => boolean;
  updateEmployeeList: (emps: Employee[]) => void;
  logSecurityEvent: (action: AuditLog['action'], entity: AuditLog['entity'], entityId?: string, details?: string) => void;
  auditLogs: AuditLog[];
  fetchAuditLogs: () => Promise<AuditLog[]>;
  toggle2FAForUser: (userId: string, enabled: boolean) => void;
  setup2FA: (userId: string) => Promise<{ secret: string; qrCodeUri: string }>;
  confirm2FA: (userId: string, secret: string, code: string) => Promise<boolean>;
  disable2FA: (userId: string) => Promise<boolean>;
  unlockUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'igyn_cell_current_user_id';
const EMPLOYEES_STORAGE_KEY = 'igyn_cell_employees';
const SESSION_TOKEN_KEY = 'igyn_cell_session_token';

// Role-Based Access Control (RBAC) Master Matrix
const ROLE_PERMISSIONS: Record<UserRole, ViewTab[]> = {
  admin: [
    'dashboard',
    'employees',
    'orders',
    'sales',
    'inventory',
    'parts',
    'clients',
    'financial',
    'commissions',
    'notifications',
    'audit',
    'settings'
  ],
  manager: [
    'dashboard',
    'employees',
    'orders',
    'sales',
    'inventory',
    'parts',
    'clients',
    'financial',
    'commissions',
    'notifications',
    'audit'
  ],
  seller: [
    'dashboard',
    'sales',
    'inventory',
    'clients',
    'commissions',
    'notifications'
  ],
  technician: [
    'dashboard',
    'orders',
    'parts',
    'clients',
    'notifications'
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse employees from storage', e);
    }
    return initialEmployees.map((e, idx) => ({
      ...e,
      twoFactorEnabled: idx === 0, // Admin has 2FA enabled
      failedLoginAttempts: 0
    }));
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedId) {
        return savedId;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [isAwaiting2FA, setIsAwaiting2FA] = useState<boolean>(false);
  const [pendingUser2FA, setPendingUser2FA] = useState<Employee | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Current active user derived from ID
  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    const found = employees.find(e => e.id === currentUserId && e.status === 'active');
    return found || null;
  }, [employees, currentUserId]);

  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(AUTH_STORAGE_KEY, currentUserId);
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUserId]);

  useEffect(() => {
    try {
      if (sessionToken) {
        localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
      } else {
        localStorage.removeItem(SESSION_TOKEN_KEY);
      }
    } catch {
      // ignore
    }
  }, [sessionToken]);

  const updateEmployeeList = useCallback((newEmps: Employee[]) => {
    setEmployees(newEmps);
    try {
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(newEmps));
    } catch {
      // ignore
    }
  }, []);

  const logSecurityEvent = useCallback((
    action: AuditLog['action'],
    entity: AuditLog['entity'],
    entityId?: string,
    details?: string
  ) => {
    const user = currentUser;
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user?.id || 'system',
      userName: user?.name || 'Sistema',
      userRole: user?.role || 'seller',
      action,
      entity,
      entityId,
      details: details || `Ação ${action} em ${entity}`,
      ipAddress: '192.168.1.100',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'Browser',
      createdAt: new Date().toISOString()
    };

    setAuditLogs(prev => [newLog, ...prev]);

    // Send to backend
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(() => {});
  }, [currentUser]);

  const fetchAuditLogs = useCallback(async (): Promise<AuditLog[]> => {
    try {
      const res = await fetch('/api/audit', {
        headers: {
          'X-User-Role': currentUser?.role || 'admin',
          'X-User-Id': currentUser?.id || 'emp-1'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
        return data;
      }
    } catch (e) {
      console.warn('Falha ao buscar audit logs:', e);
    }
    return auditLogs;
  }, [currentUser, auditLogs]);

  const login = useCallback(async (email: string, pass: string, twoFactorCode?: string): Promise<LoginResult> => {
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/auth.php?action=login`
      : `${baseUrl}/auth/login`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, twoFactorCode })
      });

      const data = await response.json();

      if (data.success) {
        setSessionToken(data.token);
        setCurrentUserId(data.user.id);
        setIsAwaiting2FA(false);
        setPendingUser2FA(null);
        return { success: true, user: data.user };
      } else if (data.requires2FA) {
        setPendingUser2FA(data.user || employees.find(e => e.id === data.userId) || null);
        setIsAwaiting2FA(true);
        return { success: false, requires2FA: true };
      } else {
        return { success: false, error: data.error || 'Erro ao realizar login.' };
      }
    } catch (err: any) {
      // Fallback local if backend fails and not configured
      console.warn('Backend login failed, using local fallback:', err);
      
      const trimmedEmail = email.trim().toLowerCase();
      const user = employees.find(
        e => e.email.toLowerCase() === trimmedEmail && e.status === 'active'
      );

      if (!user) return { success: false, error: 'Credenciais inválidas.' };
      if (user.password !== pass) return { success: false, error: 'Senha incorreta.' };

      const requires2FA = user.twoFactorEnabled || user.role === 'admin';
      if (requires2FA && !twoFactorCode) {
        setPendingUser2FA(user);
        setIsAwaiting2FA(true);
        return { success: false, requires2FA: true, user };
      }

      setSessionToken(`local_token_${user.id}`);
      setCurrentUserId(user.id);
      return { success: true, user };
    }
  }, [employees]);

  const verify2FA = useCallback(async (code: string): Promise<boolean> => {
    if (!pendingUser2FA) return false;
    
    const result = await login(pendingUser2FA.email, pendingUser2FA.password || '123456', code);
    return result.success;
  }, [pendingUser2FA, login]);

  const cancel2FA = useCallback(() => {
    setIsAwaiting2FA(false);
    setPendingUser2FA(null);
  }, []);

  const switchUser = useCallback((id: string) => {
    const user = employees.find(e => e.id === id);
    if (user && user.status === 'active') {
      setCurrentUserId(user.id);
      setSessionToken(`token_switched_${user.id}`);
      logSecurityEvent('LOGIN', 'Auth', user.id, `Alternância de perfil para ${user.name} (${user.roleLabel})`);
    }
  }, [employees, logSecurityEvent]);

  const logout = useCallback(() => {
    if (currentUser) {
      logSecurityEvent('LOGOUT', 'Auth', currentUser.id, `Logout do usuário ${currentUser.name}`);
    }
    setCurrentUserId(null);
    setSessionToken(null);
    setIsAwaiting2FA(false);
    setPendingUser2FA(null);
  }, [currentUser, logSecurityEvent]);

  const toggle2FAForUser = useCallback((userId: string, enabled: boolean) => {
    const user = employees.find(e => e.id === userId);
    if (!user) return;

    const updated = employees.map(e => (e.id === userId ? { ...e, twoFactorEnabled: enabled } : e));
    updateEmployeeList(updated);
    logSecurityEvent('UPDATE', 'Employee', userId, `Autenticação em Dois Fatores (2FA) ${enabled ? 'ativada' : 'desativada'} para o colaborador.`);

    // Persist to backend
    fetch(`/api/employees/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twoFactorEnabled: enabled })
    }).catch(err => console.error('Failed to update 2FA status on backend', err));
  }, [employees, logSecurityEvent, updateEmployeeList]);

  const setup2FA = useCallback(async (userId: string) => {
    const res = await apiSetup2FA(userId);
    if (res.success && res.secret && res.qrCodeUri) {
      return { secret: res.secret, qrCodeUri: res.qrCodeUri };
    }
    throw new Error(res.error || 'Erro ao iniciar setup 2FA');
  }, []);

  const confirm2FA = useCallback(async (userId: string, secret: string, code: string) => {
    const res = await apiConfirm2FA(userId, secret, code);
    if (res.success) {
      // Atualizar lista local de colaboradores para refletir que 2FA está ativo
      const updated = employees.map(e => (e.id === userId ? { ...e, twoFactorEnabled: true, twoFactorSecret: secret } : e));
      updateEmployeeList(updated);
      return true;
    }
    return false;
  }, [employees, updateEmployeeList]);

  const disable2FA = useCallback(async (userId: string) => {
    const res = await apiDisable2FA(userId);
    if (res.success) {
      const updated = employees.map(e => (e.id === userId ? { ...e, twoFactorEnabled: false, twoFactorSecret: undefined } : e));
      updateEmployeeList(updated);
      return true;
    }
    return false;
  }, [employees, updateEmployeeList]);

  const unlockUser = useCallback((userId: string) => {
    const updated = employees.map(e => 
      e.id === userId ? { ...e, failedLoginAttempts: 0, lockoutUntil: undefined } : e
    );
    updateEmployeeList(updated);
    logSecurityEvent('STATUS_CHANGE', 'Employee', userId, `Conta desbloqueada manualmente.`);
  }, [employees, logSecurityEvent, updateEmployeeList]);

  // Strict RBAC Enforcement
  const hasPermission = useCallback((tab: ViewTab): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    // Check against strict role permission matrix
    const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
    return allowed.includes(tab);
  }, [currentUser]);

  const isRole = useCallback((roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        employees,
        sessionToken,
        isAwaiting2FA,
        pendingUser2FA,
        login,
        verify2FA,
        cancel2FA,
        switchUser,
        logout,
        hasPermission,
        isRole,
        updateEmployeeList,
        logSecurityEvent,
        auditLogs,
        fetchAuditLogs,
        toggle2FAForUser,
        setup2FA,
        confirm2FA,
        disable2FA,
        unlockUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

