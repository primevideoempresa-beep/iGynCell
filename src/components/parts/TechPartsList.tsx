import React, { useState } from 'react';
import {
  Cpu,
  Search,
  Plus,
  FileDown,
  AlertTriangle,
  Edit,
  Trash2,
  Wrench,
  Layers,
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TechPart } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { exportInventoryToPDF, exportToCSV } from '../../utils/exportUtils';
import { TechPartModal } from './TechPartModal';

export const TechPartsList: React.FC = () => {
  const {
    techParts,
    products,
    deleteTechPart,
    adjustTechPartStock,
    settings,
    searchTerm,
    setSearchTerm
  } = useApp();
  const { isRole } = useAuth();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [selectedPartToEdit, setSelectedPartToEdit] = useState<TechPart | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredParts = techParts.filter(part => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.compatibleModels.some(m => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
      part.shelfLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter !== 'all' && part.category !== categoryFilter) return false;

    if (stockStatusFilter === 'low' && part.quantity > part.minQuantity) return false;
    if (stockStatusFilter === 'out' && part.quantity > 0) return false;
    if (stockStatusFilter === 'normal' && part.quantity <= part.minQuantity) return false;

    return true;
  });

  const categories = Array.from(new Set(techParts.map(p => p.category)));

  const totalPartsUnits = techParts.reduce((sum, p) => sum + p.quantity, 0);
  const totalCostInvested = techParts.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);
  const totalPotentialValue = techParts.reduce((sum, p) => sum + p.quantity * p.salePrice, 0);
  const lowStockPartsCount = techParts.filter(p => p.quantity <= p.minQuantity).length;

  const handleOpenNew = () => {
    setSelectedPartToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (part: TechPart) => {
    setSelectedPartToEdit(part);
    setIsModalOpen(true);
  };

  const handleExportPDF = () => {
    exportInventoryToPDF(products, filteredParts, settings);
  };

  const handleExportCSV = () => {
    const headers = [
      'Código',
      'Nome da Peça',
      'Categoria',
      'Modelos Compatíveis',
      'Estoque',
      'Mínimo',
      'Preço Custo',
      'Preço OS',
      'Localização Lab',
      'Fornecedor'
    ];
    const rows = filteredParts.map(p => [
      p.code,
      p.name,
      p.category,
      p.compatibleModels.join(', '),
      p.quantity,
      p.minQuantity,
      p.costPrice,
      p.salePrice,
      p.shelfLocation,
      p.supplier
    ]);
    exportToCSV(`iGyn_Cell_Pecas_Laboratorio_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Peças Técnicas & Laboratório
          </h2>
          <p className="text-xs text-slate-400">
            Displays OLED/Incell, baterias, conectores de carga, câmeras e componentes de placa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            <span>Nova Peça</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Total de Peças
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-extrabold tabular-nums text-white">
              {totalPartsUnits}
            </span>
            <span className="text-2xs text-slate-400">unidades no lab</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Custo das Peças
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-slate-200">
              {formatCurrency(totalCostInvested)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Valor em Serviços OS
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-emerald-400">
              {formatCurrency(totalPotentialValue)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Peças em Alerta
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-extrabold tabular-nums text-rose-400">
              {lowStockPartsCount}
            </span>
            <span className="text-2xs text-rose-300/80">críticas</span>
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Peça / Componente</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Compatibilidade</th>
                <th className="p-3 text-center">Estoque</th>
                <th className="p-3 text-center">Mín</th>
                <th className="p-3 text-right">Custo</th>
                <th className="p-3 text-right">Valor na OS</th>
                <th className="p-3">Posição no Lab</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Nenhuma peça encontrada.
                  </td>
                </tr>
              ) : (
                filteredParts.map(part => {
                  const isLow = part.quantity <= part.minQuantity;
                  const isZero = part.quantity === 0;
                  return (
                    <tr key={part.id} className="hover:bg-slate-900/90 transition">
                      <td className="p-3 font-mono font-bold text-cyan-400">{part.code}</td>
                      <td className="p-3 font-medium text-white max-w-xs truncate" title={part.name}>
                        {part.name}
                      </td>
                      <td className="p-3 text-slate-400">{part.category}</td>
                      <td className="p-3 text-2xs text-slate-300 max-w-[150px] truncate" title={part.compatibleModels.join(', ')}>
                        {part.compatibleModels.join(', ')}
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => adjustTechPartStock(part.id, -1)}
                            className="h-5 w-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-xs flex items-center justify-center"
                          >
                            -
                          </button>
                          <span
                            className={`font-mono font-bold tabular-nums min-w-8 text-center rounded px-1.5 py-0.5 ${
                              isZero
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'text-slate-100'
                            }`}
                          >
                            {part.quantity}
                          </span>
                          <button
                            onClick={() => adjustTechPartStock(part.id, 1)}
                            className="h-5 w-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-xs flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-400">{part.minQuantity}</td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        {formatCurrency(part.costPrice)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold tabular-nums text-emerald-400">
                        {formatCurrency(part.salePrice)}
                      </td>
                      <td className="p-3 text-slate-400 text-2xs">
                        <span className="rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700 font-mono text-cyan-300">
                          {part.shelfLocation}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(part)}
                            title="Editar Peça"
                            className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {isRole(['admin', 'manager']) && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja realmente excluir a peça ${part.name}?`)) {
                                  deleteTechPart(part.id);
                                }
                              }}
                              title="Excluir Peça"
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

      <TechPartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partToEdit={selectedPartToEdit}
      />
    </div>
  );
};
