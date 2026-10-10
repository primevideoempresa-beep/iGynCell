import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, KeyRound, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Reauth2FAModal: React.FC = () => {
  const {
    currentUser,
    is2FASessionExpired,
    showReauthModal,
    setShowReauthModal,
    renew2FASession,
    logout
  } = useAuth();

  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isOpen = (is2FASessionExpired || showReauthModal) && !!currentUser;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const ok = await renew2FASession(code);
      if (ok) {
        setCode('');
        setShowReauthModal(false);
      } else {
        setErrorMsg('Código 2FA inválido ou expirado. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao validar código 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sessão 2FA Expirada</h3>
            <p className="text-2xs text-slate-400">
              Autenticação de dois fatores obrigatória para todos os colaboradores.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center gap-3">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={currentUser?.name}
            className="h-10 w-10 rounded-lg object-cover border border-slate-700"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-white block truncate">{currentUser?.name}</span>
            <span className="text-2xs text-slate-400 block truncate">{currentUser?.email} • {currentUser?.roleLabel}</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-2xs text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Clock className="h-4 w-4" />
            <span>Validade da Sessão de Trabalho Atingida</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Para garantir a segurança dos dados da loja, confirme o código do app autenticador para estender a validade da sua sessão.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-2xs font-semibold text-slate-300 mb-1.5 block">Código de 6 Dígitos do App:</label>
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 focus-within:border-cyan-500">
              <ShieldCheck className="h-5 w-5 text-cyan-400 mr-2 shrink-0" />
              <input
                type="text"
                maxLength={8}
                autoFocus
                required
                value={code}
                onChange={e => setCode(e.target.value.replace(/[^0-9-]/g, ''))}
                placeholder="000 000"
                className="w-full bg-transparent font-mono text-center text-lg font-bold tracking-[0.3em] text-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-2xs">
            <span className="text-slate-400">Teste rápido:</span>
            <button
              type="button"
              onClick={() => setCode('123456')}
              className="text-amber-300 hover:underline font-mono"
            >
              Preencher 123456
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/80 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="flex-1 rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950 hover:bg-cyan-500 transition disabled:opacity-50"
            >
              {isLoading ? 'Renovando...' : 'Renovar Sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
