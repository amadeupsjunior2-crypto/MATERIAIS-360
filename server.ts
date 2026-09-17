import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

interface ShirtSizes {
  P: number;
  M: number;
  G: number;
  GG: number;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  storeNumber: string;
  storeName: string;
  responsibleName: string;
  responsibleCpf: string;
  responsibleWhatsapp: string;
  supervisorName?: string;
  supervisorEmail?: string;
  blueShirts: ShirtSizes;
  whiteShirts: ShirtSizes;
  blueTotal: number;
  whiteTotal: number;
  totalShirts: number;
  notes?: string;
  status: 'novo' | 'em_separacao' | 'enviado' | 'entregue';
  emailSentTo?: string;
  emailSentAt?: string;
  emailStatus?: 'enviado' | 'pendente' | 'falha';
  emailMessage?: string;
}

interface AppSettings {
  recipientEmail: string;
  notifyOnSubmission: boolean;
  storeDefaultName?: string;
  smtpConfigured: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Clean production initialization - no mock / simulation orders
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

const defaultSettings: AppSettings = {
  recipientEmail: 'amadeupsjunior2@gmail.com',
  notifyOnSubmission: true,
  smtpConfigured: false,
};

if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), 'utf-8');
}

function readOrders(): Order[] {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading orders:', error);
    return [];
  }
}

function writeOrders(orders: Order[]): void {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

function readSettings(): AppSettings {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...defaultSettings, ...JSON.parse(data) };
  } catch (error) {
    return defaultSettings;
  }
}

function writeSettings(settings: AppSettings): void {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

async function sendOrderEmail(
  order: Order,
  recipientEmail: string,
  pdfBase64?: string
): Promise<{ success: boolean; status: 'enviado' | 'pendente' | 'falha'; message: string }> {
  const settings = readSettings();
  const targetEmail = recipientEmail || order.supervisorEmail || settings.recipientEmail || 'amadeupsjunior2@gmail.com';

  console.log(`[EMAIL DISPATCH] Preparing email for order ${order.orderNumber} to ${targetEmail}`);

  // Create HTML body for the email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 24px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0f172a; color: #ffffff; padding: 20px 24px;">
          <h2 style="margin: 0; font-size: 20px;">Novo Pedido de Camisetas #${order.orderNumber}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Recebido em ${new Date(order.createdAt).toLocaleString('pt-BR')}</p>
        </div>

        <div style="padding: 24px;">
          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a; text-transform: uppercase;">Dados da Loja e Responsável</h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Loja:</strong> Nº ${order.storeNumber} - ${order.storeName}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Responsável:</strong> ${order.responsibleName}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>CPF:</strong> ${order.responsibleCpf}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>WhatsApp / Contato:</strong> ${order.responsibleWhatsapp}</p>
            ${
              order.supervisorName || order.supervisorEmail
                ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Supervisor Super Fácil:</strong> ${order.supervisorName || ''} (${order.supervisorEmail || ''})</p>`
                : ''
            }
          </div>

          <h3 style="margin: 16px 0 8px 0; font-size: 15px; color: #0f172a;">Resumo dos Produtos Solicitados:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
            <thead>
              <tr style="background-color: #e2e8f0; text-align: left;">
                <th style="padding: 8px 12px; border: 1px solid #cbd5e1;">Produto</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">P</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">M</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">G</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">GG</th>
                <th style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;"><strong>Camisetas Azuis</strong> (Serviços Gerais)</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${order.blueShirts.P}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${order.blueShirts.M}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${order.blueShirts.G}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${order.blueShirts.GG}</td>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #2563eb;">${order.blueTotal} un</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1;"><strong>Camisetas Brancas</strong> (Perecíveis)</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${order.whiteShirts.P}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${order.whiteShirts.M}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${order.whiteShirts.G}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${order.whiteShirts.GG}</td>
                <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #475569;">${order.whiteTotal} un</td>
              </tr>
              <tr style="background-color: #f1f5f9; font-weight: bold;">
                <td colspan="5" style="padding: 10px 12px; border: 1px solid #cbd5e1; text-align: right;">TOTAL GERAL:</td>
                <td style="padding: 10px 12px; border: 1px solid #cbd5e1; text-align: right; font-size: 15px; color: #0f172a;">${order.totalShirts} unidades</td>
              </tr>
            </tbody>
          </table>

          ${
            order.notes
              ? `
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 4px; padding: 12px; margin-bottom: 20px;">
              <strong style="color: #92400e; font-size: 13px;">Observações:</strong>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #78350f;">${order.notes}</p>
            </div>
          `
              : ''
          }

          <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
            📄 O arquivo PDF oficial deste pedido está anexado a esta mensagem e armazenado no banco de dados.
          </p>
        </div>

        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
          Sistema de Gestão e Requisição de Uniformes Super Fácil
        </div>
      </div>
    </div>
  `;

  // Check if SMTP environment or settings are configured
  const smtpHost = process.env.SMTP_HOST || settings.smtpHost;
  const smtpUser = process.env.SMTP_USER || settings.smtpUser;
  const smtpPass = process.env.SMTP_PASS || settings.smtpPass;
  const smtpPort = Number(process.env.SMTP_PORT || settings.smtpPort || 587);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const attachments = [];
      if (pdfBase64) {
        const cleanBase64 = pdfBase64
          .replace(/^data:application\/pdf;filename=[^;]+;base64,/, '')
          .replace(/^data:application\/pdf;base64,/, '');
        attachments.push({
          filename: `Pedido_${order.orderNumber}_Loja_${order.storeNumber}.pdf`,
          content: Buffer.from(cleanBase64, 'base64'),
          contentType: 'application/pdf',
        });
      }

      await transporter.sendMail({
        from: `"Sistema de Requisições Super Fácil" <${smtpUser}>`,
        to: targetEmail,
        subject: `PEDIDO CAMISETAS SUPER FÁCIL - Loja ${order.storeNumber} (${order.storeName}) - Prot. ${order.orderNumber}`,
        html: htmlContent,
        attachments,
      });

      console.log(`[EMAIL DISPATCH] Email successfully sent via SMTP to ${targetEmail}`);
      return {
        success: true,
        status: 'enviado',
        message: `E-mail com PDF enviado com sucesso via SMTP para ${targetEmail}`,
      };
    } catch (err: any) {
      console.error(`[EMAIL SMTP ERROR] Failed sending via SMTP: ${err.message}`);
      return {
        success: false,
        status: 'falha',
        message: `Falha no envio SMTP: ${err.message}`,
      };
    }
  }

  // If SMTP is not actively configured
  console.log(`[EMAIL DISPATCH] SMTP not configured. Order stored in database without external email.`);
  return {
    success: false,
    status: 'pendente',
    message: `Pedido gravado no banco de dados. SMTP não configurado para envio de e-mail externo.`,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API: Get all orders
  app.get('/api/orders', (req, res) => {
    try {
      let orders = readOrders();
      const { search, status } = req.query;

      if (search && typeof search === 'string') {
        const query = search.toLowerCase();
        orders = orders.filter(
          (o) =>
            o.storeNumber.toLowerCase().includes(query) ||
            o.storeName.toLowerCase().includes(query) ||
            o.responsibleName.toLowerCase().includes(query) ||
            o.responsibleCpf.toLowerCase().includes(query) ||
            o.orderNumber.toLowerCase().includes(query) ||
            (o.supervisorName && o.supervisorName.toLowerCase().includes(query)) ||
            (o.supervisorEmail && o.supervisorEmail.toLowerCase().includes(query))
        );
      }

      if (status && typeof status === 'string' && status !== 'todos') {
        orders = orders.filter((o) => o.status === status);
      }

      // Sort by newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ success: true, orders, total: orders.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API: Get order by ID
  app.get('/api/orders/:id', (req, res) => {
    try {
      const orders = readOrders();
      const order = orders.find((o) => o.id === req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
      }
      res.json({ success: true, order });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API: Create new order
  app.post('/api/orders', async (req, res) => {
    try {
      const {
        storeNumber,
        storeName,
        responsibleName,
        responsibleCpf,
        responsibleWhatsapp,
        supervisorName,
        supervisorEmail,
        blueShirts,
        whiteShirts,
        notes,
        pdfBase64,
        recipientEmail,
      } = req.body;

      if (!storeNumber || !storeName || !responsibleName || !responsibleCpf || !responsibleWhatsapp) {
        return res.status(400).json({
          success: false,
          error: 'Por favor preencha todos os campos obrigatórios da Identificação.',
        });
      }

      const blue = {
        P: Number(blueShirts?.P) || 0,
        M: Number(blueShirts?.M) || 0,
        G: Number(blueShirts?.G) || 0,
        GG: Number(blueShirts?.GG) || 0,
      };

      const white = {
        P: Number(whiteShirts?.P) || 0,
        M: Number(whiteShirts?.M) || 0,
        G: Number(whiteShirts?.G) || 0,
        GG: Number(whiteShirts?.GG) || 0,
      };

      const blueTotal = blue.P + blue.M + blue.G + blue.GG;
      const whiteTotal = white.P + white.M + white.G + white.GG;
      const totalShirts = blueTotal + whiteTotal;

      if (totalShirts === 0) {
        return res.status(400).json({
          success: false,
          error: 'Selecione pelo menos uma camiseta (azul ou branca) para registrar o pedido.',
        });
      }

      const orders = readOrders();
      const orderSeq = (orders.length + 1).toString().padStart(3, '0');
      const orderNumber = `PED-${new Date().getFullYear()}-${orderSeq}`;
      const now = new Date().toISOString();

      const newOrder: Order = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        orderNumber,
        createdAt: now,
        storeNumber: String(storeNumber).trim(),
        storeName: String(storeName).trim(),
        responsibleName: String(responsibleName).trim(),
        responsibleCpf: String(responsibleCpf).trim(),
        responsibleWhatsapp: String(responsibleWhatsapp).trim(),
        supervisorName: supervisorName ? String(supervisorName).trim() : undefined,
        supervisorEmail: supervisorEmail ? String(supervisorEmail).trim() : undefined,
        blueShirts: blue,
        whiteShirts: white,
        blueTotal,
        whiteTotal,
        totalShirts,
        notes: notes ? String(notes).trim() : undefined,
        status: 'novo',
      };

      // Handle email dispatch
      const settings = readSettings();
      const targetEmail = supervisorEmail || recipientEmail || settings.recipientEmail || 'amadeupsjunior2@gmail.com';

      const emailResult = await sendOrderEmail(newOrder, targetEmail, pdfBase64);
      newOrder.emailSentTo = targetEmail;
      newOrder.emailSentAt = now;
      newOrder.emailStatus = emailResult.status;
      newOrder.emailMessage = emailResult.message;

      orders.unshift(newOrder);
      writeOrders(orders);

      res.status(201).json({
        success: true,
        order: newOrder,
        message: 'Pedido registrado no banco de dados com sucesso!',
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API: Update order status or details
  app.patch('/api/orders/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const orders = readOrders();
      const index = orders.findIndex((o) => o.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
      }

      if (status) orders[index].status = status;
      if (notes !== undefined) orders[index].notes = notes;

      writeOrders(orders);
      res.json({ success: true, order: orders[index] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API: Delete order
  app.delete('/api/orders/:id', (req, res) => {
    try {
      const { id } = req.params;
      const orders = readOrders();
      const index = orders.findIndex((o) => o.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
      }

      const deleted = orders.splice(index, 1);
      writeOrders(orders);

      res.json({ success: true, message: 'Pedido excluído com sucesso', deletedOrder: deleted[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API: Send email manually / resend
  app.post('/api/send-email', async (req, res) => {
    try {
      const { orderId, email, pdfBase64 } = req.body;
      const orders = readOrders();
      const order = orders.find((o) => o.id === orderId);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
      }

      const targetEmail = email || order.supervisorEmail || order.emailSentTo || 'amadeupsjunior2@gmail.com';
      const result = await sendOrderEmail(order, targetEmail, pdfBase64);

      order.emailSentTo = targetEmail;
      order.emailSentAt = new Date().toISOString();
      order.emailStatus = result.status;
      order.emailMessage = result.message;

      writeOrders(orders);

      res.json({
        success: result.success,
        status: result.status,
        message: result.message,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API: Test SMTP connection
  app.post('/api/test-smtp', async (req, res) => {
    try {
      const { host, port, user, pass, recipient } = req.body;

      if (!host || !user || !pass) {
        return res.status(400).json({
          success: false,
          error: 'Servidor host, usuário e senha são obrigatórios para testar.',
        });
      }

      const testPort = Number(port || 587);
      const transporter = nodemailer.createTransport({
        host,
        port: testPort,
        secure: testPort === 465,
        auth: { user, pass },
      });

      // Verify connection configuration
      await transporter.verify();

      // If a recipient was specified, send test message
      if (recipient) {
        await transporter.sendMail({
          from: `"Teste de Conexão Super Fácil" <${user}>`,
          to: recipient,
          subject: '✅ Teste de Conexão SMTP - Sistema de Requisições',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #059669; margin-top: 0;">Conexão SMTP Estabelecida com Sucesso!</h2>
              <p style="color: #334155; font-size: 14px;">Este é um e-mail de teste enviado em ${new Date().toLocaleString('pt-BR')} para confirmar que as credenciais do seu servidor de e-mail estão funcionando perfeitamente.</p>
            </div>
          `,
        });
      }

      res.json({
        success: true,
        message: recipient
          ? `Conexão SMTP validada e e-mail de teste transmitido com sucesso para ${recipient}!`
          : 'Conexão e autenticação com o servidor SMTP validadas com sucesso!',
      });
    } catch (error: any) {
      console.error('SMTP test error:', error);
      res.status(500).json({
        success: false,
        error: `Falha na conexão SMTP: ${error.message}`,
      });
    }
  });

  // API: Get settings
  app.get('/api/settings', (req, res) => {
    try {
      const settings = readSettings();
      res.json({ success: true, settings });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API: Save settings
  app.post('/api/settings', (req, res) => {
    try {
      const { recipientEmail, notifyOnSubmission, storeDefaultName, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

      const current = readSettings();
      const updated: AppSettings = {
        ...current,
        recipientEmail: recipientEmail !== undefined ? String(recipientEmail).trim() : current.recipientEmail,
        notifyOnSubmission: notifyOnSubmission !== undefined ? Boolean(notifyOnSubmission) : current.notifyOnSubmission,
        storeDefaultName: storeDefaultName !== undefined ? String(storeDefaultName).trim() : current.storeDefaultName,
        smtpHost: smtpHost !== undefined ? String(smtpHost).trim() : current.smtpHost,
        smtpPort: smtpPort !== undefined ? Number(smtpPort) : current.smtpPort,
        smtpUser: smtpUser !== undefined ? String(smtpUser).trim() : current.smtpUser,
        smtpPass: smtpPass !== undefined ? String(smtpPass) : current.smtpPass,
        smtpConfigured: Boolean((smtpHost || current.smtpHost) && (smtpUser || current.smtpUser)),
      };

      writeSettings(updated);
      res.json({ success: true, settings: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
