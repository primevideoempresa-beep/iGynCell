import React, { useState, useEffect } from 'react';
import { TechPart } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Wrench, Cpu, DollarSign, Tag, Trash2, AlertTriangle, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface TechPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  partToEdit?: TechPart | null;
}

export const TechPartModal: React.FC<TechPartModalProps> = ({
  isOpen,
  onClose,
  partToEdit
}) => {
  const { addTechPart, updateTechPart, deleteTechPart } = useApp();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Telas / Displays');
  const [compatibleModelsStr, setCompatibleModelsStr] = useState('iPhone 13, iPhone 13 Pro');
  const [quantity, setQuantity] = useState<number>(5);
  const [minQuantity, setMinQuantity] = useState<number>(3);
  const [costPrice, setCostPrice] = useState<number>(150);
  const [salePrice, setSalePrice] = useState<number>(350);
  const [supplier, setSupplier] = useState('');
  const [shelfLocation, setShelfLocation] = useState('Gaveta A-01');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (partToEdit) {
      setCode(partToEdit.code);
      setName(partToEdit.name);
      setCategory(partToEdit.category);
      setCompatibleModelsStr(partToEdit.compatibleModels.join(', '));
      setQuantity(partToEdit.quantity);
      setMinQuantity(partToEdit.minQuantity);
      setCostPrice(partToEdit.costPrice);
      setSalePrice(partToEdit.salePrice);
      setSupplier(partToEdit.supplier);
      setShelfLocation(partToEdit.shelfLocation);
    } else {
      setCode(`PRT-${Math.floor(1000 + Math.random() * 9000)}`);
      setName('');
      setCategory('Telas / Displays');
      setCompatibleModelsStr('iPhone 13');
      setQuantity(5);
      setMinQuantity(3);
      setCostPrice(150);
      setSalePrice(350);
      setSupplier('Distribuidora iFix Tech SP');
      setShelfLocation('Gaveta A-01');
    }
  }, [partToEdit, isOpen]);

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!partToEdit) return;
    deleteTechPart(partToEdit.id);
    setIsConfirmingDelete(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const compatibleModels = compatibleModelsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (partToEdit) {
      updateTechPart(partToEdit.id, {
        code,
        name,
        category,
        compatibleModels,
        quantity,
        minQuantity,
        costPrice,
        salePrice,
        supplier,
        shelfLocation
      });
    } else {
      addTechPart({
        code,
        name,
        category,
        compatibleModels,
        quantity,
        minQuantity,
        costPrice,
        salePrice,
        supplier,
        shelfLocation
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={partToEdit ? `Editar Peça: ${partToEdit.name}` : 'Cadastrar Nova Peça Técnica (Laboratório)'}
      subtitle="Peças de reposição para uso em Ordens de Serviço"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Código da Peça *</label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-2xs font-medium text-slate-400 mb-1">Nome da Peça Técnica *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Tela Display iPhone 13 OLED Premium"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Categoria de Peça</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            >
              <option value="Telas / Displays">Telas / Displays</option>
              <option value="Baterias">Baterias</option>
              <option value="Conectores Carga / Dock">Conectores Carga / Dock</option>
              <option value="Câmeras">Câmeras</option>
              <option value="Tampas Traseiras">Tampas Traseiras</option>
              <option value="Alto-Falantes & Auriculares">Alto-Falantes & Auriculares</option>
              <option value="Flex & Botões">Flex & Botões</option>
              <option value="Componentes de Placa">Componentes de Placa / ICs</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-medium text-slate-400 mb-1">Gaveta / Posição no Lab</label>
            <input
              type="text"
              value={shelfLocation}
              onChange={e => setShelfLocation(e.target.value)}
              placeholder="Ex: Gaveta A-01 / Organizador SMD 04"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-2xs font-medium text-slate-400 mb-1">
            Modelos Compatíveis (separados por vírgula)
          </label>
          <input
            type="text"
            value={compatibleModelsStr}
            onChange={e => setCompatibleModelsStr(e.target.value)}
            placeholder="Ex: iPhone 13, iPhone 13 Pro, SM-G991B"
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          />
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
            <label className="block text-2xs font-medium text-slate-400 mb-1">Preço Custo (R$) *</label>
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
            <label className="block text-2xs font-medium text-slate-400 mb-1">Cobrado na OS (R$) *</label>
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
          <label className="block text-2xs font-medium text-slate-400 mb-1">Fornecedor</label>
          <input
            type="text"
            value={supplier}
            onChange={e => setSupplier(e.target.value)}
            placeholder="Ex: Distribuidora iFix Tech SP / MegaPeças"
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div>
            {partToEdit && (
              !isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition active:scale-95"
                  title="Excluir esta peça do estoque de laboratório"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>Excluir Peça</span>
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
              {partToEdit ? 'Salvar Alterações' : 'Cadastrar Peça'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
