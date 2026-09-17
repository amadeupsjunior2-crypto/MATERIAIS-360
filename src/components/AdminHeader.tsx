import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  PlusCircle,
  Eye,
  LogOut,
  Copy,
  Check,
} from 'lucide-react';

interface AdminHeaderProps {
  activeTab: 'form' | 'database';
  setActiveTab: (tab: 'form' | 'database') => void;
  ordersCount: number;
  onSwitchToClient: () => void;
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  ordersCount,
  onSwitchToClient,
  onLogout,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyClientLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'cliente');
    url.searchParams.delete('admin');
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="sticky top-0 z-30">
      {/* Top Admin Notice Bar */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 border-b border-indigo-800/40 px-4 py-2 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-white">Painel do Administrador</span>
            <span className="text-slate-400">• Somente você tem acesso</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-copy-client-link"
              onClick={handleCopyClientLink}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-medium transition-colors"
              title="Copiar link para enviar aos clientes"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Link do Cliente Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Link p/ Clientes</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-view-client-front"
              onClick={onSwitchToClient}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded-lg text-[11px] font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Frente do Cliente</span>
            </button>

            <button
              type="button"
              id="btn-admin-logout"
              onClick={onLogout}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 text-[11px] transition-colors"
              title="Sair do painel de administração"
            >
              <LogOut className="w-3 h-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0f1522]/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Title */}
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Gestão de Pedidos & Banco de Dados
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Admin
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Visualização consolidada de todas as requisições
                </p>
              </div>
            </div>

            {/* Admin Tabs */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <nav className="flex bg-[#161f30] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  id="btn-admin-tab-database"
                  onClick={() => setActiveTab('database')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                    activeTab === 'database'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Banco de Dados</span>
                  {ordersCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                      activeTab === 'database' ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {ordersCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-admin-tab-form"
                  onClick={() => setActiveTab('form')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    activeTab === 'form'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Registrar Pedido Manual</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
