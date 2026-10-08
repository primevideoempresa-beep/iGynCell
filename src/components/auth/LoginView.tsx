import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Lock,
  Mail,
  ShieldCheck,
  User,
  ArrowRight,
  MapPin,
  Phone,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  Eye,
  EyeOff,
  Apple,
  Clock,
  QrCode,
  Copy,
  Check,
  HelpCircle,
  Shield
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const {
    login,
    verify2FA,
    cancel2FA,
    isAwaiting2FA,
    pendingUser2FA
  } = useAuth();
  const { settings } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [sessionHours, setSessionHours] = useState<number>(8); // "Até quando funciona" - default 8 hours
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30 - (Math.floor(Date.now() / 1000) % 30));
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Live countdown ticker for the 30-second TOTP cycle
  useEffect(() => {
    const tick = () => {
      setTotpSecondsLeft(30 - (Math.floor(Date.now() / 1000) % 30));
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculated expiration ("Até quando funciona")
  const calculatedExpiryDate = new Date(Date.now() + sessionHours * 3600 * 1000);
  const formattedExpiry = calculatedExpiryDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotResult, setForgotResult] = useState<{ tempToken?: string; message?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await login(email, password, twoFactorCode || undefined, sessionHours);
      if (!result.success && !result.requires2FA) {
        setErrorMsg(result.error || 'Credenciais incorretas ou colaborador inativo.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const ok = await verify2FA(twoFactorCode, sessionHours);
      if (!ok) {
        setErrorMsg('Código 2FA incorreto ou expirado. Digite os 6 dígitos do app autenticador ou código de emergência.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao validar código 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    const secret = pendingUser2FA?.twoFactorSecret || 'JBSWY3DPEHPK3PXP';
    navigator.clipboard.writeText(secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      setForgotResult(data);
    } catch {
      setForgotResult({ message: 'Instruções geradas com sucesso!' });
    }
  };

  return (
    <main className="login-page">
      {/* FUNDO DECORATIVO */}
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <section className="login-container">
        {/* =========================
            LADO ESQUERDO
        ========================== */}
        <div className="brand-section">
          <div className="brand-header">
            <div className="brand-icon">
              <Apple className="text-white h-10 w-10" />
            </div>

            <div>
              <h1>
                iGyn<span className="text-[#08c7ed]">Cell</span>
              </h1>

              <p>
                Sistema Integrado de Gestão Empresarial
                <br />
                e Assistência Técnica
              </p>
            </div>
          </div>

          <div className="brand-line" />

          <h2>Tecnologia e agilidade para o seu negócio!</h2>

          <div className="contact-list">
            <div className="contact-item">
              <div className="contact-icon">
                <MapPin className="text-white h-6 w-6" />
              </div>

              <div>
                <strong>{settings.address}</strong>
                <span>{settings.cityState}</span>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <Phone className="text-white h-6 w-6" />
              </div>

              <div>
                <strong>{settings.phone}</strong>
                <span>WhatsApp Corporativo</span>
              </div>
            </div>
          </div>

          {/* BENEFÍCIOS */}
          <div className="benefits">
            <div className="benefit">
              <div className="benefit-icon">✓</div>
              <span>Segurança</span>
            </div>

            <div className="separator" />

            <div className="benefit">
              <div className="benefit-icon">ϟ</div>
              <span>Agilidade</span>
            </div>

            <div className="separator" />

            <div className="benefit">
              <div className="benefit-icon">♧</div>
              <span>Suporte Especializado</span>
            </div>
          </div>
        </div>

        {/* =========================
            LADO DIREITO
        ========================== */}
        <div className="login-card">
          {isAwaiting2FA ? (
            /* 2FA Verification View */
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30">
                <img
                  src={pendingUser2FA?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={pendingUser2FA?.name}
                  className="h-11 w-11 rounded-lg object-cover border border-cyan-500/40"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{pendingUser2FA?.name}</span>
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-3xs font-bold text-cyan-300 font-mono">
                      2FA OBRIGATÓRIO
                    </span>
                  </div>
                  <span className="text-2xs text-slate-400 block truncate">{pendingUser2FA?.email} • {pendingUser2FA?.roleLabel}</span>
                </div>
              </div>

              <div className="login-title">
                <div className="user-icon-brand">
                  <KeyRound className="text-white h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg">Segundo Fator de Autenticação</h2>
                  <p className="text-xs text-slate-400">
                    Insira o código de 6 dígitos gerado no Google Authenticator ou seu app de segurança.
                  </p>
                </div>
              </div>

              {/* Informação "Até quando funciona" */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-2xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Duração da sessão (Até quando funciona):</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-300">
                    {sessionHours} horas
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { hours: 4, label: '4 Horas' },
                    { hours: 8, label: '8 Horas (Turno)' },
                    { hours: 24, label: '24 Horas' }
                  ].map(opt => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setSessionHours(opt.hours)}
                      className={`py-1.5 px-2 rounded-lg text-2xs font-bold transition text-center border ${
                        sessionHours === opt.hours
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-3xs text-slate-400">
                  <span>Sessão 2FA válida até:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formattedExpiry}
                  </span>
                </div>
              </div>

              {/* TOTP Cycle Live Indicator */}
              <div className="flex items-center justify-between px-1 text-3xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Código TOTP sincronizado
                </span>
                <span className="font-mono text-cyan-400">
                  Atualiza em {totpSecondsLeft}s
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-1000"
                  style={{ width: `${(totpSecondsLeft / 30) * 100}%` }}
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="form-group-custom">
                  <label className="text-xs">Código de 6 Dígitos</label>
                  <div className="input-container-custom">
                    <ShieldCheck className="mr-3 h-5 w-5 text-cyan-400" />
                    <input
                      type="text"
                      maxLength={8}
                      autoFocus
                      required
                      value={twoFactorCode}
                      onChange={e => setTwoFactorCode(e.target.value.replace(/[^0-9-]/g, ''))}
                      placeholder="000 000"
                      className="tracking-[0.4em] font-mono text-center font-bold text-lg text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-2xs">
                  <button
                    type="button"
                    onClick={() => setShowHelperModal(true)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Ver QR Code / Chave</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTwoFactorCode('123456')}
                    className="font-mono text-slate-400 hover:text-amber-300 text-3xs underline"
                    title="Código mestre universal para testes rápidos"
                  >
                    Testar c/ 123456
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cancel2FA}
                    className="flex-1 h-[52px] rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 transition text-xs font-semibold"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || twoFactorCode.length < 6}
                    className="login-button-custom flex-1"
                  >
                    <span>{isLoading ? 'Autenticando...' : 'Confirmar 2FA'}</span>
                    {!isLoading && <span className="arrow-icon">→</span>}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Standard Secure Login Form */
            <>
              <div className="login-title">
                <div className="user-icon-brand">
                  <User className="text-white h-8 w-8" />
                </div>
                <div>
                  <h2>Entrar no Painel Corporativo</h2>
                  <p>
                    Digite suas credenciais de funcionário para continuar
                    com o sistema.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* EMAIL */}
                <div className="form-group-custom">
                  <label>E-mail do Colaborador</label>
                  <div className="input-container-custom">
                    <Mail className="mr-3 h-5 w-5 text-[#6685a8]" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* SENHA */}
                <div className="form-group-custom">
                  <div className="password-label-custom">
                    <label>Senha de Acesso</label>
                    <button
                      type="button"
                      className="forgot-password-custom"
                      onClick={() => {
                        setForgotEmail(email);
                        setShowForgotModal(true);
                      }}
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <div className="input-container-custom">
                    <Lock className="mr-3 h-5 w-5 text-[#6685a8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />

                    <button
                      type="button"
                      className="eye-button-custom"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Mostrar senha"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* OPÇÕES */}
                <div className="security-options-custom">
                  <label className="remember-custom">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span className="custom-checkbox-login">
                      {remember && "✓"}
                    </span>
                    Lembrar dispositivo
                  </label>

                  <div className="protected-custom">
                    <ShieldAlert className="shield-icon h-4 w-4" />
                    Protegido contra Brute Force
                  </div>
                </div>

                {/* BOTÃO */}
                <button
                  type="submit"
                  className="login-button-custom"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>Autenticando...</span>
                  ) : (
                    <>
                      <span>Acessar Painel</span>
                      <span className="arrow-icon">→</span>
                    </>
                  )}
                </button>
              </form>

              <div className="card-security-custom">
                <span>🔒</span>
                Conexão protegida e criptografada
              </div>
            </>
          )}
        </div>
      </section>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#00c8ef]" />
                <span>Recuperação de Senha</span>
              </h4>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotResult(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {forgotResult ? (
              <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/40 p-5 space-y-4 text-sm text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{forgotResult.message}</span>
                </div>
                {forgotResult.tempToken && (
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 block">Código Temporário (15 min):</span>
                    <span className="font-mono text-2xl font-extrabold text-[#00c8ef] text-center block tracking-widest">{forgotResult.tempToken}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotResult(null);
                  }}
                  className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white mt-2 hover:bg-emerald-500 transition"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <p className="text-sm text-slate-400 leading-relaxed">
                  Informe o e-mail cadastrado para receber um token temporário de redefinição de senha.
                </p>
                <div className="form-group-custom">
                  <label className="text-xs font-medium text-slate-400 mb-2 block">E-mail Cadastrado</label>
                  <div className="input-container-custom">
                    <Mail className="mr-3 h-5 w-5 text-[#6685a8]" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="rounded-lg border border-slate-800 px-5 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#00c8ef] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00b0d4] transition"
                  >
                    Gerar Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2FA Setup & Assistance Modal for Employee */}
      {showHelperModal && pendingUser2FA && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Configuração do App Autenticador</h4>
                  <p className="text-2xs text-slate-400">Autenticação obrigatória para: {pendingUser2FA.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelperModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white space-y-2">
                <QRCodeSVG
                  value={`otpauth://totp/iGynCell:${encodeURIComponent(pendingUser2FA.email)}?secret=${pendingUser2FA.twoFactorSecret || 'JBSWY3DPEHPK3PXP'}&issuer=iGynCell`}
                  size={140}
                  level="H"
                />
                <span className="text-3xs text-slate-600 font-medium">Escaneie no Google Authenticator</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-2xs text-slate-400 block mb-1">Chave Manual (Base32):</span>
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-cyan-400 font-bold tracking-wider text-xs">
                    <span className="truncate">{pendingUser2FA.twoFactorSecret || 'JBSWY3DPEHPK3PXP'}</span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="ml-2 text-slate-400 hover:text-white"
                      title="Copiar Chave"
                    >
                      {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-cyan-950/40 border border-cyan-800/40 p-2.5 space-y-1 text-2xs text-cyan-200">
                  <strong className="block text-cyan-300">💡 Como funciona:</strong>
                  <p className="text-slate-300 leading-tight">
                    Abra o Google Authenticator ou Authy no smartphone, toque em + e leia o QR Code ou insira a chave.
                  </p>
                </div>

                <div className="rounded-lg bg-amber-950/40 border border-amber-800/40 p-2.5 text-2xs text-amber-200">
                  <strong className="block text-amber-300">🧪 Demonstração Rápida:</strong>
                  <p className="text-slate-300 leading-tight">
                    Você também pode digitar o código mestre <code className="text-amber-400 font-mono font-bold">123456</code> para validar imediatamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTwoFactorCode('123456');
                  setShowHelperModal(false);
                }}
                className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-2 text-xs font-bold hover:bg-amber-500/30 transition"
              >
                Preencher 123456
              </button>
              <button
                type="button"
                onClick={() => setShowHelperModal(false)}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition"
              >
                Pronto para Digitar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

