import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  RefreshCw,
  FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { Employee } from '../../types';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEmployee?: Employee | null;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  targetEmployee
}) => {
  const {
    currentUser,
    setup2FA,
    confirm2FA,
    disable2FA,
    regenerateRecoveryCodes,
    employees
  } = useAuth();

  // The employee whose 2FA is being viewed/configured (defaults to logged-in user)
  const employee = targetEmployee || currentUser;
  const currentEmpInList = employees.find(e => e.id === employee?.id) || employee;
  const isEnabled = !!currentEmpInList?.twoFactorEnabled;

  // Setup wizard state: 'idle' | 'configuring' | 'success_codes' | 'disable_confirm' | 'view_recovery_codes'
  const [stage, setStage] = useState<'idle' | 'configuring' | 'success_codes' | 'disable_confirm' | 'view_recovery_codes'>('idle');
  const [activeTab, setActiveTab] = useState<'qrcode' | 'manual'>('qrcode');

  // Generated secret & QR
  const [secret, setSecret] = useState<string>('');
  const [otpauthUrl, setOtpauthUrl] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [hasConfirmedSaveCodes, setHasConfirmedSaveCodes] = useState(false);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStage('idle');
      setErrorMsg('');
      setSuccessMsg('');
      setVerifyCode('');
      setConfirmPassword('');
      setCopiedKey(false);
      setCopiedCodes(false);
      setHasConfirmedSaveCodes(false);
    }
  }, [isOpen, employee?.id]);

  if (!isOpen || !employee) return null;

  // Format secret key with spaces for readability (e.g. "JBSW Y3DP EHPK 3PXP")
  const formattedSecret = secret ? secret.match(/.{1,4}/g)?.join(' ') || secret : '';

  // Start setup flow
  const handleStartSetup = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await setup2FA(employee.id);
      if (data.success) {
        setSecret(data.secret);
        setOtpauthUrl(data.otpauthUrl);
        setStage('configuring');
      } else {
        setErrorMsg('Não foi possível gerar a chave de segurança. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao iniciar configuração do 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm verification code
  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length < 6) {
      setErrorMsg('Digite os 6 dígitos gerados pelo aplicativo autenticador.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await confirm2FA(employee.id, secret, verifyCode);
      if (result.success && result.recoveryCodes) {
        setRecoveryCodes(result.recoveryCodes);
        setStage('success_codes');
      } else {
        setErrorMsg(result.error || 'Código incorreto ou expirado. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao validar código.');
    } finally {
      setIsLoading(false);
    }
  };

  // Disable 2FA with password confirmation
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPassword) {
      setErrorMsg('Informe sua senha para confirmar a desativação.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await disable2FA(employee.id, confirmPassword);
      if (result.success) {
        setStage('idle');
        setConfirmPassword('');
        setSuccessMsg('Autenticação em dois fatores desativada com sucesso.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(result.error || 'Senha incorreta. Não foi possível desativar.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao desativar 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate recovery codes
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPassword) {
      setErrorMsg('Informe sua senha para visualizar ou gerar novos códigos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await regenerateRecoveryCodes(employee.id, confirmPassword);
      if (result.success && result.recoveryCodes) {
        setRecoveryCodes(result.recoveryCodes);
        setStage('success_codes');
        setConfirmPassword('');
      } else {
        setErrorMsg(result.error || 'Senha incorreta.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao gerar novos códigos.');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy secret key
  const handleCopyKey = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // Copy recovery codes
  const handleCopyRecoveryCodes = () => {
    if (!recoveryCodes.length) return;
    const text = [
      '========================================',
      'iGyn Cell - Códigos de Recuperação 2FA',
      `Colaborador: ${employee.name} (${employee.email})`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '========================================',
      '',
      'Cada código abaixo só pode ser utilizado uma única vez:',
      ...recoveryCodes.map((code, idx) => `[${idx + 1}] ${code}`),
      '',
      'Guarde este arquivo em local seguro e confidencial.'
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  // Download recovery codes as .txt file
  const handleDownloadRecoveryCodes = () => {
    if (!recoveryCodes.length) return;
    const text = [
      '========================================',
      'iGyn Cell ERP - Códigos de Recuperação 2FA',
      `Colaborador: ${employee.name} (${employee.email})`,
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      '========================================',
      '',
      'IMPORTANTE: Cada código é de uso único caso você perca',
      'o acesso ao seu dispositivo Google Authenticator.',
      '',
      ...recoveryCodes.map((code, idx) => `Código ${idx + 1}: ${code}`),
      '',
      'Guarde em segurança e não compartilhe com terceiros.'
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `igyn_cell_codigos_recuperacao_${employee.name.replace(/\s+/g, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-cyan-950/40 text-slate-100">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/95 px-6 py-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-950">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Autenticação em dois fatores</span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-2xs font-semibold text-slate-300">
                  Opcional
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Proteja sua conta com um aplicativo autenticador.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Messages */}
        <div className="px-6 pt-4">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Body content based on stage */}
        <div className="p-6 pt-2 space-y-6">
          {/* ========================================================
              STAGE 1: IDLE - Status Card matching prompt requirements
             ======================================================== */}
          {stage === 'idle' && (
            <div className="space-y-6">
              {/* Account summary banner */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="h-10 w-10 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">{employee.name}</span>
                    <span className="text-2xs text-slate-400">{employee.email}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xs uppercase tracking-wider text-slate-400 block font-semibold">
                    Status da proteção
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-xs ${
                      isEnabled ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isEnabled ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                    {isEnabled ? 'Ativada' : 'Desativada'}
                  </span>
                </div>
              </div>

              {/* Main Authenticator Card required by prompt */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm">
                      <Smartphone className="h-6 w-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">Google Authenticator</h3>
                        {isEnabled ? (
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-2xs font-bold text-emerald-300 border border-emerald-500/30">
                            Ativado
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-2xs font-semibold text-slate-400 border border-slate-700">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Adicione uma segunda etapa ao seu login.
                      </p>
                    </div>
                  </div>

                  <div>
                    {!isEnabled ? (
                      <button
                        type="button"
                        onClick={handleStartSetup}
                        disabled={isLoading}
                        className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950 hover:from-cyan-500 hover:to-blue-500 transition active:scale-95 disabled:opacity-50"
                      >
                        {isLoading ? 'Carregando...' : 'Ativar'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmPassword('');
                          setErrorMsg('');
                          setStage('disable_confirm');
                        }}
                        className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition active:scale-95"
                      >
                        Desativar
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional details when enabled */}
                {isEnabled && (
                  <div className="border-t border-slate-800/80 pt-4 space-y-3 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-2xs text-slate-400">
                      <span>Aplicativo vinculado:</span>
                      <span className="text-slate-200 font-mono">Google Authenticator / TOTP</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmPassword('');
                          setErrorMsg('');
                          setStage('view_recovery_codes');
                        }}
                        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Códigos de Recuperação</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStartSetup}
                        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Reconfigurar Dispositivo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Explanatory bullet cards */}
              <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 space-y-2.5 text-xs text-slate-400">
                <span className="font-bold text-slate-300 block text-2xs uppercase tracking-wider">
                  Como funciona a segurança em duas etapas
                </span>
                <ul className="space-y-2 text-slate-300 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>
                      <strong>1º Fator:</strong> Sua senha normal de colaborador da iGyn Cell.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>
                      <strong>2º Fator:</strong> Um código de 6 dígitos gerado a cada 30 segundos pelo app no seu celular.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>
                      <strong>Códigos de contingência:</strong> Códigos de uso único gerados para quando você não estiver com o celular.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================
              STAGE 2: CONFIGURING - QR Code & Manual Key Wizard
             ======================================================== */}
          {stage === 'configuring' && (
            <div className="space-y-6">
              {/* Step indicator */}
              <div className="space-y-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-cyan-400">
                  Etapa 1 de 2: Conectar Aplicativo
                </span>
                <h3 className="text-base font-bold text-white">
                  Escaneie o QR Code no seu aplicativo autenticador
                </h3>
                <p className="text-xs text-slate-400">
                  Abra o Google Authenticator, Microsoft Authenticator ou Authy no seu celular e adicione a conta.
                </p>
              </div>

              {/* Switcher Tab: QR Code vs Manual Key */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('qrcode')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                    activeTab === 'qrcode'
                      ? 'bg-slate-800 text-cyan-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span>Escanear QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                    activeTab === 'manual'
                      ? 'bg-slate-800 text-cyan-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Chave de Configuração Manual</span>
                </button>
              </div>

              {/* QR Code Tab View */}
              {activeTab === 'qrcode' && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-4">
                  <div className="rounded-2xl bg-white p-4 shadow-xl shadow-cyan-950/30">
                    <QRCodeSVG
                      value={otpauthUrl || `otpauth://totp/iGynCell:${employee.email}?secret=${secret}&issuer=iGynCell`}
                      size={180}
                      level="M"
                    />
                  </div>

                  <div className="text-center space-y-1 max-w-xs">
                    <span className="text-xs font-bold text-white block">
                      Aponte a câmera no aplicativo
                    </span>
                    <span className="text-2xs text-slate-400 block">
                      Conta: <strong className="text-slate-300">{employee.email}</strong> • Emissor: <strong className="text-cyan-400">iGynCell</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Manual Key Tab View */}
              {activeTab === 'manual' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Chave Secreta de Configuração (Base32):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-sm font-bold tracking-wider text-cyan-300 select-all">
                        {formattedSecret}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition active:scale-95"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-2xs text-slate-400 rounded-xl bg-slate-900/60 p-3 border border-slate-800">
                    <p><strong>Nome da conta:</strong> {employee.email}</p>
                    <p><strong>Tipo de chave:</strong> Com base no tempo (TOTP / 30s)</p>
                  </div>
                </div>
              )}

              {/* Step 2: Code Confirmation Input */}
              <form onSubmit={handleConfirmCode} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="space-y-1">
                  <span className="text-2xs font-bold uppercase tracking-wider text-cyan-400">
                    Etapa 2 de 2: Confirmação do código
                  </span>
                  <h4 className="text-xs font-bold text-white">
                    Digite o código de 6 dígitos gerado pelo aplicativo
                  </h4>
                  <p className="text-2xs text-slate-400">
                    Somente depois da validação o sistema ativará a autenticação de dois fatores.
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-center font-mono text-2xl font-extrabold tracking-[0.5em] text-cyan-300 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStage('idle');
                      setVerifyCode('');
                    }}
                    className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || verifyCode.length < 6}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950 hover:from-cyan-500 hover:to-blue-500 transition active:scale-95 disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Validando...' : 'Confirmar e Ativar 2FA'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              STAGE 3: SUCCESS & RECOVERY CODES
             ======================================================== */}
          {stage === 'success_codes' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Autenticação em Dois Fatores Ativada!
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Sua conta agora está totalmente protegida com verificação em duas etapas.
                </p>
              </div>

              {/* Recovery Codes Section */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-300">
                      Salve seus Códigos de Recuperação de Contingência
                    </h4>
                    <p className="text-2xs text-slate-300 leading-relaxed">
                      Se você perder o acesso ao seu celular, cada um destes códigos poderá ser usado uma única vez para entrar na sua conta.
                    </p>
                  </div>
                </div>

                {/* Grid of codes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {recoveryCodes.map((code, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 text-center font-mono text-xs font-bold tracking-wider text-cyan-300 select-all"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                {/* Actions: Copy & Download */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyRecoveryCodes}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                  >
                    {copiedCodes ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>Códigos Copiados!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copiar Todos os Códigos</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadRecoveryCodes}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar Arquivo (.txt)</span>
                  </button>
                </div>
              </div>

              {/* Confirmation acknowledgment */}
              <label className="flex items-center gap-3 cursor-pointer rounded-xl bg-slate-950 p-3.5 border border-slate-800">
                <input
                  type="checkbox"
                  checked={hasConfirmedSaveCodes}
                  onChange={e => setHasConfirmedSaveCodes(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0 h-4 w-4"
                />
                <span className="text-2xs text-slate-300">
                  Confirmo que salvei meus códigos de recuperação em um local seguro.
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setStage('idle');
                  onClose();
                }}
                disabled={!hasConfirmedSaveCodes}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950 hover:from-emerald-500 hover:to-teal-500 transition active:scale-95 disabled:opacity-40"
              >
                Concluir Configuração
              </button>
            </div>
          )}

          {/* ========================================================
              STAGE 4: DISABLE CONFIRMATION WITH PASSWORD
             ======================================================== */}
          {stage === 'disable_confirm' && (
            <form onSubmit={handleDisable2FA} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                  <h3 className="text-sm font-bold text-white">Desativar Autenticação em Dois Fatores</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ao desativar, sua conta passará a exigir apenas a senha para efetuar o login, reduzindo a camada de segurança contra acessos não autorizados.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
                <label className="text-xs font-semibold text-slate-300 block">
                  Confirme sua senha atual para desativar:
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Digite sua senha de acesso"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white outline-none focus:border-rose-500 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStage('idle');
                    setConfirmPassword('');
                  }}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !confirmPassword}
                  className="rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950 hover:bg-rose-500 transition active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Desativando...' : 'Confirmar Desativação'}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================
              STAGE 5: REGENERATE / VIEW RECOVERY CODES WITH PASSWORD
             ======================================================== */}
          {stage === 'view_recovery_codes' && (
            <form onSubmit={handleRegenerateCodes} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <KeyRound className="h-5 w-5" />
                  <h3 className="text-sm font-bold text-white">Gerar Novos Códigos de Recuperação</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Por segurança, informe sua senha para invalidar os códigos antigos e gerar um novo conjunto de 8 códigos de contingência.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
                <label className="text-xs font-semibold text-slate-300 block">
                  Sua senha de acesso atual:
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white outline-none focus:border-cyan-500 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStage('idle');
                    setConfirmPassword('');
                  }}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !confirmPassword}
                  className="rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950 hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Gerando...' : 'Gerar Novos Códigos'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
