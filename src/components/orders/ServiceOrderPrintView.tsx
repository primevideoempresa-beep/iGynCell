import React from 'react';
import { ServiceOrder, StoreSettings } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Printer, X, Download, Smartphone } from 'lucide-react';
import { exportSingleOrderPDF } from '../../utils/exportUtils';

interface ServiceOrderPrintViewProps {
  order: ServiceOrder;
  settings: StoreSettings;
  onClose: () => void;
}

export const ServiceOrderPrintView: React.FC<ServiceOrderPrintViewProps> = ({
  order,
  settings,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    exportSingleOrderPDF(order, settings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white text-slate-900 shadow-2xl p-6 sm:p-8 my-6 overflow-hidden">
        {/* Action Controls (Hidden when printing) */}
        <div className="no-print mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-800">
              Comprovante de Ordem de Serviço #{order.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              <Download className="h-4 w-4" />
              <span>Baixar PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-order-sheet" className="space-y-5 text-slate-800 text-xs">
          {/* Company Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-6 w-6 text-cyan-600" />
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {settings.storeName.toUpperCase()}
                </h1>
              </div>
              <p className="text-2xs text-slate-600 mt-0.5">{settings.tradeName}</p>
              <p className="text-2xs text-slate-600">{settings.address} - {settings.cityState}</p>
              <p className="text-2xs text-slate-600 font-mono">
                Telefone/WhatsApp: {settings.phone} | CNPJ: {settings.cnpj}
              </p>
            </div>

            <div className="text-right">
              <div className="rounded border-2 border-slate-900 bg-slate-50 px-3 py-1 text-center">
                <span className="text-2xs font-bold uppercase text-slate-500 block">Nº da OS</span>
                <span className="font-mono text-base font-extrabold text-slate-900">{order.id}</span>
              </div>
              <p className="mt-1 text-2xs text-slate-500">
                Entrada: {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Client & Device Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Dados do Cliente
              </span>
              <p className="font-bold text-slate-900">{order.clientName}</p>
              <p className="font-mono text-2xs text-slate-600">Tel: {order.clientPhone}</p>
              <p className="text-2xs text-slate-600">CPF/CNPJ: {order.clientCpf || 'Não informado'}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Equipamento em Reparo
              </span>
              <p className="font-bold text-slate-900">
                {order.deviceType} {order.brand} {order.model} ({order.color})
              </p>
              <p className="font-mono text-2xs text-slate-600">IMEI/Serial: {order.imeiOrSerial || 'N/A'}</p>
              <p className="text-2xs text-slate-600">Senha do Aparelho: {order.passcode || 'Sem senha'}</p>
            </div>
          </div>

          {/* Checklist & Physical condition */}
          <div className="rounded-lg border border-slate-200 p-3 bg-slate-50 space-y-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block">
              Estado Físico na Recepção & Defeito Reclamado
            </span>
            <p className="text-2xs">
              <span className="font-semibold text-slate-700">Avarias externas:</span> {order.physicalCondition || 'Sem avarias relatadas.'}
            </p>
            <p className="text-2xs">
              <span className="font-semibold text-slate-700">Defeito Reclamado:</span> {order.problemReported}
            </p>
            <p className="text-2xs">
              <span className="font-semibold text-slate-700">Diagnóstico Técnico:</span> {order.technicalDiagnosis || 'Em análise técnica especializada.'}
            </p>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-2xs">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-2">Item / Descrição</th>
                  <th className="p-2 text-center">Tipo</th>
                  <th className="p-2 text-center">Qtd</th>
                  <th className="p-2 text-right">Unitário</th>
                  <th className="p-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.partsUsed.map((part, idx) => (
                  <tr key={`p-${idx}`}>
                    <td className="p-2 font-medium">{part.name}</td>
                    <td className="p-2 text-center text-slate-500">Peça</td>
                    <td className="p-2 text-center font-mono">{part.quantity}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(part.unitPrice)}</td>
                    <td className="p-2 text-right font-mono font-semibold">{formatCurrency(part.subtotal)}</td>
                  </tr>
                ))}
                {order.servicesRendered.map((srv, idx) => (
                  <tr key={`s-${idx}`}>
                    <td className="p-2 font-medium">{srv.name}</td>
                    <td className="p-2 text-center text-slate-500">Mão de Obra</td>
                    <td className="p-2 text-center font-mono">1</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(srv.price)}</td>
                    <td className="p-2 text-right font-mono font-semibold">{formatCurrency(srv.price)}</td>
                  </tr>
                ))}
                {order.partsUsed.length === 0 && order.servicesRendered.length === 0 && (
                  <tr>
                    <td className="p-2 font-medium">Mão de Obra Técnica Especializada</td>
                    <td className="p-2 text-center text-slate-500">Serviço</td>
                    <td className="p-2 text-center font-mono">1</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(order.laborCost)}</td>
                    <td className="p-2 text-right font-mono font-semibold">{formatCurrency(order.laborCost)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Financials */}
          <div className="flex justify-between items-start pt-2">
            <div className="space-y-0.5 text-2xs text-slate-600">
              <p><span className="font-semibold text-slate-700">Técnico:</span> {order.assignedTechnicianName}</p>
              <p><span className="font-semibold text-slate-700">Garantia:</span> {order.warrantyDays} dias</p>
              <p><span className="font-semibold text-slate-700">Pagamento:</span> {order.paymentMethod?.toUpperCase() || 'Pendente'} ({order.paymentStatus === 'paid' ? 'QUITADO' : 'PENDENTE'})</p>
            </div>

            <div className="w-56 space-y-1 text-right text-2xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Peças:</span>
                <span className="font-mono">{formatCurrency(order.partsTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Mão de Obra:</span>
                <span className="font-mono">{formatCurrency(order.laborCost)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Desconto:</span>
                  <span className="font-mono">- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-extrabold text-slate-900">
                <span>VALOR TOTAL:</span>
                <span className="font-mono">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms of Warranty */}
          <div className="rounded border border-slate-200 bg-slate-50 p-2.5 text-3xs text-slate-600 leading-tight">
            <span className="font-bold text-slate-800 block mb-0.5">TERMO DE GARANTIA & CONDIÇÕES GERAIS:</span>
            {settings.warrantyTerms}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6">
            <div className="text-center">
              <div className="border-t border-slate-400 pt-1 text-2xs text-slate-600">
                Assinatura do Cliente
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 pt-1 text-2xs text-slate-600">
                iGyn Cell - Central Park Shopping
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
