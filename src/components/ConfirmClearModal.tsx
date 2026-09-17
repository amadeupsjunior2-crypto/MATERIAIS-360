import React from 'react';
import { RotateCcw, X, AlertCircle } from 'lucide-react';

interface ConfirmClearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmClearModal: React.FC<ConfirmClearModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#131924] border border-[#232c3d] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0d121c]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-white">Limpar Formulário</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-300">
            Deseja realmente limpar todos os campos e quantidades preenchidas no formulário?
          </p>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0d121c] flex items-center justify-end gap-2">
          <button
            type="button"
            id="btn-cancel-clear-form"
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-confirm-clear-form"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sim, Limpar Tudo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
