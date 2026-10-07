import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Plus,
  FileDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  Tag,
  MapPin,
  Building2,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { exportInventoryToPDF, exportToCSV } from '../../utils/exportUtils';
import { ProductModal } from './ProductModal';

export const InventoryList: React.FC = () => {
  const {
    products,
    techParts,
    deleteProduct,
    adjustProductStock,
    settings,
    searchTerm,
    setSearchTerm
  } = useApp();
  const { isRole } = useAuth();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;

    if (stockStatusFilter === 'low' && product.quantity > product.minQuantity) return false;
    if (stockStatusFilter === 'out' && product.quantity > 0) return false;
    if (stockStatusFilter === 'normal' && product.quantity <= product.minQuantity) return false;

    return true;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Financial summary of stock
  const totalItemsCount = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalCostInvested = products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);
  const totalPotentialRevenue = products.reduce((sum, p) => sum + p.quantity * p.salePrice, 0);
  const lowStockCount = products.filter(p => p.quantity <= p.minQuantity).length;

  const handleOpenNew = () => {
    setSelectedProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (prod: Product) => {
    setSelectedProductToEdit(prod);
    setIsModalOpen(true);
  };

  const handleExportPDF = () => {
    exportInventoryToPDF(filteredProducts, techParts, settings);
  };

  const handleExportCSV = () => {
    const headers = [
      'Código SKU',
      'Nome do Produto',
      'Categoria',
      'Quantidade',
      'Estoque Mínimo',
      'Preço Custo',
      'Preço Venda',
      'Fornecedor',
      'Localização'
    ];
    const rows = filteredProducts.map(p => [
      p.code,
      p.name,
      p.category,
      p.quantity,
      p.minQuantity,
      p.costPrice,
      p.salePrice,
      p.supplier,
      p.location
    ]);
    exportToCSV(`iGyn_Cell_Estoque_Produtos_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Estoque de Produtos & Acessórios
          </h2>
          <p className="text-xs text-slate-400">
            Smartphones novos/seminovos, capas, películas, carregadores e periféricos
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
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Total em Estoque
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-extrabold tabular-nums text-white">
              {totalItemsCount}
            </span>
            <span className="text-2xs text-slate-400">unidades</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Custo Imobilizado
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-slate-200">
              {formatCurrency(totalCostInvested)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Potencial de Venda
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-extrabold tabular-nums text-emerald-400">
              {formatCurrency(totalPotentialRevenue)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Estoque Baixo
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-extrabold tabular-nums text-amber-400">
              {lowStockCount}
            </span>
            <span className="text-2xs text-amber-300/80">alertas</span>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Produto</th>
                <th className="p-3">Categoria</th>
                <th className="p-3 text-center">Estoque</th>
                <th className="p-3 text-center">Mínimo</th>
                <th className="p-3 text-right">Custo</th>
                <th className="p-3 text-right">Preço Venda</th>
                <th className="p-3">Localização</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isLow = product.quantity <= product.minQuantity;
                  const isZero = product.quantity === 0;
                  return (
                    <tr key={product.id} className="hover:bg-slate-900/90 transition">
                      <td className="p-3 font-mono font-bold text-cyan-400">{product.code}</td>
                      <td className="p-3 font-medium text-white max-w-xs truncate" title={product.name}>
                        {product.name}
                      </td>
                      <td className="p-3 text-slate-400">{product.category}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => adjustProductStock(product.id, -1)}
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
                            {product.quantity}
                          </span>
                          <button
                            onClick={() => adjustProductStock(product.id, 1)}
                            className="h-5 w-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-xs flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-400">{product.minQuantity}</td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold tabular-nums text-emerald-400">
                        {formatCurrency(product.salePrice)}
                      </td>
                      <td className="p-3 text-slate-400 text-2xs truncate max-w-[120px]">
                        {product.location}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(product)}
                            title="Editar Produto"
                            className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {isRole(['admin', 'manager']) && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja realmente excluir ${product.name}?`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              title="Excluir Produto"
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

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={selectedProductToEdit}
      />
    </div>
  );
};
