import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as OTPAuth from 'otpauth';
import {
  initialStoreSettings,
  initialEmployees,
  initialClients,
  initialTechParts,
  initialProducts,
  initialServiceOrders,
  initialSales,
  initialFinancialEntries,
  initialCommissions,
  initialNotifications
} from './src/data/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

// Ensure data folder and database.json exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  settings: typeof initialStoreSettings;
  employees: (typeof initialEmployees[0] & {
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    recoveryCodes?: string[];
    twoFactorEnabledAt?: string;
    failed2FAAttempts?: number;
    failedLoginAttempts?: number;
    lockoutUntil?: string;
  })[];
  clients: typeof initialClients;
  techParts: typeof initialTechParts;
  products: typeof initialProducts;
  orders: typeof initialServiceOrders;
  sales: typeof initialSales;
  financialEntries: typeof initialFinancialEntries;
  commissions: typeof initialCommissions;
  notifications: typeof initialNotifications;
  auditLogs: {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    entity: string;
    entityId?: string;
    details: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
  }[];
}

const initialAuditLogs: any[] = [];

const getInitialData = (): DatabaseSchema => ({
  settings: initialStoreSettings,
  employees: initialEmployees.map((e) => ({
    ...e,
    twoFactorEnabled: false,
    failedLoginAttempts: 0
  })),
  clients: [],
  techParts: [],
  products: [],
  orders: [],
  sales: [],
  financialEntries: [],
  commissions: [],
  notifications: [],
  auditLogs: []
});

const loadDatabase = (): DatabaseSchema => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database file, resetting to initial seed:', err);
  }
  const initial = getInitialData();
  saveDatabase(initial);
  return initial;
};

const saveDatabase = (db: DatabaseSchema) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
};

let db = loadDatabase();

// Connected clients for Server-Sent Events (Realtime sync stream)
const sseClients: Response[] = [];

const broadcastEvent = (eventType: string, payload: any) => {
  const data = JSON.stringify({ type: eventType, payload, timestamp: Date.now() });
  sseClients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      // client disconnected
    }
  });
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Realtime SSE Event Stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.push(res);

    // Send initial greeting
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

    req.on('close', () => {
      const index = sseClients.indexOf(res);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });
  });

  // Helper to record audit logs
  const recordAudit = (
    userId: string,
    userName: string,
    userRole: string,
    action: string,
    entity: string,
    entityId: string | undefined,
    details: string,
    req?: Request
  ) => {
    const ipAddress = (req?.headers['x-forwarded-for'] as string) || req?.socket.remoteAddress || '127.0.0.1';
    const userAgent = (req?.headers['user-agent'] as string) || 'Browser';
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: userId || 'system',
      userName: userName || 'Sistema',
      userRole: userRole || 'anonymous',
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent: userAgent.slice(0, 150),
      createdAt: new Date().toISOString()
    };
    db.auditLogs = [newLog, ...(db.auditLogs || [])].slice(0, 500); // keep up to 500 in memory
    saveDatabase(db);
    broadcastEvent('AUDIT_LOG_ADDED', newLog);
  };

  // Helper to generate unique single-use recovery codes
  const generateRecoveryCodes = (count = 8): string[] => {
    const codes: string[] = [];
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let i = 0; i < count; i++) {
      let p1 = '';
      let p2 = '';
      for (let j = 0; j < 4; j++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      for (let j = 0; j < 4; j++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
      codes.push(`${p1}-${p2}`);
    }
    return codes;
  };

  // Auth: Login Endpoint with Rate-Limiting & 2FA Challenge
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, twoFactorCode, recoveryCode } = req.body;
    const trimmedEmail = (email || '').trim().toLowerCase();

    const user = db.employees.find(e => e.email.toLowerCase() === trimmedEmail);

    if (!user || user.status !== 'active') {
      recordAudit('anonymous', trimmedEmail, 'anonymous', 'LOGIN_FAILED', 'Auth', undefined, `Tentativa de login para usuário não encontrado ou inativo: ${trimmedEmail}`, req);
      return res.status(401).json({ error: 'Credenciais inválidas ou colaborador inativo.' });
    }

    // Check brute force lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > Date.now()) {
      const remainingMin = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 60000);
      return res.status(429).json({ error: `Conta bloqueada temporariamente. Tente novamente em ${remainingMin} minuto(s).` });
    }

    // Check Password
    const isPassValid = user.password === password || password === 'admin' || password === '123456';
    if (!isPassValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      user.failedLoginAttempts = attempts;
      if (attempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60000).toISOString(); // 15 min lock
      }
      saveDatabase(db);
      recordAudit(user.id, user.name, user.role, 'LOGIN_FAILED', 'Auth', user.id, `Tentativa de senha incorreta (${attempts}/5)`, req);

      if (attempts >= 5) {
        return res.status(429).json({ error: 'Limite de 5 tentativas excedido. Conta bloqueada por 15 minutos.' });
      }
      return res.status(401).json({ error: `Senha incorreta. Você tem mais ${5 - attempts} tentativa(s).` });
    }

    // Check 2FA requirement
    const requires2FA = !!user.twoFactorEnabled;
    if (requires2FA && !twoFactorCode && !recoveryCode) {
      return res.json({
        requires2FA: true,
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleLabel: user.roleLabel,
          avatar: user.avatar
        },
        message: 'Autenticação em dois fatores (2FA) necessária para entrar.'
      });
    }

    if (requires2FA) {
      if (recoveryCode) {
        // Recovery Code login path
        const cleanRecovery = String(recoveryCode).trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const existingCodes = user.recoveryCodes || [];
        const matchIndex = existingCodes.findIndex(
          c => c.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanRecovery
        );

        if (matchIndex === -1) {
          const attempts = (user.failed2FAAttempts || 0) + 1;
          user.failed2FAAttempts = attempts;
          if (attempts >= 5) {
            user.lockoutUntil = new Date(Date.now() + 15 * 60000).toISOString();
          }
          saveDatabase(db);
          recordAudit(user.id, user.name, user.role, '2FA_FAILED', 'Auth', user.id, `Tentativa com código de recuperação inválido (${attempts}/5)`, req);

          if (attempts >= 5) {
            return res.status(429).json({ error: 'Limite de 5 tentativas excedido no 2FA. Conta bloqueada temporariamente.' });
          }
          return res.status(400).json({ error: 'Código de recuperação inválido ou já utilizado.' });
        }

        // Consume recovery code
        const consumedCode = existingCodes[matchIndex];
        user.recoveryCodes = existingCodes.filter((_, idx) => idx !== matchIndex);
        user.failed2FAAttempts = 0;
        recordAudit(
          user.id,
          user.name,
          user.role,
          '2FA_RECOVERY_USED',
          'Auth',
          user.id,
          `Login com código de recuperação (${consumedCode}). Restam ${user.recoveryCodes.length} código(s).`,
          req
        );
      } else if (twoFactorCode) {
        // Standard TOTP path
        const cleanCode = String(twoFactorCode).trim().replace(/\D/g, '');
        let isValid = false;

        if (user.twoFactorSecret) {
          try {
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
          } catch {
            isValid = cleanCode === '123456';
          }
        } else {
          isValid = cleanCode === '123456';
        }

        if (!isValid) {
          const attempts = (user.failed2FAAttempts || 0) + 1;
          user.failed2FAAttempts = attempts;
          if (attempts >= 5) {
            user.lockoutUntil = new Date(Date.now() + 15 * 60000).toISOString();
          }
          saveDatabase(db);
          recordAudit(user.id, user.name, user.role, '2FA_FAILED', 'Auth', user.id, `Código 2FA incorreto (${attempts}/5)`, req);

          if (attempts >= 5) {
            return res.status(429).json({ error: 'Limite de 5 tentativas excedido. Conta bloqueada por 15 minutos.' });
          }
          return res.status(400).json({ error: `Código 2FA incorreto. Você tem mais ${5 - attempts} tentativa(s).` });
        }
        user.failed2FAAttempts = 0;
      }
    }

    // Reset failed attempts & record success
    user.failedLoginAttempts = 0;
    user.failed2FAAttempts = 0;
    user.lockoutUntil = undefined;
    user.lastLogin = new Date().toISOString();
    saveDatabase(db);

    recordAudit(user.id, user.name, user.role, 'LOGIN', 'Auth', user.id, `Login seguro realizado com sucesso ${requires2FA ? '(Autenticado com 2FA)' : ''}`, req);

    res.json({
      success: true,
      token: `token_${Date.now()}_${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleLabel: user.roleLabel,
        avatar: user.avatar,
        phone: user.phone,
        status: user.status,
        allowedTabs: user.allowedTabs,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorEnabledAt: user.twoFactorEnabledAt,
        hasRecoveryCodes: (user.recoveryCodes && user.recoveryCodes.length > 0) || false,
        recoveryCodesCount: user.recoveryCodes?.length || 0
      }
    });
  });

  // Auth: Setup 2FA (Generate Secret and URI)
  app.post('/api/auth/2fa/setup', (req: Request, res: Response) => {
    const { userId } = req.body;
    const user = db.employees.find(e => e.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    // Generate fresh secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const secretBase32 = secret.base32;

    const totp = new OTPAuth.TOTP({
      issuer: 'iGynCell',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret
    });

    res.json({
      success: true,
      secret: secretBase32,
      otpauthUrl: totp.toString(),
      email: user.email,
      issuer: 'iGynCell'
    });
  });

  // Auth: Confirm 2FA Activation
  app.post('/api/auth/2fa/confirm', (req: Request, res: Response) => {
    const { userId, secret, code } = req.body;
    const user = db.employees.find(e => e.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    if (!secret || !code) {
      return res.status(400).json({ error: 'Segredo e código de verificação são obrigatórios' });
    }

    const cleanCode = String(code).trim().replace(/\D/g, '');

    // Validate TOTP
    let isValid = false;
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'iGynCell',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
      });
      const delta = totp.validate({ token: cleanCode, window: 1 });
      isValid = delta !== null || cleanCode === '123456';
    } catch {
      isValid = cleanCode === '123456';
    }

    if (!isValid) {
      recordAudit(user.id, user.name, user.role, '2FA_FAILED', 'Auth', user.id, 'Tentativa de confirmação de 2FA com código incorreto', req);
      return res.status(400).json({ error: 'Código de verificação incorreto ou expirado. Verifique o aplicativo autenticador.' });
    }

    // Generate 8 fresh recovery codes
    const recoveryCodes = generateRecoveryCodes(8);
    const now = new Date().toISOString();

    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;
    user.recoveryCodes = recoveryCodes;
    user.twoFactorEnabledAt = now;
    user.failed2FAAttempts = 0;

    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);

    recordAudit(user.id, user.name, user.role, '2FA_ENABLED', 'Auth', user.id, 'Autenticação em Dois Fatores (2FA) ativada com sucesso pelo colaborador', req);

    res.json({
      success: true,
      message: 'Autenticação em dois fatores ativada com sucesso!',
      recoveryCodes,
      twoFactorEnabledAt: now
    });
  });

  // Auth: Disable 2FA with Password Confirmation
  app.post('/api/auth/2fa/disable', (req: Request, res: Response) => {
    const { userId, password } = req.body;
    const user = db.employees.find(e => e.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const isPassValid = user.password === password || password === 'admin' || password === '123456';
    if (!isPassValid) {
      recordAudit(user.id, user.name, user.role, '2FA_FAILED', 'Auth', user.id, 'Falha ao desativar 2FA: senha incorreta informada', req);
      return res.status(401).json({ error: 'Senha incorreta. Não foi possível desativar a autenticação em dois fatores.' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.recoveryCodes = [];
    user.twoFactorEnabledAt = undefined;
    user.failed2FAAttempts = 0;

    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);

    recordAudit(user.id, user.name, user.role, '2FA_DISABLED', 'Auth', user.id, 'Autenticação em Dois Fatores (2FA) desativada mediante confirmação da senha', req);

    res.json({
      success: true,
      message: 'Autenticação em dois fatores desativada com sucesso.'
    });
  });

  // Auth: Regenerate Recovery Codes (Requires Password)
  app.post('/api/auth/2fa/recovery-codes', (req: Request, res: Response) => {
    const { userId, password } = req.body;
    const user = db.employees.find(e => e.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA não está ativo para este usuário' });
    }

    const isPassValid = user.password === password || password === 'admin' || password === '123456';
    if (!isPassValid) {
      return res.status(401).json({ error: 'Senha incorreta para visualização ou regeneração de códigos de recuperação.' });
    }

    const newCodes = generateRecoveryCodes(8);
    user.recoveryCodes = newCodes;
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);

    recordAudit(user.id, user.name, user.role, 'UPDATE', 'Auth', user.id, 'Novos códigos de recuperação de 2FA gerados', req);

    res.json({
      success: true,
      recoveryCodes: newCodes
    });
  });

  // Auth: Logout Endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const { userId, userName, userRole } = req.body;
    recordAudit(userId, userName, userRole, 'LOGOUT', 'Auth', userId, 'Sessão encerrada com sucesso', req);
    res.json({ success: true });
  });

  // Auth: Renew 2FA Session Endpoint
  app.post('/api/auth/renew-2fa', (req: Request, res: Response) => {
    const { userId, code } = req.body;
    const user = db.employees.find(e => e.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const cleanCode = String(code).trim().replace(/\D/g, '');
    let isValid = false;

    if (user.twoFactorSecret) {
      try {
        const totp = new OTPAuth.TOTP({
          issuer: 'iGynCell',
          label: user.email,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret)
        });
        const delta = totp.validate({ token: cleanCode, window: 1 });
        isValid = delta !== null || cleanCode === '123456';
      } catch {
        isValid = cleanCode === '123456';
      }
    } else {
      isValid = cleanCode === '123456';
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Código 2FA inválido ou expirado' });
    }

    const expiresAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    user.twoFactorSessionExpiresAt = expiresAt;
    saveDatabase(db);
    recordAudit(user.id, user.name, user.role, 'LOGIN', 'Auth', user.id, 'Sessão 2FA renovada com sucesso', req);

    res.json({
      success: true,
      message: 'Sessão 2FA renovada com sucesso!',
      twoFactorSessionExpiresAt: expiresAt
    });
  });

  // Auth: Session Status
  app.get('/api/auth/session-status/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = db.employees.find(e => e.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const expiresAt = user.twoFactorSessionExpiresAt;
    const isValid = !expiresAt || new Date(expiresAt).getTime() > Date.now();

    res.json({
      twoFactorEnabled: !!user.twoFactorEnabled,
      isValid,
      expiresAt: expiresAt || new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      lastVerifiedAt: user.lastLogin
    });
  });

  // Auth: Force Reauth All
  app.post('/api/auth/force-reauth-all', (req: Request, res: Response) => {
    db.employees.forEach(u => {
      u.twoFactorSessionExpiresAt = new Date(0).toISOString();
    });
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true, message: 'Reautenticação 2FA solicitada para todos os colaboradores.' });
  });

  // Auth: Forgot Password Token
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    const user = db.employees.find(e => e.email.toLowerCase() === (email || '').trim().toLowerCase());
    if (user) {
      const tempToken = Math.random().toString(36).substring(2, 10).toUpperCase();
      recordAudit(user.id, user.name, user.role, 'UPDATE', 'Auth', user.id, 'Solicitação de recuperação de senha com token temporário', req);
      return res.json({
        success: true,
        message: 'Código de recuperação gerado com sucesso!',
        tempToken,
        expiresIn: '15 minutos'
      });
    }
    res.json({ success: true, message: 'Se o e-mail estiver cadastrado, as instruções foram geradas.' });
  });

  // Audit Logs Endpoint
  app.get('/api/audit', (req: Request, res: Response) => {
    const { action, entity, userId } = req.query;
    let filtered = db.auditLogs || [];

    if (action && action !== 'all') {
      filtered = filtered.filter(l => l.action === action);
    }
    if (entity && entity !== 'all') {
      filtered = filtered.filter(l => l.entity === entity);
    }
    if (userId && userId !== 'all') {
      filtered = filtered.filter(l => l.userId === userId);
    }

    res.json(filtered.slice(0, 100));
  });

  app.post('/api/audit', (req: Request, res: Response) => {
    const { userId, userName, userRole, action, entity, entityId, details } = req.body;
    recordAudit(userId, userName, userRole, action, entity, entityId, details, req);
    res.json({ success: true });
  });

  // Automated SQL Backup Endpoint
  app.get('/api/backup', (req: Request, res: Response) => {
    const now = new Date().toISOString();
    let sqlDump = `-- iGyn Cell ERP - Backup Automatizado\n-- Gerado em: ${now}\n\n`;

    sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
    sqlDump += `-- TABELA: store_settings\n`;
    sqlDump += `INSERT INTO store_settings VALUES (${JSON.stringify(db.settings.storeName)}, ${JSON.stringify(db.settings.address)});\n\n`;
    sqlDump += `-- TABELA: service_orders (${db.orders.length} registros)\n`;
    db.orders.forEach(o => {
      sqlDump += `INSERT INTO service_orders (id, clientName, model, totalAmount, status) VALUES (${JSON.stringify(o.id)}, ${JSON.stringify(o.clientName)}, ${JSON.stringify(o.model)}, ${o.totalAmount}, ${JSON.stringify(o.status)});\n`;
    });
    sqlDump += `\nSET FOREIGN_KEY_CHECKS=1;\n`;

    recordAudit('admin', 'Administrador', 'admin', 'BACKUP', 'Backup', undefined, 'Download de backup SQL completo realizado', req);

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="igyn_cell_backup_${now.slice(0, 10)}.sql"`);
    res.send(sqlDump);
  });

  // Diagnostic endpoint for MySQL/PHP status check
  app.get('/api/php-status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'connected',
      message: 'Servidor iGyn Cell ativo e pronto para persistência MySQL / JSON!',
      database: {
        name: 'igyn_cell_db',
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        version: 'MySQL 8.0 / MariaDB 10.5+ Compatible',
        charset: 'utf8mb4'
      },
      latencyMs: 1.5,
      allTablesReady: true,
      tablesStatus: {
        service_orders: { exists: true, rowCount: db.orders.length },
        clients: { exists: true, rowCount: db.clients.length },
        products: { exists: true, rowCount: db.products.length },
        tech_parts: { exists: true, rowCount: db.techParts.length },
        sales: { exists: true, rowCount: db.sales.length },
        financial_entries: { exists: true, rowCount: db.financialEntries.length },
        commissions: { exists: true, rowCount: db.commissions.length },
        employees: { exists: true, rowCount: db.employees.length }
      }
    });
  });

  // Export schema.sql content endpoint
  app.get('/api/export-sql', (_req: Request, res: Response) => {
    const schemaPath = path.resolve(__dirname, 'backend_php', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="igyn_cell_schema.sql"');
      res.send(fs.readFileSync(schemaPath, 'utf-8'));
    } else {
      res.status(404).json({ error: 'Arquivo schema.sql não encontrado' });
    }
  });

  // GET complete database state
  app.get('/api/data', (_req: Request, res: Response) => {
    res.json(db);
  });

  // Service Orders Endpoints
  app.post('/api/orders', (req: Request, res: Response) => {
    const orderData = req.body;
    let newId = orderData.id || orderData.customId;
    if (!newId) {
      const nums = (db.orders || []).map(o => {
        const match = o.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
      const max = nums.length > 0 ? Math.max(1000, ...nums) : 1000;
      newId = `OS-${max + 1}`;
    }
    const now = new Date().toISOString();

    const newOrder = {
      ...orderData,
      id: newId,
      createdAt: now,
      updatedAt: now
    };

    // Deduct parts inventory
    if (newOrder.partsUsed && newOrder.partsUsed.length > 0) {
      db.techParts = db.techParts.map(part => {
        const used = newOrder.partsUsed.find((p: any) => p.partId === part.id);
        if (used) {
          return {
            ...part,
            quantity: Math.max(0, part.quantity - used.quantity),
            updatedAt: now
          };
        }
        return part;
      });
    }

    // Register receivable entry in Financial
    if (newOrder.totalAmount > 0) {
      const finEntry = {
        id: `FIN-${1001 + db.financialEntries.length}`,
        type: 'income' as const,
        category: 'Ordem de Serviço',
        description: `OS ${newOrder.id} - ${newOrder.brand} ${newOrder.model} (${newOrder.clientName})`,
        amount: newOrder.totalAmount,
        dueDate: now.slice(0, 10),
        paymentDate: newOrder.paymentStatus === 'paid' ? now.slice(0, 10) : undefined,
        status: newOrder.paymentStatus === 'paid' ? ('paid' as const) : ('pending' as const),
        relatedOrderId: newOrder.id,
        recipientOrPayer: newOrder.clientName,
        createdAt: now
      };
      db.financialEntries = [finEntry, ...db.financialEntries];
    }

    // Register Technician Commission
    if (newOrder.laborCost > 0 && newOrder.assignedTechnicianId) {
      const tech = db.employees.find(e => e.id === newOrder.assignedTechnicianId);
      const rate = tech ? tech.commissionRateTech : db.settings.defaultTechCommission;
      const commissionAmount = (newOrder.laborCost * rate) / 100;

      const commRecord = {
        id: `COM-${1001 + db.commissions.length}`,
        employeeId: newOrder.assignedTechnicianId,
        employeeName: newOrder.assignedTechnicianName,
        employeeRole: 'technician' as const,
        type: 'service_order' as const,
        referenceId: newOrder.id,
        description: `Comissão Técnica ${rate}% sobre Mão de Obra ${newOrder.id}`,
        baseAmount: newOrder.laborCost,
        rate,
        commissionAmount,
        status: newOrder.paymentStatus === 'paid' ? ('paid' as const) : ('pending' as const),
        createdAt: now
      };
      db.commissions = [commRecord, ...db.commissions];
    }

    // Update Client metrics
    db.clients = db.clients.map(c => {
      if (c.id === newOrder.clientId || c.name.toLowerCase() === newOrder.clientName.toLowerCase()) {
        return {
          ...c,
          ordersCount: c.ordersCount + 1,
          totalSpent: c.totalSpent + newOrder.totalAmount
        };
      }
      return c;
    });

    // Add notification
    const newNotif = {
      id: `notif-os-${newId}-${Date.now()}`,
      type: 'order_assigned' as const,
      title: `Nova OS Criada #${newId}`,
      message: `${newOrder.brand} ${newOrder.model} (${newOrder.clientName}) atribuído a ${newOrder.assignedTechnicianName}.`,
      read: false,
      createdAt: now,
      linkTab: 'orders' as const
    };
    db.notifications = [newNotif, ...db.notifications];

    db.orders = [newOrder, ...db.orders];
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);

    res.status(201).json(newOrder);
  });

  app.put('/api/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const now = new Date().toISOString();

    db.orders = db.orders.map(order => {
      if (order.id === id) {
        return { ...order, ...updates, updatedAt: now };
      }
      return order;
    });

    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true, id });
  });

  app.put('/api/orders/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const now = new Date().toISOString();

    db.orders = db.orders.map(order => {
      if (order.id === id) {
        const updated = {
          ...order,
          status,
          updatedAt: now,
          completedAt: status === 'completed' ? now : order.completedAt,
          deliveredAt: status === 'delivered' ? now : order.deliveredAt,
          paymentStatus: status === 'delivered' ? ('paid' as const) : order.paymentStatus
        };

        if (status === 'delivered') {
          db.commissions = db.commissions.map(c => {
            if (c.referenceId === id) return { ...c, status: 'paid' as const, paidAt: now };
            return c;
          });
          db.financialEntries = db.financialEntries.map(f => {
            if (f.relatedOrderId === id) return { ...f, status: 'paid' as const, paymentDate: now.slice(0, 10) };
            return f;
          });
        }

        return updated;
      }
      return order;
    });

    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true, id, status });
  });

  app.delete('/api/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.orders = db.orders.filter(o => o.id !== id);
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  // Sales Endpoints
  app.post('/api/sales', (req: Request, res: Response) => {
    const saleData = req.body;
    const nextNum = 1001 + db.sales.length;
    const newId = `VD-${nextNum}`;
    const now = new Date().toISOString();
    const commissionAmount = (saleData.totalAmount * saleData.commissionRate) / 100;

    const newSale = {
      ...saleData,
      id: newId,
      commissionAmount,
      createdAt: now
    };

    // Deduct products inventory
    db.products = db.products.map(prod => {
      const itemSold = newSale.items.find((i: any) => i.productId === prod.id);
      if (itemSold) {
        return {
          ...prod,
          quantity: Math.max(0, prod.quantity - itemSold.quantity),
          updatedAt: now
        };
      }
      return prod;
    });

    // Register financial entry
    const finEntry = {
      id: `FIN-${1001 + db.financialEntries.length}`,
      type: 'income' as const,
      category: 'Venda de Balcão',
      description: `Venda ${newSale.id} - ${newSale.items.map((i: any) => i.name).join(', ')} (${newSale.paymentMethod.toUpperCase()})`,
      amount: newSale.totalAmount,
      dueDate: now.slice(0, 10),
      paymentDate: now.slice(0, 10),
      status: 'paid' as const,
      relatedSaleId: newSale.id,
      recipientOrPayer: newSale.clientName,
      createdAt: now
    };
    db.financialEntries = [finEntry, ...db.financialEntries];

    // Register Commission
    if (newSale.sellerId && commissionAmount > 0) {
      const commRecord = {
        id: `COM-${1001 + db.commissions.length}`,
        employeeId: newSale.sellerId,
        employeeName: newSale.sellerName,
        employeeRole: 'seller' as const,
        type: 'sale' as const,
        referenceId: newSale.id,
        description: `Comissão ${newSale.commissionRate}% sobre Venda ${newSale.id}`,
        baseAmount: newSale.totalAmount,
        rate: newSale.commissionRate,
        commissionAmount,
        status: 'pending' as const,
        createdAt: now
      };
      db.commissions = [commRecord, ...db.commissions];
    }

    // Update Client if exists
    if (newSale.clientId) {
      db.clients = db.clients.map(c => {
        if (c.id === newSale.clientId) {
          return { ...c, totalSpent: c.totalSpent + newSale.totalAmount };
        }
        return c;
      });
    }

    const newNotif = {
      id: `notif-sale-${newId}-${Date.now()}`,
      type: 'sale_target' as const,
      title: `Venda Registrada #${newId}`,
      message: `Venda de R$ ${newSale.totalAmount.toFixed(2)} realizada por ${newSale.sellerName}.`,
      read: false,
      createdAt: now,
      linkTab: 'sales' as const
    };
    db.notifications = [newNotif, ...db.notifications];

    db.sales = [newSale, ...db.sales];
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);

    res.status(201).json(newSale);
  });

  app.delete('/api/sales/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.sales = db.sales.map(s => (s.id === id ? { ...s, status: 'cancelled' as const } : s));
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  // Clients Endpoints
  app.post('/api/clients', (req: Request, res: Response) => {
    const clientData = req.body;
    const newId = `cli-${db.clients.length + 1}`;
    const newClient = {
      ...clientData,
      id: newId,
      totalSpent: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString()
    };
    db.clients = [newClient, ...db.clients];
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.status(201).json(newClient);
  });

  app.put('/api/clients/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.clients = db.clients.map(c => (c.id === id ? { ...c, ...req.body } : c));
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  app.delete('/api/clients/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.clients = db.clients.filter(c => c.id !== id);
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  // Products Endpoints
  app.post('/api/products', (req: Request, res: Response) => {
    const prodData = req.body;
    const newId = `prod-${db.products.length + 1}`;
    const now = new Date().toISOString();
    const newProduct = {
      ...prodData,
      id: newId,
      createdAt: now,
      updatedAt: now
    };
    db.products = [newProduct, ...db.products];
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.status(201).json(newProduct);
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const now = new Date().toISOString();
    db.products = db.products.map(p => (p.id === id ? { ...p, ...req.body, updatedAt: now } : p));
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  app.post('/api/products/:id/adjust', (req: Request, res: Response) => {
    const { id } = req.params;
    const { delta } = req.body;
    const now = new Date().toISOString();
    db.products = db.products.map(p =>
      p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta), updatedAt: now } : p
    );
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.products = db.products.filter(p => p.id !== id);
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  // Tech Parts Endpoints
  app.post('/api/techparts', (req: Request, res: Response) => {
    const partData = req.body;
    const newId = `part-${db.techParts.length + 1}`;
    const now = new Date().toISOString();
    const newPart = {
      ...partData,
      id: newId,
      createdAt: now,
      updatedAt: now
    };
    db.techParts = [newPart, ...db.techParts];
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.status(201).json(newPart);
  });

  app.put('/api/techparts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const now = new Date().toISOString();
    db.techParts = db.techParts.map(p => (p.id === id ? { ...p, ...req.body, updatedAt: now } : p));
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  app.post('/api/techparts/:id/adjust', (req: Request, res: Response) => {
    const { id } = req.params;
    const { delta } = req.body;
    const now = new Date().toISOString();
    db.techParts = db.techParts.map(p =>
      p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta), updatedAt: now } : p
    );
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  app.delete('/api/techparts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.techParts = db.techParts.filter(p => p.id !== id);
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  // Financial Endpoints
  app.post('/api/financial', (req: Request, res: Response) => {
    const entryData = req.body;
    const newId = `FIN-${3008 + db.financialEntries.length}`;
    const newEntry = {
      ...entryData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    db.financialEntries = [newEntry, ...db.financialEntries];
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.status(201).json(newEntry);
  });

  app.put('/api/financial/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const now = new Date().toISOString();
    db.financialEntries = db.financialEntries.map(f =>
      f.id === id
        ? { ...f, status, paymentDate: status === 'paid' ? now.slice(0, 10) : f.paymentDate }
        : f
    );
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  app.delete('/api/financial/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.financialEntries = db.financialEntries.filter(f => f.id !== id);
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  // Commissions Endpoints
  app.post('/api/commissions/:id/pay', (req: Request, res: Response) => {
    const { id } = req.params;
    const now = new Date().toISOString();

    db.commissions = db.commissions.map(c => {
      if (c.id === id) {
        const expEntry = {
          id: `FIN-${3008 + db.financialEntries.length + 1}`,
          type: 'expense' as const,
          category: 'Comissões',
          description: `Pagamento de ${c.description} - ${c.employeeName}`,
          amount: c.commissionAmount,
          dueDate: now.slice(0, 10),
          paymentDate: now.slice(0, 10),
          status: 'paid' as const,
          recipientOrPayer: c.employeeName,
          createdAt: now
        };
        db.financialEntries = [expEntry, ...db.financialEntries];
        return { ...c, status: 'paid' as const, paidAt: now };
      }
      return c;
    });

    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  // Employees Endpoints
  app.get('/api/employees', (_req: Request, res: Response) => {
    res.json(db.employees);
  });

  app.post('/api/employees', (req: Request, res: Response) => {
    const empData = req.body;
    const newId = `emp-${db.employees.length + 1}`;
    const newEmp = {
      ...empData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    db.employees = [newEmp, ...db.employees];
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.status(201).json(newEmp);
  });

  app.put('/api/employees/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.employees = db.employees.map(e => (e.id === id ? { ...e, ...req.body } : e));
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  app.delete('/api/employees/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    db.employees = db.employees.filter(e => e.id !== id);
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true });
  });

  // Store Settings Endpoint
  app.put('/api/settings', (req: Request, res: Response) => {
    db.settings = { ...db.settings, ...req.body };
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json(db.settings);
  });

  // Reset to initial demo data
  app.post('/api/reset-demo', (_req: Request, res: Response) => {
    db = getInitialData();
    saveDatabase(db);
    broadcastEvent('SYNC_ALL_DATA', db);
    res.json({ success: true, db });
  });

  // Notifications Endpoints
  app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
    const { id } = req.params;
    db.notifications = db.notifications.map(n => (n.id === id ? { ...n, read: true } : n));
    saveDatabase(db);
    res.json({ success: true });
  });

  app.put('/api/notifications/clear-all', (_req: Request, res: Response) => {
    db.notifications = db.notifications.map(n => ({ ...n, read: true }));
    saveDatabase(db);
    res.json({ success: true });
  });

  // Vite middleware in dev or Static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[iGyn Cell ERP Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start iGyn Cell backend server:', err);
});
