import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Boxes, DollarSign, Tag, Building2, MapPin, Trash2, AlertTriangle, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit
}) => {
  const { addProduct, updateProduct, deleteProduct } = useApp();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Capas & Proteção');
  const [quantity, setQuantity] = useState<number>(10);
  const [minQuantity, setMinQuantity] = useState<number>(5);
  const [costPrice, setCostPrice] = useState<number>(20);
  const [salePrice, setSalePrice] = useState<number>(50);
  const [supplier, setSupplier] = useState('');
  const [location, setLocation] = useState('Vitrine Principal A');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (productToEdit) {
      setCode(productToEdit.code);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setQuantity(productToEdit.quantity);
      setMinQuantity(productToEdit.minQuantity);
      setCostPrice(productToEdit.costPrice);
      setSalePrice(productToEdit.salePrice);
      setSupplier(productToEdit.supplier);
      setLocation(productToEdit.location);
    } else {
      setCode(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setName('');
      setCategory('Capas & Proteção');
      setQuantity(10);
      setMinQuantity(5);
      setCostPrice(20);
      setSalePrice(50);
      setSupplier('Distribuidora Nacional');
      setLocation('Vitrine Principal A');
    }
  }, [productToEdit, isOpen]);

  const handleDelete = () => {
    if (!productToEdit) return;
    deleteProduct(productToEdit.id);
    onClose();
  };

  const profitMargin = salePrice > 0 ? (((salePrice - costPrice) / salePrice) * 100).toFixed(1) : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        code,
        name,
        category,
        quantity,
        minQuantity,
        costPrice,
        salePrice,
        supplier,
        location
      });
    } else {
      addProduct({
        code,
        name,
        category,
        quantity,
        minQuantity,
        costPrice,
        salePrice,
        supplier,
        location
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? `Editar Produto: ${productToEdit.name}` : 'Cadastrar Novo Produto / Acessório'}
      subtitle="Controle de estoque, custos, preços e localização na loja"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Código / SKU *</label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-2xs font-medium text-slate-400 mb-1">Nome do Produto *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Capa MagSafe iPhone 14 Pro Max"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Categoria</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            >
              <option value="Smartphones Novos">Smartphones Novos</option>
              <option value="Seminovos">Smartphones Seminovos</option>
              <option value="Capas & Proteção">Capas & Proteção</option>
              <option value="Películas">Películas de Vidro/Silicone</option>
              <option value="Carregadores & Cabos">Carregadores & Cabos</option>
              <option value="Áudio & Fones">Áudio & Fones de Ouvido</option>
              <option value="Suportes & Outros">Suportes & Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Localização na Loja</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ex: Vitrine Principal A / Gôndola 02"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Qtd em Estoque *</label>
            <input
              type="number"
              min={0}
              required
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono text-center"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Estoque Mínimo *</label>
            <input
              type="number"
              min={1}
              required
              value={minQuantity}
              onChange={e => setMinQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono text-center"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Preço de Custo (R$) *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={costPrice}
              onChange={e => setCostPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Preço de Venda (R$) *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={salePrice}
              onChange={e => setSalePrice(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-emerald-400 font-bold outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-2xs font-medium text-slate-400 mb-1">Fornecedor Principal</label>
          <input
            type="text"
            value={supplier}
            onChange={e => setSupplier(e.target.value)}
            placeholder="Ex: Hrebos / Kaidi Brasil / Distribuidora SP"
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        {/* Profit calculation banner */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="text-2xs text-slate-400">
            <span>Lucro Bruto Unitário: </span>
            <span className="font-mono font-bold text-emerald-400">
              {formatCurrency(Math.max(0, salePrice - costPrice))}
            </span>
          </div>
          <div className="text-2xs font-medium">
            <span className="text-slate-400">Margem Comercial: </span>
            <span className="font-mono font-bold text-cyan-400">{profitMargin}%</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div>
            {productToEdit && (
              !isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition active:scale-95"
                  title="Excluir este produto do estoque"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>Excluir Produto</span>
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
              {productToEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
