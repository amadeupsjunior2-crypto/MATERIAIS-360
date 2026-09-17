import React, { useMemo } from 'react';
import { X, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { Order } from '../types';
import { generateOrderPdf, downloadOrderPdf } from '../utils/pdfGenerator';

interface PdfPreviewModalProps {
  order: Partial<Order> | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const pdfDataUri = useMemo(() => {
    try {
      const doc = generateOrderPdf(order);
      return doc.output('datauristring');
    } catch (e) {
      console.error('Error rendering PDF:', e);
      return '';
    }
  }, [order]);

  const handleDownload = () => {
    downloadOrderPdf(order);
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#131924] border border-[#232c3d] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0d121c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Prévia do Documento PDF — {order.orderNumber || 'Novo Pedido'}
              </h3>
              <p className="text-xs text-slate-400">
                Loja Nº {order.storeNumber || '—'} ({order.storeName || 'Não informada'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white bg-[#172030] hover:bg-[#1f2b40] rounded-xl border border-slate-700/80 text-xs flex items-center gap-1.5 transition-colors"
              title="Imprimir"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 text-white bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="flex-1 bg-slate-900 p-2 sm:p-4 overflow-hidden flex items-center justify-center min-h-[450px]">
          {pdfDataUri ? (
            <iframe
              id="pdf-preview-iframe"
              src={pdfDataUri}
              className="w-full h-full min-h-[500px] rounded-lg border border-slate-800 bg-white"
              title="Pré-visualização do Pedido em PDF"
            />
          ) : (
            <div className="text-slate-400 text-sm">Gerando visualização do PDF...</div>
          )}
        </div>
      </div>
    </div>
  );
};
