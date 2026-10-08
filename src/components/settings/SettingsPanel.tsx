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
  QrCode
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
  const { isRole } = useAuth();

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
      whatsappGreetingTemplate
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

        {/* Security / 2FA Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-rose-500/20 border border-rose-500/40 p-2 text-rose-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Segurança & Autenticação de Dois Fatores (2FA)</h3>
                <p className="text-2xs text-slate-400">Proteja seu acesso usando aplicativos como Google Authenticator ou Authy.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {userData?.twoFactorEnabled ? (
                <div className="flex flex-col items-end">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-400 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    2FA ATIVADO
                  </span>
                  <button
                    type="button"
                    onClick={handleDisable2FA}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline underline-offset-4"
                  >
                    Desativar Proteção
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-xs font-bold text-rose-400 mb-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    2FA DESATIVADO
                  </span>
                  {!isSettingUp2FA && (
                    <button
                      type="button"
                      onClick={handleStartSetup2FA}
                      className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-950/40"
                    >
                      Ativar 2FA Agora
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {isSettingUp2FA && !userData?.twoFactorEnabled && (
            <div className="mt-4 bg-slate-950/80 p-6 rounded-2xl border border-cyan-500/30 space-y-6 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-white p-3 rounded-2xl shadow-2xl">
                    <QRCodeSVG value={qrCodeUri} size={160} level="H" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Escaneie com seu App de Autenticação</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-slate-950">1</span>
                      Configuração Manual
                    </h4>
                    <p className="text-2xs text-slate-400 leading-relaxed">
                      Se não puder escanear, insira esta chave manualmente no seu aplicativo:
                    </p>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-sm text-cyan-400 font-bold tracking-[0.2em] text-center shadow-inner">
                      {twoFactorSecret}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-slate-950">2</span>
                      Confirme o Código
                    </h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        maxLength={6}
                        value={confirmationCode}
                        onChange={e => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000 000"
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-base font-mono font-bold tracking-[0.4em] text-center text-white outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        disabled={confirmationCode.length < 6 || isConfirming2FA}
                        onClick={handleConfirmActivation}
                        className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition disabled:opacity-40 shadow-lg shadow-emerald-950/20"
                      >
                        {isConfirming2FA ? 'Validando...' : 'Ativar'}
                      </button>
                    </div>
                    {twoFactorError && (
                      <p className="text-2xs font-bold text-rose-400 bg-rose-400/10 px-3 py-1.5 rounded-lg border border-rose-400/20">{twoFactorError}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingUp2FA(false)}
                  className="text-2xs font-bold text-slate-500 hover:text-white transition"
                >
                  Cancelar Setup
                </button>
              </div>
            </div>
          )}
        </div>

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
