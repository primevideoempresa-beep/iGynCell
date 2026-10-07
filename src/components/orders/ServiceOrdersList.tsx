import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Filter,
  Plus,
  FileDown,
  Printer,
  MessageCircle,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ServiceOrder, OSStatus } from '../../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getOSStatusInfo
} from '../../utils/formatters';
import { exportOrdersToPDF, exportToCSV } from '../../utils/exportUtils';
import { ServiceOrderModal } from './ServiceOrderModal';
import { ServiceOrderPrintView } from './ServiceOrderPrintView';

export const ServiceOrdersList: React.FC = () => {
  const {
    orders,
    deleteOrder,
    updateOrderStatus,
    settings,
    searchTerm,
    setSearchTerm,
    employees
  } = useApp();
  const { currentUser, isRole } = useAuth();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<ServiceOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<ServiceOrder | null>(null);

  const isAdmin = isRole(['admin', 'manager']);

  // Filter orders based on user role and manual filters
  const filteredOrders = orders.filter(order => {
    // Role based access: technicians only see their own OSs unless admin/manager
    if (!isAdmin && order.assignedTechnicianId !== currentUser?.id) return false;

    // Search match
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientPhone.includes(searchTerm) ||
      order.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.imeiOrSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;

    // Technician filter
    if (techFilter !== 'all' && order.assignedTechnicianId !== techFilter) return false;

    return true;
  });

  const handleOpenNew = () => {
    setSelectedOrderForEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (order: ServiceOrder) => {
    setSelectedOrderForEdit(order);
    setIsModalOpen(true);
  };

  const handlePrint = (order: ServiceOrder) => {
    setOrderToPrint(order);
  };

  const handleSendWhatsApp = (order: ServiceOrder) => {
    const cleanPhone = order.clientPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const statusLabel = getOSStatusInfo(order.status).label;
    const valorStr = formatCurrency(order.totalAmount);

    let msg = settings.whatsappGreetingTemplate
      .replace('{cliente}', order.clientName)
      .replace('{os}', order.id)
      .replace('{status}', statusLabel)
      .replace('{valor}', valorStr);

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
  };

  const handleExportPDF = () => {
    exportOrdersToPDF(filteredOrders, settings);
  };

  const handleExportCSV = () => {
    const headers = [
      'Nº OS',
      'Data Entrada',
      'Cliente',
      'Telefone',
      'CPF',
      'Aparelho',
      'Marca',
      'Modelo',
      'Cor',
      'IMEI/Serial',
      'Técnico',
      'Status',
      'Total Peças',
      'Mão de Obra',
      'Desconto',
      'Valor Total',
      'Forma Pagamento',
      'Status Pagamento'
    ];
    const rows = filteredOrders.map(o => [
      o.id,
      formatDateTime(o.createdAt),
      o.clientName,
      o.clientPhone,
      o.clientCpf || '',
      o.deviceType,
      o.brand,
      o.model,
      o.color,
      o.imeiOrSerial,
      o.assignedTechnicianName,
      getOSStatusInfo(o.status).label,
      o.partsTotal,
      o.laborCost,
      o.discount,
      o.totalAmount,
      o.paymentMethod || '',
      o.paymentStatus
    ]);
    exportToCSV(`iGyn_Cell_Ordens_Servico_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const kanbanColumns: { status: OSStatus; label: string; bgBadge: string }[] = [
    { status: 'open', label: 'Aberta (Entrada)', bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { status: 'in_progress', label: 'Em Andamento', bgBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    { status: 'waiting_parts', label: 'Aguardando Peça', bgBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { status: 'completed', label: 'Concluída / Pronta', bgBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { status: 'delivered', label: 'Entregue ao Cliente', bgBadge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Ordens de Serviço (Assistência Técnica)
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe o fluxo de diagnóstico, manutenção, peças e entrega dos aparelhos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-2xs font-semibold transition ${
                viewMode === 'kanban' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-2xs font-semibold transition ${
                viewMode === 'table' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Tabela</span>
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-cyan-950 hover:bg-cyan-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 bg-slate-950/90 px-4 py-3 backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nº OS, cliente, IMEI, modelo..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
              >
                <option value="all">Todos os Status</option>
                <option value="open">Aberta</option>
                <option value="in_progress">Em Andamento</option>
                <option value="waiting_parts">Aguardando Peça</option>
                <option value="completed">Concluída</option>
                <option value="delivered">Entregue</option>
              </select>

              {isAdmin && (
                <select
                  value={techFilter}
                  onChange={e => setTechFilter(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
                >
                  <option value="all">Todos os Técnicos</option>
                  {employees
                    .filter(e => e.role === 'technician' || e.role === 'admin')
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>

          <span className="text-2xs font-mono text-slate-400">
            Exibindo {filteredOrders.length} ordens de serviço
          </span>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {kanbanColumns.map(col => {
            const colOrders = filteredOrders.filter(o => o.status === col.status);
            return (
              <div
                key={col.status}
                className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3 min-h-[400px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{col.label}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.2 font-mono text-2xs font-bold border ${col.bgBadge}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1">
                  {colOrders.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800/60 p-4 text-center text-2xs text-slate-500">
                      Nenhuma OS neste status
                    </div>
                  ) : (
                    colOrders.map(order => (
                      <div
                        key={order.id}
                        className="group relative rounded-xl border border-slate-800 bg-slate-900 p-3.5 shadow-md shadow-black/40 transition hover:border-slate-700 hover:bg-slate-900/90"
                      >
                        {/* Header of Card */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-extrabold text-cyan-400">
                            {order.id}
                          </span>
                          <span className="text-2xs text-slate-400 font-mono">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        {/* Device & Client */}
                        <div className="space-y-1 mb-2">
                          <p className="text-xs font-bold text-white">
                            {order.brand} {order.model}
                          </p>
                          <p className="text-2xs text-slate-400 truncate">
                            Cliente: <span className="text-slate-300 font-medium">{order.clientName}</span>
                          </p>
                          <p className="text-2xs text-slate-400 line-clamp-2">
                            Defeito: {order.problemReported}
                          </p>
                        </div>

                        {/* Tech & Total */}
                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-2xs">
                          <span className="text-slate-400 truncate max-w-[110px]">
                            Téc: {order.assignedTechnicianName}
                          </span>
                          <span className="font-mono font-bold tabular-nums text-emerald-400 text-xs">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>

                        {/* Status Quick Switcher */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1">
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value as OSStatus)}
                            className="w-full rounded border border-slate-800 bg-slate-950 py-1 px-1.5 text-2xs text-slate-300 outline-none focus:border-cyan-500"
                          >
                            <option value="open">Mudar p/ Aberta</option>
                            <option value="in_progress">Mudar p/ Em Andamento</option>
                            <option value="waiting_parts">Mudar p/ Aguardando Peça</option>
                            <option value="completed">Mudar p/ Concluída</option>
                            <option value="delivered">Mudar p/ Entregue</option>
                            <option value="cancelled">Mudar p/ Cancelada</option>
                          </select>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleSendWhatsApp(order)}
                              title="Avisar cliente no WhatsApp"
                              className="rounded p-1 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handlePrint(order)}
                              title="Imprimir Comprovante / Folha de OS"
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(order)}
                              title="Editar Detalhes"
                              className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="p-3">Nº OS</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Equipamento</th>
                  <th className="p-3">Defeito</th>
                  <th className="p-3">Técnico</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Valor Total</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Nenhuma ordem de serviço encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const statusInfo = getOSStatusInfo(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-slate-900/90 transition">
                        <td className="p-3 font-mono font-bold text-cyan-400">{order.id}</td>
                        <td className="p-3 text-2xs text-slate-400 font-mono">{formatDate(order.createdAt)}</td>
                        <td className="p-3">
                          <p className="font-semibold text-white">{order.clientName}</p>
                          <p className="text-2xs text-slate-400 font-mono">{order.clientPhone}</p>
                        </td>
                        <td className="p-3 font-medium text-slate-200">
                          {order.brand} {order.model}
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs truncate" title={order.problemReported}>
                          {order.problemReported}
                        </td>
                        <td className="p-3 text-slate-400">{order.assignedTechnicianName}</td>
                        <td className="p-3">
                          <span className={`inline-block rounded px-2 py-0.5 font-mono text-2xs font-semibold border ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold tabular-nums text-emerald-400">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSendWhatsApp(order)}
                              title="Notificar Cliente via WhatsApp"
                              className="rounded p-1 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePrint(order)}
                              title="Imprimir Comprovante de OS"
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(order)}
                              title="Editar OS"
                              className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {isRole(['admin', 'manager']) && (
                              <button
                                onClick={() => {
                                  if (confirm(`Deseja realmente excluir a OS ${order.id}?`)) {
                                    deleteOrder(order.id);
                                  }
                                }}
                                title="Excluir OS"
                                className="rounded p-1 text-rose-400 hover:bg-rose-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / New Modal */}
      <ServiceOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderToEdit={selectedOrderForEdit}
      />

      {/* Printable Sheet Modal */}
      {orderToPrint && (
        <ServiceOrderPrintView
          order={orderToPrint}
          settings={settings}
          onClose={() => setOrderToPrint(null)}
        />
      )}
    </div>
  );
};
