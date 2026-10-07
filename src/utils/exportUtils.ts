import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ServiceOrder,
  Sale,
  Product,
  TechPart,
  FinancialEntry,
  CommissionRecord,
  StoreSettings
} from '../types';
import { formatCurrency, formatDate, formatDateTime, getOSStatusInfo } from './formatters';

// CSV Exporter Helper
export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent = [
    headers.join(';'),
    ...rows.map(row =>
      row
        .map(cell => {
          if (cell === null || cell === undefined) return '""';
          const stringCell = String(cell).replace(/"/g, '""');
          return `"${stringCell}"`;
        })
        .join(';')
    )
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Add standard header to PDF reports
const addPDFHeader = (doc: jsPDF, title: string, settings: StoreSettings) => {
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(settings.storeName.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `${settings.address} | Tel: ${settings.phone} | CNPJ: ${settings.cnpj}`,
    14,
    18
  );

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const dateStr = `Emitido em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(dateStr, doc.internal.pageSize.width - 14, 15, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 34);
};

// Export Service Orders to PDF
export const exportOrdersToPDF = (orders: ServiceOrder[], settings: StoreSettings) => {
  const doc = new jsPDF();
  addPDFHeader(doc, 'RELATÓRIO GERAL DE ORDENS DE SERVIÇO', settings);

  const tableData = orders.map(order => [
    order.id,
    formatDate(order.createdAt),
    order.clientName,
    `${order.brand} ${order.model}`,
    order.assignedTechnicianName,
    getOSStatusInfo(order.status).label,
    formatCurrency(order.totalAmount)
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Nº OS', 'Data', 'Cliente', 'Aparelho', 'Técnico', 'Status', 'Valor Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  const totalValue = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Ordens: ${orders.length}`, 14, finalY);
  doc.text(`Faturamento Total Previsto/Realizado: ${formatCurrency(totalValue)}`, doc.internal.pageSize.width - 14, finalY, { align: 'right' });

  doc.save(`iGyn_Cell_Relatorio_OS_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Export Individual Work Order Sheet PDF (Folha de Ordem de Serviço)
export const exportSingleOrderPDF = (order: ServiceOrder, settings: StoreSettings) => {
  const doc = new jsPDF();
  addPDFHeader(doc, `ORDEM DE SERVIÇO Nº ${order.id}`, settings);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, doc.internal.pageSize.width - 28, 26, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DADOS DO CLIENTE', 18, 44);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Nome: ${order.clientName}`, 18, 50);
  doc.text(`Telefone: ${order.clientPhone}`, 18, 56);
  doc.text(`CPF/CNPJ: ${order.clientCpf || 'Não informado'}`, 110, 50);
  doc.text(`Data Entrada: ${formatDateTime(order.createdAt)}`, 110, 56);

  // Equipment info box
  doc.roundedRect(14, 68, doc.internal.pageSize.width - 28, 32, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DADOS DO EQUIPAMENTO & CONDIÇÃO DE ENTRADA', 18, 74);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Aparelho: ${order.deviceType} ${order.brand} ${order.model} (${order.color})`, 18, 80);
  doc.text(`IMEI/Serial: ${order.imeiOrSerial || 'N/A'} | Senha: ${order.passcode || 'Sem senha'}`, 18, 86);
  doc.text(`Estado Físico: ${order.physicalCondition || 'Sem avarias visíveis'}`, 18, 92);

  // Problem & Diagnosis
  doc.roundedRect(14, 104, doc.internal.pageSize.width - 28, 28, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DEFEITO RECLAMADO & DIAGNÓSTICO', 18, 110);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const problemLines = doc.splitTextToSize(`Problema: ${order.problemReported}`, 170);
  doc.text(problemLines, 18, 116);

  const diagLines = doc.splitTextToSize(`Diagnóstico / Solução: ${order.technicalDiagnosis || 'Em análise técnica.'}`, 170);
  doc.text(diagLines, 18, 124);

  // Services & Parts autoTable
  const items = [
    ...order.partsUsed.map(p => ['Peça', p.name, p.quantity, formatCurrency(p.unitPrice), formatCurrency(p.subtotal)]),
    ...order.servicesRendered.map(s => ['Serviço', s.name, 1, formatCurrency(s.price), formatCurrency(s.price)])
  ];

  autoTable(doc, {
    startY: 136,
    head: [['Tipo', 'Descrição', 'Qtd', 'Unitário', 'Total']],
    body: items.length > 0 ? items : [['-', 'Mão de Obra e Diagnóstico Geral', '1', formatCurrency(order.laborCost), formatCurrency(order.laborCost)]],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 20 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Financial summary
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Técnico Responsável: ${order.assignedTechnicianName}`, 14, finalY);
  doc.text(`Subtotal Peças: ${formatCurrency(order.partsTotal)}`, 130, finalY);
  doc.text(`Mão de Obra: ${formatCurrency(order.laborCost)}`, 130, finalY + 5);
  if (order.discount > 0) {
    doc.text(`Desconto: - ${formatCurrency(order.discount)}`, 130, finalY + 10);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`VALOR TOTAL: ${formatCurrency(order.totalAmount)}`, 130, finalY + (order.discount > 0 ? 16 : 12));

  // Terms and Signature
  const termY = finalY + 28;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const terms = doc.splitTextToSize(`TERMOS DE GARANTIA: ${settings.warrantyTerms}`, doc.internal.pageSize.width - 28);
  doc.text(terms, 14, termY);

  const sigY = termY + 24;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, sigY, 90, sigY);
  doc.line(120, sigY, 190, sigY);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Assinatura do Cliente', 55, sigY + 4, { align: 'center' });
  doc.text('iGyn Cell - Responsável Técnico', 155, sigY + 4, { align: 'center' });

  doc.save(`iGyn_Cell_OS_${order.id}.pdf`);
};

// Export Sales to PDF
export const exportSalesToPDF = (sales: Sale[], settings: StoreSettings) => {
  const doc = new jsPDF();
  addPDFHeader(doc, 'RELATÓRIO GERAL DE VENDAS', settings);

  const tableData = sales.map(sale => [
    sale.id,
    formatDate(sale.createdAt),
    sale.clientName,
    sale.sellerName,
    sale.paymentMethod.toUpperCase(),
    formatCurrency(sale.totalAmount),
    formatCurrency(sale.commissionAmount)
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Cód Venda', 'Data', 'Cliente', 'Vendedor', 'Pagamento', 'Valor Total', 'Comissão']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 22 },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' }
    }
  });

  const totalSales = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalComm = sales.reduce((acc, curr) => acc + curr.commissionAmount, 0);
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Vendas: ${sales.length}`, 14, finalY);
  doc.text(`Total Faturado: ${formatCurrency(totalSales)} | Comissões Geradas: ${formatCurrency(totalComm)}`, doc.internal.pageSize.width - 14, finalY, { align: 'right' });

  doc.save(`iGyn_Cell_Relatorio_Vendas_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Export Inventory & Parts to PDF
export const exportInventoryToPDF = (products: Product[], parts: TechPart[], settings: StoreSettings) => {
  const doc = new jsPDF();
  addPDFHeader(doc, 'INVENTÁRIO GERAL DE PRODUTOS E PEÇAS TÉCNICAS', settings);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PRODUTOS E ACESSÓRIOS DE BALCÃO', 14, 40);

  const prodData = products.map(p => [
    p.code,
    p.name,
    p.category,
    p.quantity,
    p.minQuantity,
    formatCurrency(p.costPrice),
    formatCurrency(p.salePrice)
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['Código', 'Nome do Produto', 'Categoria', 'Estoque', 'Mín', 'Custo', 'Venda']],
    body: prodData,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  const partStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. PEÇAS TÉCNICAS DE REPOSIÇÃO (LABORATÓRIO)', 14, partStartY);

  const partData = parts.map(p => [
    p.code,
    p.name,
    p.category,
    p.quantity,
    p.minQuantity,
    formatCurrency(p.costPrice),
    formatCurrency(p.salePrice)
  ]);

  autoTable(doc, {
    startY: partStartY + 4,
    head: [['Código', 'Nome da Peça', 'Categoria', 'Estoque', 'Mín', 'Custo', 'Venda OS']],
    body: partData,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  doc.save(`iGyn_Cell_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Export Financial to PDF
export const exportFinancialToPDF = (entries: FinancialEntry[], settings: StoreSettings) => {
  const doc = new jsPDF();
  addPDFHeader(doc, 'DEMONSTRATIVO FINANCEIRO E FLUXO DE CAIXA', settings);

  const tableData = entries.map(e => [
    e.id,
    formatDate(e.dueDate),
    e.type === 'income' ? 'RECEITA' : 'DESPESA',
    e.category,
    e.description,
    e.status.toUpperCase(),
    formatCurrency(e.amount)
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Cód', 'Vencimento', 'Tipo', 'Categoria', 'Descrição', 'Status', 'Valor']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      2: { fontStyle: 'bold' },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  const totalIncome = entries.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Receitas: ${formatCurrency(totalIncome)} | Total Despesas: ${formatCurrency(totalExpense)} | Saldo Operacional: ${formatCurrency(balance)}`, 14, finalY);

  doc.save(`iGyn_Cell_Relatorio_Financeiro_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Export Commissions to PDF
export const exportCommissionsToPDF = (commissions: CommissionRecord[], settings: StoreSettings) => {
  const doc = new jsPDF();
  addPDFHeader(doc, 'RELATÓRIO DE COMISSÕES DE COLABORADORES', settings);

  const tableData = commissions.map(c => [
    c.id,
    formatDate(c.createdAt),
    c.employeeName,
    c.type === 'sale' ? 'Venda' : 'Ordem de Serviço',
    c.description,
    `${c.rate}%`,
    c.status === 'paid' ? 'PAGO' : 'PENDENTE',
    formatCurrency(c.commissionAmount)
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['ID', 'Data', 'Colaborador', 'Origem', 'Descrição', 'Taxa', 'Status', 'Comissão']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      7: { halign: 'right', fontStyle: 'bold' }
    }
  });

  const totalComm = commissions.reduce((acc, curr) => acc + curr.commissionAmount, 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((acc, curr) => acc + curr.commissionAmount, 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((acc, curr) => acc + curr.commissionAmount, 0);

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Gerado: ${formatCurrency(totalComm)} | Total Pago: ${formatCurrency(totalPaid)} | Pendente de Pagamento: ${formatCurrency(totalPending)}`, 14, finalY);

  doc.save(`iGyn_Cell_Relatorio_Comissoes_${new Date().toISOString().slice(0, 10)}.pdf`);
};
