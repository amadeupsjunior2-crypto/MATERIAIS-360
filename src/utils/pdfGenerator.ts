import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export function generateOrderPdf(order: Partial<Order>): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const lightBg: [number, number, number] = [241, 245, 249]; // slate-100

  // Top header banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PEDIDO DE CAMISETAS', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprovante de Solicitação e Registro de Pedido', 14, 20);

  // Protocol and Date box on the right
  const orderNum = order.orderNumber || `PED-${Date.now().toString().slice(-6)}`;
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Nº ${orderNum}`, 196, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Data: ${dateStr}`, 196, 20, { align: 'right' });

  let currentY = 34;

  // Section 1: Dados da Loja, Responsável e Supervisor
  const hasSupervisor = Boolean(order.supervisorName || order.supervisorEmail);
  const cardHeight = hasSupervisor ? 46 : 38;

  doc.setFillColor(...lightBg);
  doc.roundedRect(14, currentY, 182, cardHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, 182, cardHeight, 2, 2, 'S');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('01. DADOS DE IDENTIFICAÇÃO', 18, currentY + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Número da Loja:', 18, currentY + 15);
  doc.text('Nome da Loja:', 75, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.text(order.storeNumber || 'Não informado', 45, currentY + 15);
  doc.text(order.storeName || 'Não informado', 100, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Responsável:', 18, currentY + 23);
  doc.setFont('helvetica', 'normal');
  doc.text(order.responsibleName || 'Não informado', 45, currentY + 23);

  doc.setFont('helvetica', 'bold');
  doc.text('CPF:', 18, currentY + 31);
  doc.text('Contato / WhatsApp:', 75, currentY + 31);

  doc.setFont('helvetica', 'normal');
  doc.text(order.responsibleCpf || 'Não informado', 45, currentY + 31);
  doc.text(order.responsibleWhatsapp || 'Não informado', 115, currentY + 31);

  if (hasSupervisor) {
    doc.setFont('helvetica', 'bold');
    doc.text('Supervisor:', 18, currentY + 39);
    doc.text('E-mail Supervisor:', 75, currentY + 39);

    doc.setFont('helvetica', 'normal');
    doc.text(order.supervisorName || 'Não informado', 45, currentY + 39);
    doc.text(order.supervisorEmail || 'Não informado', 115, currentY + 39);
  }

  currentY += cardHeight + 8;

  // Section 2: Tabela de Itens
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('02. DISCRIMINAÇÃO DOS PRODUTOS', 14, currentY);

  currentY += 4;

  const blue = order.blueShirts || { P: 0, M: 0, G: 0, GG: 0 };
  const white = order.whiteShirts || { P: 0, M: 0, G: 0, GG: 0 };
  const blueTotal = order.blueTotal ?? (blue.P + blue.M + blue.G + blue.GG);
  const whiteTotal = order.whiteTotal ?? (white.P + white.M + white.G + white.GG);
  const grandTotal = order.totalShirts ?? (blueTotal + whiteTotal);

  autoTable(doc, {
    startY: currentY,
    head: [['Item / Categoria', 'Tam. P', 'Tam. M', 'Tam. G', 'Tam. GG', 'Subtotal']],
    body: [
      [
        'Camisetas Azuis — Serviços Gerais',
        blue.P.toString(),
        blue.M.toString(),
        blue.G.toString(),
        blue.GG.toString(),
        `${blueTotal} un`,
      ],
      [
        'Camisetas Brancas — Perecíveis',
        white.P.toString(),
        white.M.toString(),
        white.G.toString(),
        white.GG.toString(),
        `${whiteTotal} un`,
      ],
    ],
    foot: [
      ['TOTAL GERAL DE CAMISETAS', '', '', '', '', `${grandTotal} unidades`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      halign: 'center',
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 82 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { fontStyle: 'bold', halign: 'right', cellWidth: 20 },
    },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'right',
    },
    margin: { left: 14, right: 14 },
  });

  // Get position after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastAutoTable = (doc as any).lastAutoTable;
  currentY = lastAutoTable ? lastAutoTable.finalY + 12 : currentY + 45;

  // Notes section
  if (order.notes) {
    doc.setFillColor(...lightBg);
    doc.roundedRect(14, currentY, 182, 24, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, 182, 24, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text('Observações do Pedido:', 18, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(doc.splitTextToSize(order.notes, 174), 18, currentY + 14);

    currentY += 32;
  } else {
    currentY += 4;
  }

  // Signature and confirmation section
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(18, currentY + 28, 90, currentY + 28);
  doc.line(110, currentY + 28, 192, currentY + 28);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Assinatura do Responsável', 54, currentY + 34, { align: 'center' });
  doc.text('Data de Recebimento / Visto Expedição', 151, currentY + 34, { align: 'center' });

  // Footer bar
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado automaticamente pelo Sistema de Gestão de Pedidos.', 105, 287, { align: 'center' });

  return doc;
}

export function downloadOrderPdf(order: Partial<Order>, filename?: string): void {
  const doc = generateOrderPdf(order);
  const name = filename || `pedido-${order.orderNumber || order.storeNumber || 'camisetas'}.pdf`;
  doc.save(name);
}

export function getOrderPdfBase64(order: Partial<Order>): string {
  const doc = generateOrderPdf(order);
  return doc.output('datauristring');
}

export function getOrderPdfBlob(order: Partial<Order>): Blob {
  const doc = generateOrderPdf(order);
  return doc.output('blob');
}
