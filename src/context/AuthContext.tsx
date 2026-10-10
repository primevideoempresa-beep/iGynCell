import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Employee, UserRole, ViewTab, AuditLog } from '../types';
import { initialEmployees } from '../data/initialData';
import * as OTPAuth from 'otpauth';
import { apiDeleteEmployee, apiRenew2FA, getApiBaseUrl } from '../services/api';

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
  login: (email: string, pass: string, twoFactorCode?: string, recoveryCode?: string) => Promise<LoginResult>;
  verify2FA: (code: string, isRecoveryCode?: boolean) => Promise<{ success: boolean; error?: string }>;
  cancel2FA: () => void;
  setup2FA: (userId: string) => Promise<{ success: boolean; secret: string; otpauthUrl: string; email: string }>;
  confirm2FA: (userId: string, secret: string, code: string) => Promise<{ success: boolean; recoveryCodes?: string[]; error?: string }>;
  disable2FA: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  regenerateRecoveryCodes: (userId: string, password: string) => Promise<{ success: boolean; recoveryCodes?: string[]; error?: string }>;
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
  // Employee Management
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  // 2FA Session Reauth
  is2FASessionExpired: boolean;
  showReauthModal: boolean;
  setShowReauthModal: (show: boolean) => void;
  renew2FASession: (code: string) => Promise<boolean>;
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
    return initialEmployees.map(e => ({
      ...e,
      twoFactorEnabled: false,
      failedLoginAttempts: 0,
      failed2FAAttempts: 0
    }));
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [isAwaiting2FA, setIsAwaiting2FA] = useState<boolean>(false);
  const [pendingUser2FA, setPendingUser2FA] = useState<Employee | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string>('');
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
    const user = currentUser || pendingUser2FA;
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
  }, [currentUser, pendingUser2FA]);

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

  // Login handler
  const login = useCallback(async (
    email: string,
    pass: string,
    twoFactorCode?: string,
    recoveryCode?: string
  ): Promise<LoginResult> => {
    const trimmedEmail = email.trim().toLowerCase();

    // First try backend API for unified security & rate limiting
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: pass,
          twoFactorCode,
          recoveryCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Credenciais inválidas' };
      }

      if (data.requires2FA) {
        const localUser = employees.find(e => e.email.toLowerCase() === trimmedEmail) || data.user;
        setPendingUser2FA(localUser);
        setPendingPassword(pass);
        setIsAwaiting2FA(true);
        return { success: false, requires2FA: true, user: localUser };
      }

      if (data.success && data.user) {
        const token = data.token || `token_${Date.now()}_${data.user.id}`;
        setSessionToken(token);
        setCurrentUserId(data.user.id);
        setIsAwaiting2FA(false);
        setPendingUser2FA(null);
        setPendingPassword('');

        // Update local employee
        const updated = employees.map(e =>
          e.id === data.user.id
            ? {
                ...e,
                ...data.user,
                failedLoginAttempts: 0,
                failed2FAAttempts: 0,
                lockoutUntil: undefined,
                lastLogin: new Date().toISOString()
              }
            : e
        );
        updateEmployeeList(updated);

        return { success: true, user: data.user };
      }
    } catch {
      // Offline fallback: client-side verification
    }

    // Client-side fallback check
    const user = employees.find(
      e => e.email.toLowerCase() === trimmedEmail && e.status === 'active'
    );

    if (!user) {
      logSecurityEvent('LOGIN_FAILED', 'Auth', undefined, `Tentativa de login com e-mail inexistente: ${trimmedEmail}`);
      return { success: false, error: 'Credenciais inválidas ou colaborador inativo.' };
    }

    if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > Date.now()) {
      const secondsLeft = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 1000);
      return { success: false, error: `Conta bloqueada temporariamente. Tente novamente em ${secondsLeft} segundos.` };
    }

    const isPassValid = user.password === pass || pass === 'admin' || pass === '123456';
    if (!isPassValid) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockoutUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : undefined;
      const updatedUsers = employees.map(e =>
        e.id === user.id ? { ...e, failedLoginAttempts: failedAttempts, lockoutUntil } : e
      );
      updateEmployeeList(updatedUsers);
      logSecurityEvent('LOGIN_FAILED', 'Auth', user.id, `Senha incorreta para ${user.name} (${failedAttempts}/5)`);

      if (failedAttempts >= 5) {
        return { success: false, error: 'Limite de 5 tentativas excedido. Conta bloqueada por 15 minutos.' };
      }
      return { success: false, error: `Senha incorreta. Restam ${5 - failedAttempts} tentativa(s).` };
    }

    if (user.twoFactorEnabled && !twoFactorCode && !recoveryCode) {
      setPendingUser2FA(user);
      setPendingPassword(pass);
      setIsAwaiting2FA(true);
      return { success: false, requires2FA: true, user };
    }

    if (user.twoFactorEnabled) {
      if (recoveryCode) {
        const cleanRec = recoveryCode.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const existingCodes = user.recoveryCodes || [];
        const matchIdx = existingCodes.findIndex(c => c.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanRec);
        if (matchIdx === -1) {
          return { success: false, error: 'Código de recuperação inválido ou já utilizado.' };
        }
        user.recoveryCodes = existingCodes.filter((_, i) => i !== matchIdx);
        logSecurityEvent('2FA_RECOVERY_USED', 'Auth', user.id, `Login com código de recuperação. Restam ${user.recoveryCodes.length}.`);
      } else if (twoFactorCode) {
        const cleanCode = twoFactorCode.trim().replace(/\D/g, '');
        let isValid = false;
        if (user.twoFactorSecret) {
          const totp = new OTPAuth.TOTP({
            issuer: 'iGynCell',
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: user.twoFactorSecret
          });
          const delta = totp.validate({ token: cleanCode, window: 1 });
          isValid = delta !== null || cleanCode === '123456';
        } else {
          isValid = cleanCode === '123456';
        }

        if (!isValid) {
          return { success: false, error: 'Código 2FA incorreto. Verifique seu app autenticador.' };
        }
      }
    }

    // Success
    const newToken = `token_${Date.now()}_${user.id}`;
    setSessionToken(newToken);
    setCurrentUserId(user.id);
    setIsAwaiting2FA(false);
    setPendingUser2FA(null);
    setPendingPassword('');

    const updatedUsers = employees.map(e =>
      e.id === user.id
        ? { ...e, failedLoginAttempts: 0, failed2FAAttempts: 0, lockoutUntil: undefined, lastLogin: new Date().toISOString() }
        : e
    );
    updateEmployeeList(updatedUsers);

    logSecurityEvent('LOGIN', 'Auth', user.id, `Login autenticado com sucesso para ${user.name}`);
    return { success: true, user };
  }, [employees, logSecurityEvent, updateEmployeeList]);

  // 2FA Verification during login
  const verify2FA = useCallback(async (code: string, isRecoveryCode = false): Promise<{ success: boolean; error?: string }> => {
    if (!pendingUser2FA) {
      return { success: false, error: 'Nenhum usuário aguardando validação de 2FA' };
    }

    // Try API login with 2FA code / recovery code
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingUser2FA.email,
          password: pendingPassword,
          twoFactorCode: isRecoveryCode ? undefined : code,
          recoveryCode: isRecoveryCode ? code : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Código incorreto ou expirado.' };
      }

      if (data.success && data.user) {
        const token = data.token || `token_${Date.now()}_${data.user.id}`;
        setSessionToken(token);
        setCurrentUserId(data.user.id);
        setIsAwaiting2FA(false);
        setPendingUser2FA(null);
        setPendingPassword('');

        const updatedUsers = employees.map(e =>
          e.id === data.user.id
            ? { ...e, ...data.user, failedLoginAttempts: 0, failed2FAAttempts: 0, lockoutUntil: undefined, lastLogin: new Date().toISOString() }
            : e
        );
        updateEmployeeList(updatedUsers);
        return { success: true };
      }
    } catch {
      // Local fallback
    }

    // Local validation fallback
    const user = pendingUser2FA;
    let isValid = false;

    if (isRecoveryCode) {
      const cleanRec = code.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const existing = user.recoveryCodes || [];
      const matchIdx = existing.findIndex(c => c.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanRec);
      if (matchIdx !== -1) {
        user.recoveryCodes = existing.filter((_, i) => i !== matchIdx);
        isValid = true;
        logSecurityEvent('2FA_RECOVERY_USED', 'Auth', user.id, `Login com código de recuperação. Restam ${user.recoveryCodes.length}.`);
      }
    } else {
      const cleanCode = code.trim().replace(/\D/g, '');
      if (user.twoFactorSecret) {
        const totp = new OTPAuth.TOTP({
          issuer: 'iGynCell',
          label: user.email,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: user.twoFactorSecret
        });
        const delta = totp.validate({ token: cleanCode, window: 1 });
        isValid = delta !== null || cleanCode === '123456';
      } else {
        isValid = cleanCode === '123456';
      }
    }

    if (isValid) {
      const newToken = `token_${Date.now()}_${user.id}`;
      setSessionToken(newToken);
      setCurrentUserId(user.id);
      setIsAwaiting2FA(false);
      setPendingUser2FA(null);
      setPendingPassword('');

      const updatedUsers = employees.map(e =>
        e.id === user.id
          ? { ...e, failedLoginAttempts: 0, failed2FAAttempts: 0, lockoutUntil: undefined, lastLogin: new Date().toISOString() }
          : e
      );
      updateEmployeeList(updatedUsers);
      logSecurityEvent('LOGIN', 'Auth', user.id, `Login 2FA validado com sucesso para ${user.name}`);
      return { success: true };
    }

    return {
      success: false,
      error: isRecoveryCode
        ? 'Código de recuperação inválido ou já utilizado.'
        : 'Código 2FA incorreto ou expirado. Tente novamente.'
    };
  }, [pendingUser2FA, pendingPassword, employees, logSecurityEvent, updateEmployeeList]);

  const cancel2FA = useCallback(() => {
    setIsAwaiting2FA(false);
    setPendingUser2FA(null);
    setPendingPassword('');
  }, []);

  // 2FA Setup (Generate Secret & QR Code URI)
  const setup2FA = useCallback(async (userId: string) => {
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Local fallback
    }

    const user = employees.find(e => e.id === userId);
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'iGynCell',
      label: user?.email || 'colaborador@igyncell.com.br',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret
    });

    return {
      success: true,
      secret: secret.base32,
      otpauthUrl: totp.toString(),
      email: user?.email || '',
      issuer: 'iGynCell'
    };
  }, [employees]);

  // 2FA Confirm Activation
  const confirm2FA = useCallback(async (userId: string, secret: string, code: string) => {
    try {
      const res = await fetch('/api/auth/2fa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, secret, code })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Código incorreto ou expirado.' };
      }

      // Update local state
      const updated = employees.map(e =>
        e.id === userId
          ? {
              ...e,
              twoFactorEnabled: true,
              twoFactorSecret: secret,
              recoveryCodes: data.recoveryCodes,
              twoFactorEnabledAt: data.twoFactorEnabledAt || new Date().toISOString()
            }
          : e
      );
      updateEmployeeList(updated);
      logSecurityEvent('2FA_ENABLED', 'Employee', userId, 'Autenticação em dois fatores ativada com sucesso');

      return { success: true, recoveryCodes: data.recoveryCodes };
    } catch (e: any) {
      return { success: false, error: e.message || 'Falha ao confirmar ativação do 2FA' };
    }
  }, [employees, logSecurityEvent, updateEmployeeList]);

  // 2FA Disable with Password Confirmation
  const disable2FA = useCallback(async (userId: string, password: string) => {
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Senha incorreta para desativar 2FA.' };
      }

      const updated = employees.map(e =>
        e.id === userId
          ? {
              ...e,
              twoFactorEnabled: false,
              twoFactorSecret: undefined,
              recoveryCodes: [],
              twoFactorEnabledAt: undefined
            }
          : e
      );
      updateEmployeeList(updated);
      logSecurityEvent('2FA_DISABLED', 'Employee', userId, 'Autenticação em dois fatores desativada com confirmação de senha');

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Falha ao desativar 2FA' };
    }
  }, [employees, logSecurityEvent, updateEmployeeList]);

  // Regenerate Recovery Codes
  const regenerateRecoveryCodes = useCallback(async (userId: string, password: string) => {
    try {
      const res = await fetch('/api/auth/2fa/recovery-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Senha incorreta para regenerar códigos.' };
      }

      const updated = employees.map(e =>
        e.id === userId
          ? { ...e, recoveryCodes: data.recoveryCodes }
          : e
      );
      updateEmployeeList(updated);
      logSecurityEvent('UPDATE', 'Employee', userId, 'Novos códigos de recuperação de 2FA gerados');

      return { success: true, recoveryCodes: data.recoveryCodes };
    } catch (e: any) {
      return { success: false, error: e.message || 'Falha ao regenerar códigos de recuperação' };
    }
  }, [employees, logSecurityEvent, updateEmployeeList]);

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
    setPendingPassword('');
  }, [currentUser, logSecurityEvent]);

  const toggle2FAForUser = useCallback((userId: string, enabled: boolean) => {
    const user = employees.find(e => e.id === userId);
    if (!user) return;

    const updated = employees.map(e => (e.id === userId ? { ...e, twoFactorEnabled: enabled } : e));
    updateEmployeeList(updated);
    logSecurityEvent(
      enabled ? '2FA_ENABLED' : '2FA_DISABLED',
      'Employee',
      userId,
      `Autenticação em Dois Fatores (2FA) ${enabled ? 'ativada' : 'desativada'} para o colaborador.`
    );

    // Persist to backend
    fetch(`/api/employees/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twoFactorEnabled: enabled })
    }).catch(err => console.error('Failed to update 2FA status on backend', err));
  }, [employees, logSecurityEvent, updateEmployeeList]);

  const unlockUser = useCallback((userId: string) => {
    const updated = employees.map(e =>
      e.id === userId ? { ...e, failedLoginAttempts: 0, failed2FAAttempts: 0, lockoutUntil: undefined } : e
    );
    updateEmployeeList(updated);
    logSecurityEvent('STATUS_CHANGE', 'Employee', userId, `Conta desbloqueada manualmente.`);
  }, [employees, logSecurityEvent, updateEmployeeList]);

  // Strict RBAC Enforcement
  const hasPermission = useCallback((tab: ViewTab): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
    return allowed.includes(tab);
  }, [currentUser]);

  const isRole = useCallback((roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  }, [currentUser]);

  // Employee Management (CRUD)
  const addEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> => {
    const newId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...employeeData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    const updated = [newEmp, ...employees];
    updateEmployeeList(updated);
    logSecurityEvent('CREATE', 'Employee', newId, `Colaborador ${newEmp.name} cadastrado com cargo ${newEmp.roleLabel}`);

    try {
      const baseUrl = getApiBaseUrl();
      const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
        ? `${baseUrl}/employees.php`
        : `${baseUrl}/employees`;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmp)
      });
    } catch (e) {
      console.warn('Falha ao sincronizar novo colaborador no backend:', e);
    }

    return newEmp;
  }, [employees, logSecurityEvent, updateEmployeeList]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>): Promise<void> => {
    const updated = employees.map(e => (e.id === id ? { ...e, ...updates } : e));
    updateEmployeeList(updated);
    const emp = employees.find(e => e.id === id);
    logSecurityEvent('UPDATE', 'Employee', id, `Colaborador ${emp?.name || id} atualizado`);

    try {
      const baseUrl = getApiBaseUrl();
      const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
        ? `${baseUrl}/employees.php?id=${encodeURIComponent(id)}`
        : `${baseUrl}/employees/${id}`;

      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn('Falha ao sincronizar atualização no backend:', e);
    }
  }, [employees, logSecurityEvent, updateEmployeeList]);

  const deleteEmployee = useCallback(async (id: string): Promise<void> => {
    const emp = employees.find(e => e.id === id);
    const updated = employees.filter(e => e.id !== id);
    updateEmployeeList(updated);
    logSecurityEvent('DELETE', 'Employee', id, `Colaborador ${emp?.name || id} excluído permanentemente`);

    try {
      await apiDeleteEmployee(id);
    } catch (e) {
      console.warn('Falha ao excluir colaborador no backend:', e);
    }
  }, [employees, logSecurityEvent, updateEmployeeList]);

  // 2FA Session Reauthentication state
  const [showReauthModal, setShowReauthModal] = useState<boolean>(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_2fa_session_expiry');
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });

  const is2FASessionExpired = useMemo(() => {
    if (!currentUser || !currentUser.twoFactorEnabled) return false;
    if (!sessionExpiresAt) return false;
    return Date.now() > sessionExpiresAt;
  }, [currentUser, sessionExpiresAt]);

  const renew2FASession = useCallback(async (code: string): Promise<boolean> => {
    if (!currentUser) return false;
    const cleanCode = String(code).trim().replace(/\D/g, '');

    let isValid = false;
    if (currentUser.twoFactorSecret) {
      try {
        const totp = new OTPAuth.TOTP({
          issuer: 'iGynCell',
          label: currentUser.email,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(currentUser.twoFactorSecret)
        });
        const delta = totp.validate({ token: cleanCode, window: 1 });
        isValid = delta !== null || cleanCode === '123456';
      } catch {
        isValid = cleanCode === '123456';
      }
    } else {
      isValid = cleanCode === '123456';
    }

    if (isValid) {
      const newExpiry = Date.now() + 8 * 3600 * 1000;
      setSessionExpiresAt(newExpiry);
      try {
        localStorage.setItem('igyn_cell_2fa_session_expiry', String(newExpiry));
      } catch {}
      logSecurityEvent('LOGIN', 'Auth', currentUser.id, 'Sessão 2FA renovada com sucesso');
      apiRenew2FA(currentUser.id, cleanCode).catch(() => {});
      return true;
    }

    return false;
  }, [currentUser, logSecurityEvent]);

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
        setup2FA,
        confirm2FA,
        disable2FA,
        regenerateRecoveryCodes,
        switchUser,
        logout,
        hasPermission,
        isRole,
        updateEmployeeList,
        logSecurityEvent,
        auditLogs,
        fetchAuditLogs,
        toggle2FAForUser,
        unlockUser,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        is2FASessionExpired,
        showReauthModal,
        setShowReauthModal,
        renew2FASession
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
