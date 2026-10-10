import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  FileDown,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  ExternalLink,
  Wrench
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Client } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import { ClientModal } from './ClientModal';

export const ClientsList: React.FC = () => {
  const { clients, deleteClient, orders, searchTerm, setSearchTerm } = useApp();
  const { isRole } = useAuth();

  const [selectedClientToEdit, setSelectedClientToEdit] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredClients = clients.filter(client => {
    const matches =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      (client.cpfCnpj && client.cpfCnpj.includes(searchTerm)) ||
      (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matches;
  });

  const handleOpenNew = () => {
    setSelectedClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const msg = encodeURIComponent(`Olá ${name}, tudo bem? Aqui é da iGyn Cell (Central Park Shopping). Como podemos ajudar hoje?`);
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nome',
      'Telefone',
      'E-mail',
      'CPF/CNPJ',
      'Endereço',
      'Cidade',
      'Total Gasto',
      'Qtd de Ordens',
      'Cadastrado Em'
    ];
    const rows = filteredClients.map(c => [
      c.id,
      c.name,
      c.phone,
      c.email || '',
      c.cpfCnpj || '',
      c.address || '',
      c.city || '',
      c.totalSpent,
      c.ordersCount,
      formatDate(c.createdAt)
    ]);
    exportToCSV(`iGyn_Cell_Clientes_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Carteira de Clientes
          </h2>
          <p className="text-xs text-slate-400">
            Histórico de atendimento, contatos diretos no WhatsApp e compras
          </p>
        </div>

        <div className="relative flex-grow max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, CPF, telefone..."
            className="block w-full pl-10 pr-3 py-1.5 border border-slate-700 rounded-lg bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-cyan-950 hover:bg-cyan-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => {
          const clientOrders = orders.filter(
            o => o.clientId === client.id || o.clientName.toLowerCase() === client.name.toLowerCase()
          );

          return (
            <div
              key={client.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-slate-700 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{client.name}</h3>
                  {client.cpfCnpj && (
                    <p className="text-2xs text-slate-400 font-mono">CPF: {client.cpfCnpj}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenWhatsApp(client.phone, client.name)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                    title="Conversar no WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(client)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                    title="Editar Cliente"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {isRole(['admin', 'manager']) && (
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir o cliente ${client.name}?`)) {
                          deleteClient(client.id);
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-2xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="font-mono">{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {client.notes && (
                <div className="rounded-lg bg-slate-950/60 p-2 text-2xs text-slate-400 border border-slate-800/60">
                  {client.notes}
                </div>
              )}

              {/* Stats Footer */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-2xs">
                <div>
                  <span className="text-slate-400">Total de OS: </span>
                  <span className="font-mono font-bold text-white">
                    {clientOrders.length || client.ordersCount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Total Gasto: </span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(client.totalSpent)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={selectedClientToEdit}
      />
    </div>
  );
};
