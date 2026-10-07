import React, { useState, useEffect } from 'react';
import { Client } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { formatPhone, formatCpfCnpj } from '../../utils/formatters';
import { User, Phone, MapPin, Mail, FileText, Trash2, AlertTriangle, Check } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  clientToEdit
}) => {
  const { addClient, updateClient, deleteClient } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Porto Seguro - BA');
  const [notes, setNotes] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (clientToEdit) {
      setName(clientToEdit.name);
      setPhone(clientToEdit.phone);
      setEmail(clientToEdit.email || '');
      setCpfCnpj(clientToEdit.cpfCnpj || '');
      setAddress(clientToEdit.address || '');
      setCity(clientToEdit.city || 'Porto Seguro - BA');
      setNotes(clientToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setCpfCnpj('');
      setAddress('');
      setCity('Porto Seguro - BA');
      setNotes('');
    }
  }, [clientToEdit, isOpen]);

  const handleDelete = () => {
    if (!clientToEdit) return;
    deleteClient(clientToEdit.id);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        name,
        phone,
        email,
        cpfCnpj,
        address,
        city,
        notes
      });
    } else {
      addClient({
        name,
        phone,
        email,
        cpfCnpj,
        address,
        city,
        notes
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? `Editar Cliente: ${clientToEdit.name}` : 'Cadastrar Novo Cliente'}
      subtitle="Dados de contato e histórico de ordens de serviço"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
        <div>
          <label className="block text-2xs font-medium text-slate-400 mb-1">Nome Completo *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Telefone / WhatsApp *</label>
            <input
              type="text"
              required
              maxLength={15}
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">CPF ou CNPJ</label>
            <input
              type="text"
              maxLength={18}
              value={cpfCnpj}
              onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Cidade / Estado</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Porto Seguro - BA"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-2xs font-medium text-slate-400 mb-1">Endereço Residencial / Comercial</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Ex: Av. Navegantes, 450, Centro"
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-2xs font-medium text-slate-400 mb-1">Observações e Preferências</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Prefere peças originais Apple, cliente de pousada..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div>
            {clientToEdit && (
              !isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition active:scale-95"
                  title="Excluir este cliente do sistema"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>Excluir Cliente</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/60 bg-rose-950/40 p-1.5 text-xs">
                  <div className="flex items-center gap-1 text-2xs font-semibold text-rose-200 px-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span>Confirmar exclusão?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-2xs font-bold text-white hover:bg-rose-500 transition shadow-sm"
                  >
                    <Check className="h-3 w-3" />
                    <span>Sim, Excluir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-2xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                  >
                    Cancelar
                  </button>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950 hover:from-cyan-500 hover:to-blue-500 transition active:scale-95"
            >
              {clientToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
