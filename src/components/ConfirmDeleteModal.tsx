import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Order } from '../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#131924] border border-rose-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0d121c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Confirmar Exclusão de Pedido</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-300">
            Tem certeza de que deseja excluir este pedido permanentemente do banco de dados?
          </p>

          <div className="bg-[#0d121c] border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Protocolo:</span>
              <span className="font-mono font-bold text-blue-400">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Loja:</span>
              <span className="text-slate-200 font-semibold truncate max-w-[200px]">
                Nº {order.storeNumber} - {order.storeName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Responsável:</span>
              <span className="text-slate-200 font-medium">{order.responsibleName}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5">
              <span className="text-slate-500 font-medium">Total de Camisetas:</span>
              <span className="text-white font-bold">{order.totalShirts} unidades</span>
            </div>
          </div>

          <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
            ⚠️ Esta ação é irreversível e removerá o registro do histórico do sistema.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0d121c] flex items-center justify-end gap-2.5">
          <button
            type="button"
            id="btn-cancel-delete"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#172030] hover:bg-[#1f2b40] text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            id="btn-confirm-delete"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir Pedido'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
