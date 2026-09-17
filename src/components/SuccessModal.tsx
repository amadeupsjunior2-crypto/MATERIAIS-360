import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, Database, PlusCircle, Mail } from 'lucide-react';
import { Order } from '../types';
import { downloadOrderPdf } from '../utils/pdfGenerator';
import { buildOrderMailtoUrl } from '../utils/mailtoHelper';

interface SuccessModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDatabase: () => void;
  onNewOrder: () => void;
  isAdmin?: boolean;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  order,
  isOpen,
  onClose,
  onViewDatabase,
  onNewOrder,
  isAdmin = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger festive confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#38bdf8', '#818cf8', '#10b981'],
      });
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const mailtoInfo = buildOrderMailtoUrl(order);

  const handleSendEmailOnly = () => {
    // Ação exclusiva: mailto:emailsupervisor com o texto do pedido
    window.location.href = mailtoInfo.url;
  };

  const supervisorDisplayName = order.supervisorName?.trim() || 'Supervisor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#131924] border border-[#232c3d] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-center p-6 sm:p-8 relative max-h-[95vh] overflow-y-auto">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 mb-4 ring-4 ring-emerald-500/10">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          {isAdmin ? 'Pedido Registrado no Banco com Sucesso!' : 'Requisição Realizada com Sucesso!'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
          {isAdmin
            ? 'Os dados foram registrados no banco de dados com protocolo oficial.'
            : 'Sua solicitação foi gravada com sucesso. O e-mail e o comprovante em PDF estão prontos.'}
        </p>

        {/* Order Protocol Box */}
        <div className="my-5 bg-[#0d121c] border border-[#232c3d] rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs text-slate-400">Protocolo da Requisição:</span>
            <span className="font-mono font-bold text-blue-400 text-sm">{order.orderNumber}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Loja:</span>
              <span className="text-slate-200 font-semibold truncate block">
                Nº {order.storeNumber} - {order.storeName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Responsável:</span>
              <span className="text-slate-200 font-semibold truncate block">{order.responsibleName}</span>
            </div>
          </div>

          {(order.supervisorName || order.supervisorEmail) && (
            <div className="pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 block text-[11px]">Supervisor Destinatário:</span>
              <span className="text-blue-400 font-medium truncate block">
                {order.supervisorName || 'Supervisor'} ({order.supervisorEmail || 'E-mail'})
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800">
            <div className="bg-[#161f30] p-2 rounded-xl">
              <span className="text-blue-400 block text-[10px] font-semibold">Azuis</span>
              <span className="text-white font-bold text-sm">{order.blueTotal} un</span>
            </div>
            <div className="bg-[#161f30] p-2 rounded-xl">
              <span className="text-slate-300 block text-[10px] font-semibold">Brancas</span>
              <span className="text-white font-bold text-sm">{order.whiteTotal} un</span>
            </div>
            <div className="bg-indigo-950/40 p-2 rounded-xl border border-indigo-500/20">
              <span className="text-indigo-400 block text-[10px] font-semibold">Total</span>
              <span className="text-white font-bold text-sm">{order.totalShirts} un</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Direct Mailto Button with Full Order Body */}
          <button
            type="button"
            id="btn-send-mailto"
            onClick={handleSendEmailOnly}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            <Mail className="w-4 h-4" />
            <span>Enviar email para {supervisorDisplayName}</span>
          </button>

          <button
            type="button"
            id="btn-download-pdf-success"
            onClick={() => downloadOrderPdf(order)}
            className="w-full py-2.5 px-4 bg-[#172030] hover:bg-[#1f2b40] text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Baixar Comprovante em PDF</span>
          </button>

          {isAdmin ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onViewDatabase}
                className="py-2.5 px-3 bg-[#172030] hover:bg-[#1f2b40] text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ver no Banco</span>
              </button>

              <button
                type="button"
                onClick={onNewOrder}
                className="py-2.5 px-3 bg-[#172030] hover:bg-[#1f2b40] text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Novo Pedido</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onNewOrder}
              className="w-full py-2.5 px-3 bg-[#172030] hover:bg-[#1f2b40] text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fazer Outra Requisição</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
