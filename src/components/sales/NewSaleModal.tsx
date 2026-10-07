import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Product, SaleItem, Client } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  DollarSign,
  User,
  CreditCard,
  CheckCircle2,
  Percent
} from 'lucide-react';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose }) => {
  const { products, clients, addSale, addClient, employees, settings } = useApp();
  const { currentUser } = useAuth();

  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('Cliente Balcão (Avulso)');
  const [clientPhone, setClientPhone] = useState('');
  const [sellerId, setSellerId] = useState(currentUser?.id || 'emp-5');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    'pix' | 'credit' | 'debit' | 'cash' | 'installments'
  >('pix');
  const [installments, setInstallments] = useState<number>(1);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Available sellers
  const sellers = isAdmin 
    ? employees.filter(e => e.status === 'active')
    : employees.filter(e => e.id === currentUser?.id);

  const activeSeller = sellers.find(s => s.id === sellerId) || currentUser;
  const sellerCommissionRate = activeSeller?.commissionRateSales ?? settings.defaultSaleCommission;

  // Filter products for adding
  const searchResults = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) {
      alert(`Produto ${product.name} está sem estoque disponível!`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + 1;
      if (newQty > product.quantity) {
        alert(`Quantidade máxima em estoque é ${product.quantity} unidades.`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].subtotal = newQty * product.salePrice;
      setCart(updated);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        code: product.code,
        name: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        unitCost: product.costPrice,
        subtotal: product.salePrice
      };
      setCart([...cart, newItem]);
    }
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
      return;
    }
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    if (product && newQty > product.quantity) {
      alert(`Quantidade máxima em estoque é ${product.quantity} unidades.`);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    updated[index].subtotal = newQty * updated[index].unitPrice;
    setCart(updated);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = Math.max(0, subtotal - (discount || 0));
  const estimatedCommission = (totalAmount * sellerCommissionRate) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Adicione ao menos um produto ao carrinho.');
      return;
    }

    const sellerObj = employees.find(e => e.id === sellerId);

    addSale({
      clientId: selectedClientId || undefined,
      clientName: clientName || 'Cliente Balcão (Avulso)',
      clientPhone: clientPhone || undefined,
      sellerId,
      sellerName: sellerObj ? sellerObj.name : 'Vendedor',
      items: cart,
      subtotal,
      discount,
      totalAmount,
      paymentMethod,
      installments: paymentMethod === 'installments' || paymentMethod === 'credit' ? installments : undefined,
      commissionRate: sellerCommissionRate,
      status: 'completed'
    });

    // Reset and close
    setCart([]);
    setDiscount(0);
    setProductSearch('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Venda - Frente de Caixa (PDV)"
      subtitle="Registre venda de aparelhos e acessórios com comissão automática"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Search & Catalog */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400">
                Buscar Produtos no Estoque
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Nome, código SKU ou categoria (ex: iPhone, Capa, Carregador)..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Products Quick Picker List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Nenhum produto encontrado no estoque.
                </div>
              ) : (
                searchResults.map(product => {
                  const isLow = product.quantity <= product.minQuantity;
                  const isOutOfStock = product.quantity <= 0;
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between rounded-xl border p-2.5 transition ${
                        isOutOfStock
                          ? 'border-rose-900/40 bg-rose-950/10 opacity-60'
                          : 'border-slate-800 bg-slate-900/80 hover:border-cyan-500/50 hover:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-2xs font-bold text-cyan-400">{product.code}</span>
                          <span className="text-slate-500">·</span>
                          <span className="font-medium text-white truncate">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-slate-400">
                          <span>{product.category}</span>
                          <span>·</span>
                          <span className={isLow ? 'text-amber-400 font-bold' : ''}>
                            Estoque: {product.quantity} un
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-xs font-bold tabular-nums text-emerald-400">
                          {formatCurrency(product.salePrice)}
                        </span>
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(product)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-30 transition active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Cart, Customer & Checkout */}
          <div className="lg:col-span-6 space-y-4">
            {/* Customer & Seller Selection */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div>
                <label className="block text-2xs font-medium text-slate-400 mb-1">Cliente</label>
                <select
                  value={selectedClientId}
                  onChange={e => {
                    setSelectedClientId(e.target.value);
                    const c = clients.find(cl => cl.id === e.target.value);
                    if (c) {
                      setClientName(c.name);
                      setClientPhone(c.phone);
                    } else {
                      setClientName('Cliente Balcão (Avulso)');
                      setClientPhone('');
                    }
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                >
                  <option value="">Cliente Balcão (Avulso)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-2xs font-medium text-slate-400 mb-1">Vendedor(a)</label>
                <select
                  value={sellerId}
                  onChange={e => setSellerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                >
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roleLabel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4 text-cyan-400" />
                  <span>Itens do Pedido ({cart.length})</span>
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-2xs text-rose-400 hover:text-rose-300"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-2xs text-slate-500">
                  Adicione produtos ao carrinho ao lado
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-800/60">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pt-1.5">
                      <div className="truncate pr-2">
                        <p className="font-medium text-white truncate text-xs">{item.name}</p>
                        <p className="font-mono text-2xs text-slate-400">
                          {formatCurrency(item.unitPrice)} cada
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => handleUpdateCartQty(idx, Number(e.target.value))}
                          className="w-14 rounded border border-slate-800 bg-slate-900 py-1 text-center font-mono text-xs text-white outline-none focus:border-cyan-500"
                        />
                        <span className="font-mono font-bold tabular-nums text-white text-xs min-w-[70px] text-right">
                          {formatCurrency(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="rounded p-1 text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment & Totals */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-medium text-slate-400 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500 font-semibold"
                  >
                    <option value="pix">PIX (Instantâneo)</option>
                    <option value="credit">Cartão de Crédito</option>
                    <option value="debit">Cartão de Débito</option>
                    <option value="cash">Dinheiro em Espécie</option>
                    <option value="installments">A Prazo / Carnê</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-medium text-slate-400 mb-1">
                    Desconto (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-rose-400 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {(paymentMethod === 'credit' || paymentMethod === 'installments') && (
                <div>
                  <label className="block text-2xs font-medium text-slate-400 mb-1">
                    Número de Parcelas
                  </label>
                  <select
                    value={installments}
                    onChange={e => setInstallments(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                  >
                    <option value={1}>1x de {formatCurrency(totalAmount)}</option>
                    <option value={2}>2x de {formatCurrency(totalAmount / 2)}</option>
                    <option value={3}>3x de {formatCurrency(totalAmount / 3)}</option>
                    <option value={6}>6x de {formatCurrency(totalAmount / 6)}</option>
                    <option value={10}>10x de {formatCurrency(totalAmount / 10)}</option>
                    <option value={12}>12x de {formatCurrency(totalAmount / 12)}</option>
                  </select>
                </div>
              )}

              {/* Commission calculation preview */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-2xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Percent className="h-3 w-3 text-emerald-400" />
                  <span>Comissão do Vendedor ({sellerCommissionRate}%):</span>
                </span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(estimatedCommission)}
                </span>
              </div>

              {/* Final Amount */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-xs font-bold text-white">TOTAL A PAGAR:</span>
                <span className="font-mono text-xl font-extrabold tabular-nums text-emerald-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cart.length === 0}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-40"
          >
            Finalizar Venda & Emitir Recibo
          </button>
        </div>
      </form>
    </Modal>
  );
};
