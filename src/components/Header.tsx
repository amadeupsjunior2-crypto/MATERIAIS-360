import React from 'react';
import { Package, Database, Settings, PlusCircle, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'form' | 'database';
  setActiveTab: (tab: 'form' | 'database') => void;
  ordersCount: number;
  recipientEmail: string;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  ordersCount,
  recipientEmail,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0f1522]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Registro de Pedidos de Camisetas
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Azuis (Serviços Gerais) & Brancas (Perecíveis) • Geração de PDF & Banco de Dados
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className="flex bg-[#161f30] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                id="btn-tab-form"
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'form'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Novo Pedido</span>
              </button>

              <button
                type="button"
                id="btn-tab-database"
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
            </nav>

            {/* Settings Trigger */}
            <button
              type="button"
              id="btn-open-settings"
              onClick={onOpenSettings}
              title={`E-mail de destino: ${recipientEmail}`}
              className="p-2.5 rounded-xl bg-[#161f30] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors relative group"
            >
              <Settings className="w-4 h-4" />
              <span className="sr-only">Configurações de E-mail</span>
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#161f30]"></div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
