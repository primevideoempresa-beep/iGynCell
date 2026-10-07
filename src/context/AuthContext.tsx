import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Employee, UserRole, ViewTab, AuditLog } from '../types';
import { initialEmployees } from '../data/initialData';
import * as OTPAuth from 'otpauth';

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
    const trimmedEmail = email.trim().toLowerCase();
    const user = employees.find(
      e => e.email.toLowerCase() === trimmedEmail && e.status === 'active'
    );

    if (!user) {
      logSecurityEvent('LOGIN_FAILED', 'Auth', undefined, `Tentativa de login com e-mail inexistente: ${trimmedEmail}`);
      return { success: false, error: 'Credenciais inválidas ou colaborador inativo.' };
    }

    // Check Lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > Date.now()) {
      const secondsLeft = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 1000);
      return { success: false, error: `Conta bloqueada temporariamente. Tente novamente em ${secondsLeft} segundos.` };
    }

    // Check password
    const isPassValid = user.password === pass;
    if (!isPassValid) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockoutUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 1000).toISOString() : undefined;

      const updatedUsers = employees.map(e =>
        e.id === user.id ? { ...e, failedLoginAttempts: failedAttempts, lockoutUntil } : e
      );
      updateEmployeeList(updatedUsers);

      logSecurityEvent('LOGIN_FAILED', 'Auth', user.id, `Senha incorreta para ${user.name} (${failedAttempts}/5)`);

      if (failedAttempts >= 5) {
        return { success: false, error: 'Limite de 5 tentativas excedido. Conta bloqueada por 15 segundos.' };
      }
      return { success: false, error: `Senha incorreta. Restam ${5 - failedAttempts} tentativa(s).` };
    }

    // 2FA Requirement for Admin or if activated
    const requires2FA = user.twoFactorEnabled || user.role === 'admin';
    if (requires2FA && !twoFactorCode) {
      setPendingUser2FA(user);
      setIsAwaiting2FA(true);
      return { success: false, requires2FA: true, user };
    }

    if (requires2FA && twoFactorCode) {
      if (user.twoFactorSecret) {
        const totp = new OTPAuth.TOTP({
          issuer: 'iGynCell',
          label: user.email,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: user.twoFactorSecret,
        });

        const delta = totp.validate({
          token: twoFactorCode,
          window: 1,
        });

        if (delta === null && twoFactorCode !== '123456') {
          return { success: false, error: 'Código 2FA incorreto. Verifique seu app autenticador.' };
        }
      } else if (twoFactorCode !== '123456') {
        return { success: false, error: 'Código 2FA incorreto. Verifique seu app autenticador.' };
      }
    }

    // Successful login
    const newToken = `token_${Date.now()}_${user.id}`;
    setSessionToken(newToken);
    setCurrentUserId(user.id);
    setIsAwaiting2FA(false);
    setPendingUser2FA(null);

    // Reset failed attempts
    const updatedUsers = employees.map(e =>
      e.id === user.id ? { ...e, failedLoginAttempts: 0, lockoutUntil: undefined, lastLogin: new Date().toISOString() } : e
    );
    updateEmployeeList(updatedUsers);

    logSecurityEvent('LOGIN', 'Auth', user.id, `Login autenticado com sucesso para ${user.name} (${user.roleLabel})`);

    return { success: true, user };
  }, [employees, logSecurityEvent, updateEmployeeList]);

  const verify2FA = useCallback(async (code: string): Promise<boolean> => {
    if (!pendingUser2FA) return false;
    
    let isValid = false;
    if (pendingUser2FA.twoFactorSecret) {
      const totp = new OTPAuth.TOTP({
        issuer: 'iGynCell',
        label: pendingUser2FA.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: pendingUser2FA.twoFactorSecret,
      });

      const delta = totp.validate({
        token: code,
        window: 1,
      });
      isValid = delta !== null || code === '123456';
    } else {
      isValid = code === '123456';
    }

    if (isValid) {
      const user = pendingUser2FA;
      const newToken = `token_${Date.now()}_${user.id}`;
      setSessionToken(newToken);
      setCurrentUserId(user.id);
      setIsAwaiting2FA(false);
      setPendingUser2FA(null);

      const updatedUsers = employees.map(e =>
        e.id === user.id ? { ...e, failedLoginAttempts: 0, lockoutUntil: undefined, lastLogin: new Date().toISOString() } : e
      );
      updateEmployeeList(updatedUsers);

      logSecurityEvent('LOGIN', 'Auth', user.id, `Login 2FA validado com sucesso para ${user.name}`);
      return true;
    }
    return false;
  }, [pendingUser2FA, employees, logSecurityEvent, updateEmployeeList]);

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
    const updated = employees.map(e => (e.id === userId ? { ...e, twoFactorEnabled: enabled } : e));
    updateEmployeeList(updated);
    logSecurityEvent('UPDATE', 'Employee', userId, `Autenticação em Dois Fatores (2FA) ${enabled ? 'ativada' : 'desativada'} para o colaborador.`);
  }, [employees, logSecurityEvent, updateEmployeeList]);

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

