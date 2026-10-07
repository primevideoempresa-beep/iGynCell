import React, { useState } from 'react';
import { FinancialEntry } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Landmark, DollarSign, Calendar, Tag, User } from 'lucide-react';

interface FinancialEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'income' | 'expense';
}

export const FinancialEntryModal: React.FC<FinancialEntryModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense'
}) => {
  const { addFinancialEntry } = useApp();

  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [category, setCategory] = useState(
    defaultType === 'expense' ? 'Fornecedor de Peças' : 'Ordem de Serviço'
  );
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(100);
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'paid' | 'pending'>('pending');
  const [recipientOrPayer, setRecipientOrPayer] = useState('');

  const incomeCategories = [
    'Ordem de Serviço',
    'Venda de Balcão',
    'Venda a Prazo',
    'Rendimento / Outros'
  ];

  const expenseCategories = [
    'Fornecedor de Peças',
    'Aluguel Central Park',
    'Salários / Colaboradores',
    'Comissões',
    'Energia / Internet',
    'Impostos & Taxas',
    'Ferramentas & Insumos',
    'Outras Despesas'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addFinancialEntry({
      type,
      category,
      description,
      amount,
      dueDate,
      paymentDate: status === 'paid' ? dueDate : undefined,
      status,
      recipientOrPayer
    });

    setDescription('');
    setRecipientOrPayer('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Lançamento Financeiro"
      subtitle="Cadastre uma conta a pagar ou conta a receber"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('Ordem de Serviço');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📥 Receita (Conta a Receber)
          </button>
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('Fornecedor de Peças');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📤 Despesa (Conta a Pagar)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Categoria *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            >
              {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">
              {type === 'income' ? 'Pagador / Cliente *' : 'Favorecido / Fornecedor *'}
            </label>
            <input
              type="text"
              required
              value={recipientOrPayer}
              onChange={e => setRecipientOrPayer(e.target.value)}
              placeholder={type === 'income' ? 'Nome do cliente' : 'Nome do fornecedor / empresa'}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-2xs font-medium text-slate-400 mb-1">Descrição do Lançamento *</label>
          <input
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ex: Aluguel Loja 34 Central Park Shopping ou NF Peças iFix Tech"
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Valor (R$) *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Data de Vencimento *</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Situação / Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago / Liquidado</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950 hover:from-cyan-500 hover:to-blue-500 transition"
          >
            Salvar Lançamento
          </button>
        </div>
      </form>
    </Modal>
  );
};
