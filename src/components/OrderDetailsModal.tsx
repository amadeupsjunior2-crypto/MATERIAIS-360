import React from 'react';
import {
  X,
  Download,
  Mail,
  Calendar,
  Store,
  User,
  Phone,
  CreditCard,
  Clock,
  FileText,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { downloadOrderPdf } from '../utils/pdfGenerator';
import { buildOrderMailtoUrl } from '../utils/mailtoHelper';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onResendEmail?: (order: Order) => Promise<void>;
  onDeleteOrder?: (id: string) => Promise<void>;
  onUpdateStatus?: (id: string, status: OrderStatus) => Promise<void>;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  if (!isOpen || !order) return null;

  const mailtoInfo = buildOrderMailtoUrl(order);

  const handleOpenMailClient = () => {
    downloadOrderPdf(order);
    window.location.href = mailtoInfo.url;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#131924] border border-[#232c3d] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d121c]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                {order.orderNumber}
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Detalhes do Pedido Registrado</h3>
                <p className="text-xs text-slate-400">
                  Registrado em {new Date(order.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Status Selector Bar */}
            {onUpdateStatus && (
              <div className="bg-[#0d121c] border border-[#232c3d] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Status Atual do Pedido:</span>
                <select
                  id={`details-select-status-${order.id}`}
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                  className="bg-[#161f30] border border-[#2a3548] text-xs font-semibold rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="novo">Novo</option>
                  <option value="em_separacao">Em Separação</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregue">Entregue</option>
                </select>
              </div>
            )}

            {/* Loja e Responsável */}
            <div className="bg-[#0d121c] border border-[#232c3d] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Loja</span>
                <p className="text-white font-bold text-sm mt-0.5">Nº {order.storeNumber} - {order.storeName}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Responsável</span>
                <p className="text-white font-bold text-sm mt-0.5">{order.responsibleName}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">CPF</span>
                <p className="text-slate-300 font-mono mt-0.5">{order.responsibleCpf}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Contato / WhatsApp</span>
                <p className="text-slate-300 font-mono mt-0.5">{order.responsibleWhatsapp}</p>
              </div>
              {(order.supervisorName || order.supervisorEmail) && (
                <>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Supervisor Responsável</span>
                    <p className="text-blue-400 font-medium text-xs mt-0.5">{order.supervisorName || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">E-mail do Supervisor</span>
                    <p className="text-slate-300 text-xs mt-0.5">{order.supervisorEmail || 'Não informado'}</p>
                  </div>
                </>
              )}
            </div>

            {/* Breakdown Table */}
            <div className="bg-[#0d121c] border border-[#232c3d] rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Grade de Camisetas Solicitadas
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {/* Blue Shirts */}
                <div className="bg-[#131924] border border-[#232c3d] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                      Camisetas Azuis — Serviços Gerais
                    </span>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      Total: {order.blueTotal} un
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-[#0d121c] p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tam P</span>
                      <span className="text-white font-bold">{order.blueShirts?.P || 0}</span>
                    </div>
                    <div className="bg-[#0d121c] p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tam M</span>
                      <span className="text-white font-bold">{order.blueShirts?.M || 0}</span>
                    </div>
                    <div className="bg-[#0d121c] p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tam G</span>
                      <span className="text-white font-bold">{order.blueShirts?.G || 0}</span>
                    </div>
                    <div className="bg-[#0d121c] p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tam GG</span>
                      <span className="text-white font-bold">{order.blueShirts?.GG || 0}</span>
                    </div>
                  </div>
                </div>

                {/* White Shirts */}
                <div className="bg-[#131924] border border-[#232c3d] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-slate-300"></span>
                      Camisetas Brancas — Perecíveis
                    </span>
                    <span className="text-xs font-bold text-slate-300 bg-slate-500/10 px-2 py-0.5 rounded">
                      Total: {order.whiteTotal} un
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-[#0d121c] p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tam P</span>
                      <span className="text-white font-bold">{order.whiteShirts?.P || 0}</span>
                    </div>
                    <div className="bg-[#0d121c] p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tam M</span>
                      <span className="text-white font-bold">{order.whiteShirts?.M || 0}</span>
                    </div>
                    <div className="bg-[#0d121c] p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tam G</span>
                      <span className="text-white font-bold">{order.whiteShirts?.G || 0}</span>
                    </div>
                    <div className="bg-[#0d121c] p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Tam GG</span>
                      <span className="text-white font-bold">{order.whiteShirts?.GG || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">TOTAL GERAL DE CAMISETAS</span>
                <span className="font-mono font-extrabold text-indigo-400 text-lg">{order.totalShirts} unidades</span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-[#0d121c] border border-[#232c3d] rounded-xl p-3.5">
                <span className="text-slate-400 block text-[11px] uppercase font-semibold mb-1">
                  Observações do Pedido
                </span>
                <p className="text-slate-200 text-xs">{order.notes}</p>
              </div>
            )}

            {/* Email Info */}
            <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="text-blue-300 font-semibold block">Destinatário do Pedido</span>
                  <span className="text-slate-400">{order.supervisorEmail || order.emailSentTo || 'amadeupsjunior2@gmail.com'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenMailClient}
                className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Abrir no E-mail</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-800 bg-[#0d121c] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#172030] hover:bg-[#1f2b40] text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-semibold transition-colors"
            >
              Fechar
            </button>

            <button
              type="button"
              id="btn-details-download-pdf"
              onClick={() => downloadOrderPdf(order)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
