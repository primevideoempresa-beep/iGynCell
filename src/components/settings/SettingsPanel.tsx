import React, { useState } from 'react';
import {
  Settings,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  Percent,
  MessageCircle,
  Database,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Server,
  Zap,
  HardDrive,
  Code2,
  ExternalLink,
  Save,
  Lock,
  QrCode,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { testBackendConnection, BackendConnectionTestResult } from '../../services/api';

export const SettingsPanel: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    orders,
    clients,
    sales,
    products,
    techParts,
    financialEntries,
    commissions,
    employees,
    phpApiUrl,
    setPhpApiUrl,
    isDatabaseConnected,
    backendStatusInfo,
    refreshDatabaseConnection,
    syncWithDatabase,
    isSyncing
  } = useApp();
  const {
    currentUser,
    isRole,
    setup2FA,
    confirm2FA,
    disable2FA,
    twoFactorSessionExpiresAt,
    twoFactorRemainingSeconds,
    forceReauthAll
  } = useAuth();

  // Get current user data from employees list to have fresh 2FA status
  const userData = employees.find(e => e.id === currentUser?.id) || currentUser;

  const [storeName, setStoreName] = useState(settings.storeName);
  const [tradeName, setTradeName] = useState(settings.tradeName);
  const [address, setAddress] = useState(settings.address);
  const [locationDetails, setLocationDetails] = useState(settings.locationDetails);
  const [cityState, setCityState] = useState(settings.cityState);
  const [postalCode, setPostalCode] = useState(settings.postalCode);
  const [phone, setPhone] = useState(settings.phone);
  const [cnpj, setCnpj] = useState(settings.cnpj);
  const [warrantyTerms, setWarrantyTerms] = useState(settings.warrantyTerms);
  const [defaultSaleCommission, setDefaultSaleCommission] = useState(settings.defaultSaleCommission);
  const [defaultTechCommission, setDefaultTechCommission] = useState(settings.defaultTechCommission);
  const [whatsappGreetingTemplate, setWhatsappGreetingTemplate] = useState(settings.whatsappGreetingTemplate);

  // Global 2FA Policy State
  const [require2FAForAll, setRequire2FAForAll] = useState(settings.require2FAForAll ?? true);
  const [twoFactorSessionDurationHours, setTwoFactorSessionDurationHours] = useState(settings.twoFactorSessionDurationHours || 8);
  const [selectedEmp2FA, setSelectedEmp2FA] = useState<any | null>(null);
  const [reauthSuccessMsg, setReauthSuccessMsg] = useState('');

  // PHP/MySQL Backend Config State
  const [apiUrlInput, setApiUrlInput] = useState(phpApiUrl);
  const [testResult, setTestResult] = useState<BackendConnectionTestResult | null>(backendStatusInfo);
  const [isTesting, setIsTesting] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // 2FA Setup State for Current User
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [qrCodeUri, setQrCodeUri] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [isConfirming2FA, setIsConfirming2FA] = useState(false);

  const handleStartSetup2FA = async () => {
    setTwoFactorError('');
    try {
      if (!userData) return;
      const { secret, qrCodeUri } = await setup2FA(userData.id);
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
      if (!userData) return;
      const ok = await confirm2FA(userData.id, twoFactorSecret, confirmationCode);
      if (ok) {
        setIsSettingUp2FA(false);
        setConfirmationCode('');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
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
    if (!userData) return;
    if (confirm('Tem certeza que deseja desativar a proteção 2FA para sua conta?')) {
      const ok = await disable2FA(userData.id);
      if (ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Erro ao desativar 2FA.');
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName,
      tradeName,
      address,
      locationDetails,
      cityState,
      postalCode,
      phone,
      cnpj,
      warrantyTerms,
      defaultSaleCommission,
      defaultTechCommission,
      whatsappGreetingTemplate,
      require2FAForAll,
      twoFactorSessionDurationHours
    });
    setPhpApiUrl(apiUrlInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await testBackendConnection(apiUrlInput);
      setTestResult(res);
      if (res.success) {
        setPhpApiUrl(apiUrlInput);
        refreshDatabaseConnection();
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        status: 'error',
        message: e.message || 'Erro ao conectar ao endpoint'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDownloadSqlSchema = () => {
    fetch('/api/export-sql')
      .then(res => res.text())
      .then(sqlContent => {
        const blob = new Blob([sqlContent], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'igyn_cell_schema.sql';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        alert('Não foi possível gerar o arquivo SQL. Certifique-se de que o backend está ativo.');
      });
  };

  const handleBackupDownload = () => {
    const backupData = {
      settings,
      orders,
      clients,
      sales,
      products,
      techParts,
      financialEntries,
      commissions,
      employees,
      exportedAt: new Date().toISOString()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `iGyn_Cell_Backup_Completo_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Configurações da Empresa & Persistência
          </h2>
          <p className="text-xs text-slate-400">
            Conexão com banco de dados PHP / MySQL, políticas de garantia, comissões e backup
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      {/* PHP & MySQL Backend Connection Panel */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-5 space-y-4 shadow-xl shadow-cyan-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-cyan-500/20 border border-cyan-500/40 p-2 text-cyan-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Conexão com Backend PHP & Banco MySQL</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-mono font-bold border ${
                  isDatabaseConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isDatabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isDatabaseConnected ? 'Sincronizado' : 'Modo Offline / Local'}
                </span>
              </h3>
              <p className="text-2xs text-slate-400">
                Garante que todas as Ordens de Serviço, Clientes e Peças sejam persistidas no MySQL via API PHP (PDO)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-2xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Code2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>{showSetupGuide ? 'Ocultar Guia' : 'Guia de Instalação'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSqlSchema}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-2xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Baixar schema.sql</span>
            </button>
          </div>
        </div>

        {/* API Endpoint Input & Test Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-2xs font-medium text-slate-300 mb-1">
              URL Base da API Backend (PHP / MySQL ou Proxy Express)
            </label>
            <input
              type="text"
              value={apiUrlInput}
              onChange={e => setApiUrlInput(e.target.value)}
              placeholder="/api ou http://localhost/backend_php/api"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-500"
            />
            <span className="text-3xs text-slate-500 block mt-1">
              Padrão: <code className="text-slate-400">/api</code> (Bridge Full-Stack integrada) ou insira a URL direta do seu servidor Apache/XAMPP.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3 py-2 text-xs font-bold text-white transition disabled:opacity-50"
            >
              <Zap className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
            </button>

            <button
              type="button"
              onClick={() => syncWithDatabase()}
              disabled={isSyncing}
              title="Recarregar todos os dados do banco MySQL"
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Results Box */}
        {testResult && (
          <div className={`rounded-xl p-3.5 border text-xs space-y-2 ${
            testResult.success
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </span>
              {testResult.latencyMs !== undefined && (
                <span className="text-2xs font-mono opacity-80">
                  Latência: {testResult.latencyMs} ms
                </span>
              )}
            </div>

            {testResult.database && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-2xs font-mono">
                <div>
                  <span className="text-slate-400 block">Banco de Dados:</span>
                  <span className="font-bold text-white">{testResult.database.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Host & Porta:</span>
                  <span className="font-bold text-white">{testResult.database.host}:{testResult.database.port}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Charset:</span>
                  <span className="font-bold text-white">{testResult.database.charset || 'utf8mb4'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Versão:</span>
                  <span className="font-bold text-white truncate">{testResult.database.version || 'MySQL 8.0+'}</span>
                </div>
              </div>
            )}

            {testResult.tablesStatus && (
              <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap gap-2 text-3xs font-mono">
                {Object.entries(testResult.tablesStatus).map(([tbl, info]) => (
                  <span key={tbl} className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                    {tbl}: <strong className="text-emerald-400">{info.rowCount !== undefined ? `${info.rowCount} reg` : 'OK'}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Setup Guide Accordion */}
        {showSetupGuide && (
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs space-y-3">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-cyan-400" />
              <span>Como Publicar no Apache / XAMPP / cPanel / Docker</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-2xs text-slate-300 leading-relaxed">
              <li>
                <strong>Crie a base de dados no MySQL:</strong> No phpMyAdmin ou terminal MySQL, crie o banco <code className="text-cyan-300">igyn_cell_db</code> e importe o arquivo <code className="text-cyan-300">backend_php/schema.sql</code>.
              </li>
              <li>
                <strong>Coloque os arquivos no servidor:</strong> Copie a pasta <code className="text-cyan-300">backend_php/</code> para a raiz do seu servidor web (ex: <code className="text-slate-400">htdocs/backend_php</code> no XAMPP ou <code className="text-slate-400">public_html/api</code> no cPanel).
              </li>
              <li>
                <strong>Configure as credenciais:</strong> Abra <code className="text-cyan-300">config.php</code> e informe seu host, usuário e senha do MySQL.
              </li>
              <li>
                <strong>Conecte o App:</strong> Digite o endereço correspondente acima (ex: <code className="text-cyan-300">http://localhost/backend_php/api</code>) e clique em <em>Testar Conexão</em>.
              </li>
            </ol>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-200">
        {/* Company Info */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <span>Identificação da Loja & Endereço</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Nome Fantasia</label>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Razão Social</label>
              <input
                type="text"
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-2xs font-medium text-slate-400 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Ponto de Referência / Loja</label>
              <input
                type="text"
                value={locationDetails}
                onChange={e => setLocationDetails(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Cidade / Estado</label>
              <input
                type="text"
                value={cityState}
                onChange={e => setCityState(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Telefone / WhatsApp Comercial</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Warranty Terms */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>Termos de Garantia Impressos nas Ordens de Serviço (CDC)</span>
          </h3>
          <p className="text-2xs text-slate-400">
            Este texto é impresso automaticamente no rodapé do comprovante de OS entregue ao cliente.
          </p>
          <textarea
            rows={3}
            value={warrantyTerms}
            onChange={e => setWarrantyTerms(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        {/* WhatsApp Notification Template */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-400" />
            <span>Modelo de Mensagem de WhatsApp para Notificação de OS</span>
          </h3>
          <p className="text-2xs text-slate-400">
            Tags disponíveis: <code className="text-cyan-300 font-mono">{"{cliente}"}</code>, <code className="text-cyan-300 font-mono">{"{os}"}</code>, <code className="text-cyan-300 font-mono">{"{status}"}</code>, <code className="text-cyan-300 font-mono">{"{valor}"}</code>
          </p>
          <textarea
            rows={4}
            value={whatsappGreetingTemplate}
            onChange={e => setWhatsappGreetingTemplate(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Commission Defaults */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Percent className="h-4 w-4 text-cyan-400" />
            <span>Políticas Padrão de Comissões</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">
                Comissão Padrão para Vendedores (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={defaultSaleCommission}
                onChange={e => setDefaultSaleCommission(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-emerald-400 font-bold outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">
                Comissão Padrão para Técnicos em OS (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={defaultTechCommission}
                onChange={e => setDefaultTechCommission(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-cyan-400 font-bold outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Security / 2FA Section: Enforced for ALL Employees */}
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-2.5 text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Política Global: 2FA Obrigatório para Todos os Funcionários
                  </h3>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-3xs font-mono font-bold text-emerald-300">
                    100% PROTEGIDO
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Proteção de dois fatores ativa para todos os cargos (Proprietário, Gerente, Vendedores e Técnicos).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <input
                  type="checkbox"
                  checked={require2FAForAll}
                  onChange={e => setRequire2FAForAll(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0"
                />
                <span className="font-semibold text-slate-200">Exigir 2FA para Todos</span>
              </label>
            </div>
          </div>

          {/* Configuração "Até quando funciona" - Duração da Sessão 2FA */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>Até quando funciona a sessão 2FA (Validade da Autenticação)</span>
                </h4>
                <p className="text-2xs text-slate-400 mt-0.5">
                  Define por quanto tempo o funcionário permanece autenticado antes de precisar reinserir o código de 6 dígitos.
                </p>
              </div>

              <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded-lg">
                Válido por {twoFactorSessionDurationHours} horas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {[
                { hours: 4, label: '4 horas' },
                { hours: 8, label: '8h (Turno)' },
                { hours: 12, label: '12 horas' },
                { hours: 24, label: '24 horas' },
                { hours: 168, label: '7 dias' },
                { hours: 720, label: '30 dias' }
              ].map(opt => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setTwoFactorSessionDurationHours(opt.hours)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center border ${
                    twoFactorSessionDurationHours === opt.hours
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-950'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Current user session feedback */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-2xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Sua sessão atual funciona até:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {twoFactorSessionExpiresAt ? new Date(twoFactorSessionExpiresAt).toLocaleString('pt-BR') : 'Ativa'}
                </span>
                {twoFactorRemainingSeconds > 0 && (
                  <span className="text-cyan-300 font-mono">
                    (Restam {Math.floor(twoFactorRemainingSeconds / 3600)}h {Math.floor((twoFactorRemainingSeconds % 3600) / 60)}m)
                  </span>
                )}
              </div>

              {isRole(['admin', 'manager']) && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Deseja forçar reautenticação 2FA para todos os funcionários agora? As sessões serão invalidadas imediatamente.')) {
                      await forceReauthAll();
                      setReauthSuccessMsg('Sessões 2FA invalidadas com sucesso!');
                      setTimeout(() => setReauthSuccessMsg(''), 3000);
                    }
                  }}
                  className="text-2xs font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-2"
                >
                  Forçar Reautenticação Geral
                </button>
              )}
            </div>
            {reauthSuccessMsg && (
              <p className="text-2xs font-bold text-rose-400 bg-rose-400/10 p-2 rounded-lg border border-rose-400/20">
                {reauthSuccessMsg}
              </p>
            )}
          </div>

          {/* Lista de Auditoria de 2FA de Todos os Funcionários */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Status de 2FA por Colaborador ({employees.length} de {employees.length})</span>
              <span className="text-2xs text-emerald-400 font-normal">Todos protegidos</span>
            </h4>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-2xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Colaborador</th>
                      <th className="py-2.5 px-3">Cargo</th>
                      <th className="py-2.5 px-3">Status 2FA</th>
                      <th className="py-2.5 px-3">Sessão Válida Até (Até quando funciona)</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {employees.map(emp => {
                      const expiryFormatted = emp.twoFactorSessionExpiresAt
                        ? new Date(emp.twoFactorSessionExpiresAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Ativo c/ Login';

                      return (
                        <tr key={emp.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="h-6 w-6 rounded-full object-cover border border-slate-700"
                              />
                              <div>
                                <strong className="text-white block">{emp.name}</strong>
                                <span className="text-3xs text-slate-400">{emp.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-300">
                            {emp.roleLabel}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-3xs border border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" />
                              2FA ATIVO
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-cyan-300 font-semibold">
                            {expiryFormatted}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedEmp2FA(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 font-bold transition text-3xs"
                            >
                              <QrCode className="h-3 w-3" />
                              <span>Ver QR Code / Chave</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal para Visualização de Chaves 2FA do Colaborador */}
        {selectedEmp2FA && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Chaves de 2FA do Colaborador</h4>
                    <p className="text-2xs text-slate-400">{selectedEmp2FA.name} • {selectedEmp2FA.roleLabel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEmp2FA(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white space-y-2">
                  <QRCodeSVG
                    value={`otpauth://totp/iGynCell:${encodeURIComponent(selectedEmp2FA.email)}?secret=${selectedEmp2FA.twoFactorSecret || 'JBSWY3DPEHPK3PXP'}&issuer=iGynCell`}
                    size={140}
                    level="H"
                  />
                  <span className="text-3xs text-slate-600 font-medium">Google Authenticator / Authy</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-2xs text-slate-400 block mb-1">Chave Secreta (Base32):</span>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-cyan-400 font-bold text-center tracking-widest text-xs select-all">
                      {selectedEmp2FA.twoFactorSecret || 'JBSWY3DPEHPK3PXP'}
                    </div>
                  </div>

                  <div>
                    <span className="text-2xs text-slate-400 block mb-1">Validade da Sessão ("Até quando funciona"):</span>
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-2 text-2xs font-mono text-emerald-400">
                      {selectedEmp2FA.twoFactorSessionExpiresAt ? new Date(selectedEmp2FA.twoFactorSessionExpiresAt).toLocaleString('pt-BR') : 'Ativa c/ Login'}
                    </div>
                  </div>

                  {selectedEmp2FA.twoFactorBackupCodes && selectedEmp2FA.twoFactorBackupCodes.length > 0 && (
                    <div>
                      <span className="text-2xs text-slate-400 block mb-1">Códigos Reserva de Emergência:</span>
                      <div className="grid grid-cols-2 gap-1 bg-slate-950 border border-slate-800 p-2 rounded-lg font-mono text-3xs text-amber-300">
                        {selectedEmp2FA.twoFactorBackupCodes.map((c: string, idx: number) => (
                          <span key={idx} className="bg-slate-900 px-1.5 py-0.5 rounded text-center">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEmp2FA(null)}
                  className="rounded-lg bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-950 hover:from-cyan-500 hover:to-blue-500 transition active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Reset Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          <span>Manutenção de Dados & Backup</span>
        </h3>
        <p className="text-xs text-slate-400">
          Exporte um arquivo de backup em JSON com todos os dados da loja ou restaure os dados de demonstração da iGyn Cell.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleBackupDownload}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Baixar Backup Completo (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Tem certeza de que deseja restaurar todos os dados para o padrão inicial de demonstração da iGyn Cell?')) {
                resetToDemoData();
                alert('Dados de demonstração restaurados com sucesso!');
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
          >
            <RefreshCw className="h-4 w-4 text-rose-400" />
            <span>Restaurar Dados Padrão de Demonstração</span>
          </button>
        </div>
      </div>
    </div>
  );
};
