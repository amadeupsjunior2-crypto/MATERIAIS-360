import React from 'react';
import { Package, ShieldAlert, Copy, Check, Eye } from 'lucide-react';

interface ClientHeaderProps {
  onAdminClick: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({ onAdminClick }) => {
  return (
    <header className="border-b border-slate-800/90 bg-[#0c121e]/95 backdrop-blur-md sticky top-0 z-30 shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main Requested Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/10 shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                REQUISIÇÃO DE MATERIAL
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Solicitação de Uniformes — Camisetas Azuis e Brancas
              </p>
            </div>
          </div>

          {/* Right Action: Clean Badge & ADMIN Link */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Formulário Oficial de Pedidos
            </span>

            <button
              type="button"
              id="btn-header-admin-link"
              onClick={onAdminClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161f30] hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold shadow-sm transition-all group"
              title="Acessar painel de administração"
            >
              <span className="w-2 h-2 rounded-full bg-slate-500 group-hover:bg-indigo-400 transition-colors"></span>
              <span>ADMIN</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
