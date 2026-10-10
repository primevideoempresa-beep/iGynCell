import React, { useState, useEffect, useMemo } from 'react';
import {
  ServiceOrder,
  Client,
  TechPart,
  PartUsage,
  ServiceItem,
  OSStatus,
  OSPriority
} from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { formatCurrency, formatPhone, formatCpfCnpj } from '../../utils/formatters';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Smartphone,
  Wrench,
  DollarSign,
  User,
  ShieldCheck,
  Search,
  AlertTriangle,
  Check
} from 'lucide-react';

interface ServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: ServiceOrder | null;
}

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  isOpen,
  onClose,
  orderToEdit
}) => {
  const { clients, addClient, techParts, employees, addOrder, updateOrder, deleteOrder } = useApp();
  const { currentUser } = useAuth();

  // Client info state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);

  // Equipment info state
  const [deviceType, setDeviceType] = useState<ServiceOrder['deviceType']>('Smartphone');
  const [brand, setBrand] = useState<ServiceOrder['brand']>('Apple');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [imeiOrSerial, setImeiOrSerial] = useState('');
  const [passcode, setPasscode] = useState('');
  const [physicalCondition, setPhysicalCondition] = useState('');

  // Checklist
  const [checklist, setChecklist] = useState({
    powersOn: true,
    touchWorks: true,
    displayOk: true,
    cameraFrontOk: true,
    cameraRearOk: true,
    microphoneOk: true,
    speakerOk: true,
    wifiOk: true,
    chargingOk: true,
    biometricsOk: true,
    frameDented: false,
    waterDamage: false
  });

  // Problem & Diagnosis
  const [problemReported, setProblemReported] = useState('');
  const [technicalDiagnosis, setTechnicalDiagnosis] = useState('');
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('');
  const [status, setStatus] = useState<OSStatus>('open');
  const [priority, setPriority] = useState<OSPriority>('normal');

  // Parts & Services
  const [partsUsed, setPartsUsed] = useState<PartUsage[]>([]);
  const [laborCost, setLaborCost] = useState<number>(100);
  const [discount, setDiscount] = useState<number>(0);
  const [warrantyDays, setWarrantyDays] = useState<number>(90);
  const [paymentMethod, setPaymentMethod] = useState<ServiceOrder['paymentMethod']>('pix');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'cancelled'>('pending');
  const [technicalNotesInternal, setTechnicalNotesInternal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Selected part in dropdown
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState(1);

  // Technicians list memoized
  const technicians = useMemo(() => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';
    if (isAdmin) {
      return employees.filter(e => e.role === 'technician' || e.role === 'admin' || e.role === 'manager');
    }
    return employees.filter(e => e.id === currentUser?.id);
  }, [employees, currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    setIsConfirmingDelete(false);

    if (orderToEdit) {
      setSelectedClientId(orderToEdit.clientId);
      setClientName(orderToEdit.clientName);
      setClientPhone(orderToEdit.clientPhone);
      setClientCpf(orderToEdit.clientCpf || '');
      setDeviceType(orderToEdit.deviceType);
      setBrand(orderToEdit.brand);
      setModel(orderToEdit.model);
      setColor(orderToEdit.color);
      setImeiOrSerial(orderToEdit.imeiOrSerial);
      setPasscode(orderToEdit.passcode);
      setPhysicalCondition(orderToEdit.physicalCondition);
      setChecklist(orderToEdit.checklist);
      setProblemReported(orderToEdit.problemReported);
      setTechnicalDiagnosis(orderToEdit.technicalDiagnosis);
      setAssignedTechnicianId(orderToEdit.assignedTechnicianId);
      setStatus(orderToEdit.status);
      setPriority(orderToEdit.priority);
      setPartsUsed(orderToEdit.partsUsed || []);
      setLaborCost(orderToEdit.laborCost);
      setDiscount(orderToEdit.discount);
      setWarrantyDays(orderToEdit.warrantyDays || 90);
      setPaymentMethod(orderToEdit.paymentMethod || 'pix');
      setPaymentStatus(orderToEdit.paymentStatus);
      setTechnicalNotesInternal(orderToEdit.technicalNotesInternal || '');
      setIsNewClient(false);
    } else {
      // Default reset for new OS
      const defaultCli = clients[0];
      setSelectedClientId(defaultCli?.id || '');
      setClientName(defaultCli?.name || '');
      setClientPhone(defaultCli?.phone || '');
      setClientCpf(defaultCli?.cpfCnpj || '');
      setDeviceType('Smartphone');
      setBrand('Apple');
      setModel('iPhone 13 128GB');
      setColor('Preto');
      setImeiOrSerial('');
      setPasscode('');
      setPhysicalCondition('Sem marcas graves');
      setChecklist({
        powersOn: true,
        touchWorks: true,
        displayOk: true,
        cameraFrontOk: true,
        cameraRearOk: true,
        microphoneOk: true,
        speakerOk: true,
        wifiOk: true,
        chargingOk: true,
        biometricsOk: true,
        frameDented: false,
        waterDamage: false
      });
      setProblemReported('');
      setTechnicalDiagnosis('');
      setAssignedTechnicianId(technicians[0]?.id || currentUser?.id || 'emp-3');
      setStatus('open');
      setPriority('normal');
      setPartsUsed([]);
      setLaborCost(100);
      setDiscount(0);
      setWarrantyDays(90);
      setPaymentMethod('pix');
      setPaymentStatus('pending');
      setTechnicalNotesInternal('');
      setIsNewClient(false);
    }
  }, [orderToEdit, isOpen]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientPhone(client.phone);
      setClientCpf(client.cpfCnpj || '');
    }
  };

  const handleAddPart = () => {
    if (!selectedPartId) return;
    const part = techParts.find(p => p.id === selectedPartId);
    if (!part) return;

    const existingIndex = partsUsed.findIndex(p => p.partId === part.id);
    if (existingIndex >= 0) {
      const updated = [...partsUsed];
      const newQty = updated[existingIndex].quantity + selectedPartQty;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].subtotal = newQty * part.salePrice;
      setPartsUsed(updated);
    } else {
      const newUsage: PartUsage = {
        partId: part.id,
        code: part.code,
        name: part.name,
        quantity: selectedPartQty,
        unitCost: part.costPrice,
        unitPrice: part.salePrice,
        subtotal: selectedPartQty * part.salePrice
      };
      setPartsUsed([...partsUsed, newUsage]);
    }
    setSelectedPartId('');
    setSelectedPartQty(1);
  };

  const handleRemovePart = (index: number) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  const partsTotal = partsUsed.reduce((sum, p) => sum + p.subtotal, 0);
  const totalAmount = Math.max(0, partsTotal + (laborCost || 0) - (discount || 0));

  const handleDelete = async () => {
    if (!orderToEdit) return;
    try {
      await deleteOrder(orderToEdit.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir Ordem de Serviço.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalClientId = selectedClientId;
      if (isNewClient || !selectedClientId) {
        const newCli = addClient({
          name: clientName,
          phone: clientPhone,
          cpfCnpj: clientCpf,
          city: 'Porto Seguro - BA'
        });
        finalClientId = newCli.id;
      }

      const tech = employees.find(e => e.id === assignedTechnicianId);
      const assignedTechnicianName = tech ? tech.name : 'Lucas Santos';

      const payload = {
        clientId: finalClientId,
        clientName,
        clientPhone,
        clientCpf,
        deviceType,
        brand,
        model,
        color,
        imeiOrSerial,
        passcode,
        physicalCondition,
        checklist,
        problemReported,
        technicalDiagnosis,
        assignedTechnicianId,
        assignedTechnicianName,
        status,
        priority,
        partsUsed,
        servicesRendered: [
          {
            id: 'srv-std',
            name: 'Mão de Obra Técnica Especializada',
            price: laborCost
          }
        ],
        laborCost,
        partsTotal,
        discount,
        totalAmount,
        paymentMethod,
        paymentStatus,
        warrantyDays,
        technicalNotesInternal
      };

      if (orderToEdit) {
        await updateOrder(orderToEdit.id, payload);
      } else {
        await addOrder(payload);
      }

      onClose();
    } catch (err) {
      console.error('Erro ao salvar OS:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={orderToEdit ? `Editar Ordem de Serviço #${orderToEdit.id}` : 'Nova Ordem de Serviço (OS)'}
      subtitle="Cadastre a entrada de equipamento, diagnóstico, peças e valores"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-200">
        {/* Section 1: Client Selection */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <User className="h-4 w-4 text-cyan-400" />
              <span>Dados do Cliente</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsNewClient(!isNewClient)}
              className="text-2xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              {isNewClient ? 'Selecionar Existente' : '+ Cadastrar Novo Cliente'}
            </button>
          </div>

          {!isNewClient ? (
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">
                Buscar Cliente Cadastrado
              </label>
              <select
                value={selectedClientId}
                onChange={e => handleClientSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                {clients.map(cli => (
                  <option key={cli.id} value={cli.id}>
                    {cli.name} - {cli.phone} ({cli.city || 'Porto Seguro'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-2xs font-medium text-slate-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-2xs font-medium text-slate-400 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={clientPhone}
                  onChange={e => setClientPhone(formatPhone(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-2xs font-medium text-slate-400 mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  maxLength={18}
                  value={clientCpf}
                  onChange={e => setClientCpf(formatCpfCnpj(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Equipment Data */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
            <Smartphone className="h-4 w-4 text-cyan-400" />
            <span>Dados do Aparelho & Equipamento</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Tipo</label>
              <select
                value={deviceType}
                onChange={e => setDeviceType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="Smartphone">Smartphone</option>
                <option value="Tablet">Tablet / iPad</option>
                <option value="Smartwatch">Smartwatch / Apple Watch</option>
                <option value="Notebook">Notebook</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Marca</label>
              <select
                value={brand}
                onChange={e => setBrand(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Xiaomi">Xiaomi</option>
                <option value="Motorola">Motorola</option>
                <option value="LG">LG</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Modelo *</label>
              <input
                type="text"
                required
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="Ex: iPhone 13 128GB"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Cor</label>
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="Ex: Azul Meia-Noite"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">IMEI ou Nº de Série</label>
              <input
                type="text"
                value={imeiOrSerial}
                onChange={e => setImeiOrSerial(e.target.value)}
                placeholder="358912..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Senha / PIN / Padrão</label>
              <input
                type="text"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="Ex: 123456 ou Sem Senha"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Estado Físico / Detalhes</label>
              <input
                type="text"
                value={physicalCondition}
                onChange={e => setPhysicalCondition(e.target.value)}
                placeholder="Ex: Vidro trincado, sem amassados"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Checklist de Testes de Entrada
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.powersOn}
                  onChange={e => setChecklist({ ...checklist, powersOn: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Liga Normal</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.touchWorks}
                  onChange={e => setChecklist({ ...checklist, touchWorks: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Touchscreen OK</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.displayOk}
                  onChange={e => setChecklist({ ...checklist, displayOk: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Display / Imagem OK</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.chargingOk}
                  onChange={e => setChecklist({ ...checklist, chargingOk: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Carregamento OK</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.cameraFrontOk}
                  onChange={e => setChecklist({ ...checklist, cameraFrontOk: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Câmera Frontal</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.cameraRearOk}
                  onChange={e => setChecklist({ ...checklist, cameraRearOk: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Câmera Traseira</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.microphoneOk}
                  onChange={e => setChecklist({ ...checklist, microphoneOk: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Microfone / Áudio</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.biometricsOk}
                  onChange={e => setChecklist({ ...checklist, biometricsOk: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Biometria / FaceID</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Problem Description & Tech Diagnosis */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">
                Defeito Reclamado pelo Cliente *
              </label>
              <textarea
                required
                rows={3}
                value={problemReported}
                onChange={e => setProblemReported(e.target.value)}
                placeholder="Ex: Caiu e trincou a tela, não funciona o touch no canto."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">
                Diagnóstico Técnico / Solução Proposta
              </label>
              <textarea
                rows={3}
                value={technicalDiagnosis}
                onChange={e => setTechnicalDiagnosis(e.target.value)}
                placeholder="Ex: Troca de frontal OLED original e reprogramação de TrueTone."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">
                Técnico Responsável
              </label>
              <select
                value={assignedTechnicianId}
                onChange={e => setAssignedTechnicianId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.roleLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Status da OS</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-semibold"
              >
                <option value="open">Aberta (Entrada)</option>
                <option value="in_progress">Em Andamento</option>
                <option value="waiting_parts">Aguardando Peça</option>
                <option value="completed">Concluída (Pronta para retirada)</option>
                <option value="delivered">Entregue ao Cliente</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgente</option>
                <option value="warranty">Retorno em Garantia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Parts Used from Laboratory Stock */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
            <Wrench className="h-4 w-4 text-cyan-400" />
            <span>Peças Utilizadas do Estoque</span>
          </h4>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <select
              value={selectedPartId}
              onChange={e => setSelectedPartId(e.target.value)}
              className="flex-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            >
              <option value="">Selecione uma peça do laboratório...</option>
              {techParts.map(part => (
                <option key={part.id} value={part.id}>
                  {part.code} - {part.name} (Qtd: {part.quantity} un) - {formatCurrency(part.salePrice)}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              value={selectedPartQty}
              onChange={e => setSelectedPartQty(Number(e.target.value))}
              className="w-20 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 text-center font-mono"
            />

            <button
              type="button"
              onClick={handleAddPart}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Peça</span>
            </button>
          </div>

          {partsUsed.length > 0 && (
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-2xs">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-2">Peça</th>
                    <th className="p-2 text-center">Qtd</th>
                    <th className="p-2 text-right">Unitário</th>
                    <th className="p-2 text-right">Subtotal</th>
                    <th className="p-2 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {partsUsed.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-slate-200">{item.name}</td>
                      <td className="p-2 text-center font-mono">{item.quantity}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2 text-right font-mono font-bold text-white">{formatCurrency(item.subtotal)}</td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 5: Financials & Payment */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>Valores e Forma de Pagamento</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Mão de Obra (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={laborCost}
                onChange={e => setLaborCost(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Desconto (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono text-rose-400"
              />
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="pix">PIX</option>
                <option value="credit">Cartão de Crédito</option>
                <option value="debit">Cartão de Débito</option>
                <option value="cash">Dinheiro em Espécie</option>
                <option value="unpaid">A Pagar na Retirada</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-400 mb-1">Status Pagamento</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago / Quitado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
            <div className="text-2xs text-slate-400">
              <span>Garantia: {warrantyDays} dias</span> · <span>Peças: {formatCurrency(partsTotal)}</span> · <span>Mão de Obra: {formatCurrency(laborCost)}</span>
            </div>
            <div className="text-right">
              <span className="text-2xs text-slate-400 block">Total a Cobrar:</span>
              <span className="font-mono text-lg font-extrabold tabular-nums text-emerald-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions & Confirmation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div>
            {orderToEdit && (
              !isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all duration-200 active:scale-95 group shadow-sm hover:shadow-rose-950/20"
                  title="Excluir esta Ordem de Serviço permanentemente"
                >
                  <Trash2 className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
                  <span>Excluir OS</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-1.5 text-xs animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 text-2xs font-bold text-rose-200 px-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 animate-pulse" />
                    <span>Confirmar exclusão?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-2xs font-bold text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-950/40 active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Sim, Apagar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-2xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
                  >
                    Não
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
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950 hover:from-cyan-500 hover:to-blue-500 transition disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              {isSubmitting && <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              <span>
                {isSubmitting
                  ? 'Salvando no Banco...'
                  : orderToEdit
                  ? 'Salvar Alterações'
                  : 'Criar Ordem de Serviço'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
