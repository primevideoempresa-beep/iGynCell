/**
 * iGyn Cell ERP - Camada de Serviços de Persistência & Integração API (PHP / MySQL / Express)
 */

import {
  ServiceOrder,
  Client,
  Product,
  TechPart,
  Sale,
  FinancialEntry,
  CommissionRecord,
  Employee,
  StoreSettings,
  NotificationItem,
  OSStatus
} from '../types';

const STORAGE_PHP_URL_KEY = 'igyn_cell_custom_php_api_url';
const DEFAULT_API_BASE = '/api';

export interface DatabaseSnapshot {
  settings: StoreSettings;
  employees: Employee[];
  clients: Client[];
  products: Product[];
  techParts: TechPart[];
  orders: ServiceOrder[];
  sales: Sale[];
  financialEntries: FinancialEntry[];
  commissions: CommissionRecord[];
  notifications: NotificationItem[];
}

export interface BackendConnectionTestResult {
  success: boolean;
  status: 'connected' | 'error' | 'local';
  message: string;
  latencyMs?: number;
  database?: {
    name: string;
    host: string;
    port: string | number;
    user?: string;
    version?: string;
    charset?: string;
  };
  tablesStatus?: Record<string, { exists: boolean; rowCount?: number; error?: string }>;
  allTablesReady?: boolean;
}

/**
 * Obtém a URL base configurada para a API (PHP ou /api local)
 */
export const getApiBaseUrl = (): string => {
  try {
    const custom = localStorage.getItem(STORAGE_PHP_URL_KEY);
    if (custom && custom.trim().length > 0) {
      // Remove trailing slash
      return custom.trim().replace(/\/+$/, '');
    }
  } catch {
    // fallback
  }
  return DEFAULT_API_BASE;
};

/**
 * Define uma URL customizada de backend PHP (ex: http://localhost/backend_php/api)
 */
export const setCustomPhpApiUrl = (url: string) => {
  try {
    if (!url || url.trim() === '') {
      localStorage.removeItem(STORAGE_PHP_URL_KEY);
    } else {
      localStorage.setItem(STORAGE_PHP_URL_KEY, url.trim().replace(/\/+$/, ''));
    }
  } catch (e) {
    console.error('Erro ao salvar URL customizada de API', e);
  }
};

/**
 * Testa a conexão com o backend PHP / MySQL
 */
export const testBackendConnection = async (targetUrl?: string): Promise<BackendConnectionTestResult> => {
  const baseUrl = targetUrl ? targetUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
  const startTime = performance.now();

  try {
    // 1. Tentar endpoint de diagnóstico específico do PHP (test_connection.php ou /php-status)
    const isPhpDirect = baseUrl.includes('.php') || baseUrl.includes('php') || baseUrl.startsWith('http');
    const endpoint = isPhpDirect
      ? (baseUrl.endsWith('.php') ? baseUrl : `${baseUrl}/test_connection.php`)
      : `${baseUrl}/php-status`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });

    const latency = Math.round(performance.now() - startTime);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        status: 'connected',
        message: data.message || 'Conectado com sucesso ao MySQL!',
        latencyMs: data.latencyMs || latency,
        database: data.database || { name: 'igyn_cell_db', host: '127.0.0.1', port: 3306 },
        tablesStatus: data.tablesStatus,
        allTablesReady: data.allTablesReady ?? true
      };
    } else {
      return {
        success: false,
        status: 'error',
        message: `Servidor retornou código HTTP ${response.status}: ${response.statusText}`,
        latencyMs: latency
      };
    }
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);
    return {
      success: false,
      status: 'error',
      message: err.message || 'Não foi possível conectar ao endpoint especificado.',
      latencyMs: latency
    };
  }
};

/**
 * Busca o estado completo do banco de dados (PHP/MySQL ou Express)
 */
export const fetchAllDatabase = async (): Promise<DatabaseSnapshot | null> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = baseUrl.startsWith('http') ? `${baseUrl}/data.php` : `${baseUrl}/data`;

  try {
    const res = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Falha ao buscar dados remotos do banco, utilizando cache:', err);
  }
  return null;
};

// ============================================================================
// SERVIÇO DE ORDENS DE SERVIÇO (CRUD COMPLETO COM PERSISTÊNCIA NO BANCO)
// ============================================================================

/**
 * Cria uma nova Ordem de Serviço no banco de dados
 */
export const apiCreateOrder = async (
  orderData: Omit<ServiceOrder, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; order?: ServiceOrder; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const isDirectPhp = baseUrl.startsWith('http') || baseUrl.includes('php');
  const endpoint = isDirectPhp ? `${baseUrl}/orders.php` : `${baseUrl}/orders`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, order: data };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Erro ${res.status} ao salvar OS no banco de dados`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erro de conexão com o servidor'
    };
  }
};

/**
 * Atualiza todos os dados de uma Ordem de Serviço no banco de dados
 */
export const apiUpdateOrder = async (
  id: string,
  updates: Partial<ServiceOrder>
): Promise<{ success: boolean; order?: ServiceOrder; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const isDirectPhp = baseUrl.startsWith('http') || baseUrl.includes('php');
  const endpoint = isDirectPhp ? `${baseUrl}/orders.php?id=${encodeURIComponent(id)}` : `${baseUrl}/orders/${id}`;

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, order: data.order || data };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Erro ao atualizar OS ${id} no banco de dados`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erro de conexão ao atualizar OS'
    };
  }
};

/**
 * Atualiza especificamente o Status de uma Ordem de Serviço
 */
export const apiUpdateOrderStatus = async (
  id: string,
  status: OSStatus
): Promise<{ success: boolean; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const isDirectPhp = baseUrl.startsWith('http') || baseUrl.includes('php');
  const endpoint = isDirectPhp
    ? `${baseUrl}/orders.php?action=status&id=${encodeURIComponent(id)}`
    : `${baseUrl}/orders/${id}/status`;

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      return { success: true };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Erro ao alterar status da OS ${id}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erro de conexão ao alterar status'
    };
  }
};

/**
 * Exclui uma Ordem de Serviço do banco de dados
 */
export const apiDeleteOrder = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const isDirectPhp = baseUrl.startsWith('http') || baseUrl.includes('php');
  const endpoint = isDirectPhp
    ? `${baseUrl}/orders.php?id=${encodeURIComponent(id)}`
    : `${baseUrl}/orders/${id}`;

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      return { success: true };
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || `Erro ao excluir OS ${id}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de conexão ao excluir OS' };
  }
};

/**
 * Solicita configuração de 2FA (gera secret e QR Code)
 */
export const apiSetup2FA = async (userId: string): Promise<{
  success: boolean;
  secret?: string;
  qrCodeUri?: string;
  backupCodes?: string[];
  employeeName?: string;
  employeeEmail?: string;
  error?: string;
}> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
    ? `${baseUrl}/auth.php?action=setup_2fa&userId=${encodeURIComponent(userId)}`
    : `${baseUrl}/auth/setup-2fa/${userId}`;

  try {
    const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Confirma e ativa o 2FA com o código digitado
 */
export const apiConfirm2FA = async (userId: string, secret: string, code: string): Promise<{ success: boolean; message?: string; twoFactorSessionExpiresAt?: string; backupCodes?: string[]; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
    ? `${baseUrl}/auth.php?action=confirm_2fa`
    : `${baseUrl}/auth/confirm-2fa`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ userId, secret, code })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Desativa o 2FA para um usuário
 */
export const apiDisable2FA = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
    ? `${baseUrl}/auth.php?action=disable_2fa`
    : `${baseUrl}/auth/disable-2fa`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Renova a sessão de 2FA ("Até quando funciona")
 */
export const apiRenew2FA = async (userId: string, code: string): Promise<{ success: boolean; message?: string; twoFactorSessionExpiresAt?: string; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/auth/renew-2fa`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ userId, code })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Força reautenticação 2FA imediata para todos os funcionários
 */
export const apiForceReauthAll = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/auth/force-reauth-all`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Obtém status e validade da sessão 2FA ("Até quando funciona")
 */
export const apiGetSessionStatus = async (userId: string): Promise<{
  twoFactorEnabled?: boolean;
  isValid?: boolean;
  expiresAt?: string;
  remainingSeconds?: number;
  remainingHoursFormatted?: string;
  lastVerifiedAt?: string;
  error?: string;
}> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/auth/session-status/${userId}`;

  try {
    const res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
    return await res.json();
  } catch (err: any) {
    return { error: err.message };
  }
};

/**
 * Regenera códigos de backup de emergência para o colaborador
 */
export const apiRegenerateBackupCodes = async (userId: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/auth/regenerate-backup-codes`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Exclui um Cliente do banco de dados
 */
export const apiDeleteClient = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const isDirectPhp = baseUrl.startsWith('http') || baseUrl.includes('php');
  const endpoint = isDirectPhp
    ? `${baseUrl}/clients.php?id=${encodeURIComponent(id)}`
    : `${baseUrl}/clients/${id}`;

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    return { success: res.ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Exclui um Colaborador do banco de dados
 */
export const apiDeleteEmployee = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const isDirectPhp = baseUrl.startsWith('http') || baseUrl.includes('php');
  const endpoint = isDirectPhp
    ? `${baseUrl}/employees.php?id=${encodeURIComponent(id)}`
    : `${baseUrl}/employees/${id}`;

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    return { success: res.ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Exclui um Produto do banco de dados
 */
export const apiDeleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const isDirectPhp = baseUrl.startsWith('http') || baseUrl.includes('php');
  const endpoint = isDirectPhp
    ? `${baseUrl}/products.php?id=${encodeURIComponent(id)}`
    : `${baseUrl}/products/${id}`;

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    return { success: res.ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Exclui uma Peça Técnica do banco de dados
 */
export const apiDeleteTechPart = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const baseUrl = getApiBaseUrl();
  const isDirectPhp = baseUrl.startsWith('http') || baseUrl.includes('php');
  const endpoint = isDirectPhp
    ? `${baseUrl}/techparts.php?id=${encodeURIComponent(id)}`
    : `${baseUrl}/techparts/${id}`;

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    return { success: res.ok };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};
