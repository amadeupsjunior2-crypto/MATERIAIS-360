export interface ShirtSizes {
  P: number;
  M: number;
  G: number;
  GG: number;
}

export type OrderStatus = 'novo' | 'em_separacao' | 'enviado' | 'entregue';

export interface Order {
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
  status: OrderStatus;
  emailSentTo?: string;
  emailSentAt?: string;
  emailStatus?: 'enviado' | 'pendente' | 'falha';
  emailMessage?: string;
}

export interface AppSettings {
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
