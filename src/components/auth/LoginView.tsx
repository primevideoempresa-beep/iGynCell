import React, { useState } from 'react';
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
  Apple
} from 'lucide-react';
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
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotResult, setForgotResult] = useState<{ tempToken?: string; message?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await login(email, password, twoFactorCode || undefined);
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
      const codeToSend = useRecoveryCode ? recoveryCode : twoFactorCode;
      const res = await verify2FA(codeToSend, useRecoveryCode);
      if (!res.success) {
        setErrorMsg(res.error || 'Código incorreto ou expirado. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao validar código 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel2FA = () => {
    cancel2FA();
    setTwoFactorCode('');
    setRecoveryCode('');
    setUseRecoveryCode(false);
    setErrorMsg('');
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
            <div className="space-y-6">
              <div className="login-title">
                <div className="user-icon-brand">
                  <ShieldCheck className="text-cyan-400 h-8 w-8" />
                </div>
                <div>
                  <h2>Autenticação em 2 Etapas</h2>
                  <p>
                    Proteção ativada para <strong className="text-white">{pendingUser2FA?.name}</strong>
                  </p>
                </div>
              </div>

              {/* Collaborator chip */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <img
                  src={pendingUser2FA?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={pendingUser2FA?.name}
                  className="h-10 w-10 rounded-lg object-cover border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white block truncate">{pendingUser2FA?.name}</span>
                  <span className="text-2xs text-cyan-400 font-mono block truncate">{pendingUser2FA?.email}</span>
                </div>
                <span className="rounded bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 text-2xs font-bold text-cyan-300">
                  2FA Ativo
                </span>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handle2FASubmit} className="space-y-4">
                {!useRecoveryCode ? (
                  /* Standard 6-digit TOTP Input */
                  <div className="form-group-custom">
                    <label>Código do Google Authenticator (6 dígitos)</label>
                    <div className="input-container-custom">
                      <KeyRound className="mr-3 h-5 w-5 text-[#6685a8]" />
                      <input
                        type="text"
                        maxLength={6}
                        autoFocus
                        required
                        value={twoFactorCode}
                        onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="tracking-[0.5em] font-mono text-center text-lg font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  /* Single-use Recovery Code Input */
                  <div className="form-group-custom">
                    <label>Código de Recuperação (Contingência)</label>
                    <div className="input-container-custom">
                      <Lock className="mr-3 h-5 w-5 text-amber-400" />
                      <input
                        type="text"
                        autoFocus
                        required
                        value={recoveryCode}
                        onChange={e => setRecoveryCode(e.target.value.toUpperCase())}
                        placeholder="Ex: A89B-23KD"
                        className="font-mono text-center tracking-wider text-base font-bold uppercase"
                      />
                    </div>
                    <span className="text-2xs text-slate-400 block mt-1">
                      Digite um dos códigos de uso único salvos na ativação.
                    </span>
                  </div>
                )}

                {/* Switch between TOTP and Recovery Code */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecoveryCode(!useRecoveryCode);
                      setErrorMsg('');
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    {!useRecoveryCode
                      ? 'Não está com o celular? Usar código de recuperação'
                      : 'Voltar e usar o código do Google Authenticator'}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel2FA}
                    className="flex-1 h-[52px] rounded-xl border border-[#284666] text-[#c1d1e5] hover:bg-[#111f37] transition font-semibold text-xs"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || (!useRecoveryCode ? twoFactorCode.length < 6 : recoveryCode.trim().length < 4)}
                    className="login-button-custom flex-1 h-[52px]"
                  >
                    <span>{isLoading ? 'Validando...' : 'Confirmar Acesso'}</span>
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
    </main>
  );
};

