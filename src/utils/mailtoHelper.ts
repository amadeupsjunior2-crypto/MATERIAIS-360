import { Order } from '../types';

export function buildOrderMailtoUrl(order: Partial<Order>): { url: string; recipient: string; subject: string; body: string } {
  const recipient = (order.supervisorEmail || 'amadeupsjunior2@gmail.com').trim();
  const supervisorName = (order.supervisorName || 'Supervisor').trim();
  const orderNum = order.orderNumber || `PED-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const dateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');

  const storeNum = order.storeNumber || 'Não informado';
  const storeName = order.storeName || 'Não informado';
  const respName = order.responsibleName || 'Não informado';
  const respCpf = order.responsibleCpf || 'Não informado';
  const respWhats = order.responsibleWhatsapp || 'Não informado';

  const blue = order.blueShirts || { P: 0, M: 0, G: 0, GG: 0 };
  const white = order.whiteShirts || { P: 0, M: 0, G: 0, GG: 0 };
  const blueTotal = order.blueTotal ?? (blue.P + blue.M + blue.G + blue.GG);
  const whiteTotal = order.whiteTotal ?? (white.P + white.M + white.G + white.GG);
  const total = order.totalShirts ?? (blueTotal + whiteTotal);

  const subject = `PEDIDO DE CAMISETAS - Loja ${storeNum} (${storeName}) - Prot. ${orderNum}`;

  const body = `Olá, Supervisor(a) ${supervisorName},

Segue a solicitação de camisetas realizada para a loja:

========================================
DADOS DA SOLICITAÇÃO
========================================
• Protocolo: ${orderNum}
• Data/Hora: ${dateFormatted}
• Loja: Nº ${storeNum} - ${storeName}
• Responsável: ${respName}
• CPF: ${respCpf}
• WhatsApp / Contato: ${respWhats}
• Supervisor: ${supervisorName}
• E-mail Supervisor: ${recipient}

========================================
GRADE DE CAMISETAS SOLICITADAS
========================================
► CAMISETAS AZUIS (Serviços Gerais):
  - Tam P:  ${blue.P} un
  - Tam M:  ${blue.M} un
  - Tam G:  ${blue.G} un
  - Tam GG: ${blue.GG} un
  Total Azuis: ${blueTotal} unidades

► CAMISETAS BRANCAS (Perecíveis):
  - Tam P:  ${white.P} un
  - Tam M:  ${white.M} un
  - Tam G:  ${white.G} un
  - Tam GG: ${white.GG} un
  Total Brancas: ${whiteTotal} unidades

----------------------------------------
TOTAL GERAL DE CAMISETAS: ${total} unidades
----------------------------------------

OBSERVAÇÕES:
${order.notes?.trim() ? order.notes.trim() : 'Nenhuma observação informada.'}

========================================
Mensagem gerada automaticamente pelo Sistema de Requisição de Material.
(O PDF oficial foi baixado para o seu dispositivo para ser anexado nesta mensagem se necessário.)
`;

  const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  return {
    url: mailtoUrl,
    recipient,
    subject,
    body,
  };
}
