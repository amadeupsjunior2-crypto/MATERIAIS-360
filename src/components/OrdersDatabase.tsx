import React, { useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle,
  Truck,
  Package,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { downloadOrderPdf } from '../utils/pdfGenerator';

interface OrdersDatabaseProps {
  orders: Order[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteOrder?: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
  onResendEmail?: (order: Order) => Promise<void>;
  onViewOrderDetails: (order: Order) => void;
}

export const OrdersDatabase: React.FC<OrdersDatabaseProps> = ({
  orders,
  isLoading,
  onRefresh,
  onUpdateStatus,
  onViewOrderDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term && statusFilter === 'todos') return true;

    const matchesSearch =
      !term ||
      order.storeNumber?.toLowerCase().includes(term) ||
      order.storeName?.toLowerCase().includes(term) ||
      order.responsibleName?.toLowerCase().includes(term) ||
      order.responsibleCpf?.includes(term) ||
      order.orderNumber?.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'todos' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalOrders = orders.length;
  const totalShirts = orders.reduce((sum, o) => sum + (o.totalShirts || 0), 0);
  const totalBlue = orders.reduce((sum, o) => sum + (o.blueTotal || 0), 0);
  const totalWhite = orders.reduce((sum, o) => sum + (o.whiteTotal || 0), 0);

  const handleExportCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      'Protocolo',
      'Data/Hora',
      'Numero Loja',
      'Nome Loja',
      'Responsavel',
      'CPF',
      'WhatsApp',
      'Azul P',
      'Azul M',
      'Azul G',
      'Azul GG',
      'Total Azul',
      'Branca P',
      'Branca M',
      'Branca G',
      'Branca GG',
      'Total Branca',
      'Total Geral',
      'Status',
      'Email Destino',
      'Status Email',
      'Observacoes',
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('pt-BR'),
      `"${(o.storeNumber || '').replace(/"/g, '""')}"`,
      `"${(o.storeName || '').replace(/"/g, '""')}"`,
      `"${(o.responsibleName || '').replace(/"/g, '""')}"`,
      `"${(o.responsibleCpf || '').replace(/"/g, '""')}"`,
      `"${(o.responsibleWhatsapp || '').replace(/"/g, '""')}"`,
      o.blueShirts?.P || 0,
      o.blueShirts?.M || 0,
      o.blueShirts?.G || 0,
      o.blueShirts?.GG || 0,
      o.blueTotal || 0,
      o.whiteShirts?.P || 0,
      o.whiteShirts?.M || 0,
      o.whiteShirts?.G || 0,
      o.whiteShirts?.GG || 0,
      o.whiteTotal || 0,
      o.totalShirts || 0,
      o.status,
      `"${(o.emailSentTo || '').replace(/"/g, '""')}"`,
      o.emailStatus || '',
      `"${(o.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_pedidos_camisetas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-4 sm:p-5 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total de Pedidos</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{totalOrders}</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Package className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-4 sm:p-5 shadow-lg">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total de Camisetas</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono">{totalShirts}</span>
            <span className="text-xs font-medium text-slate-400">unidades</span>
          </div>
        </div>

        <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-4 sm:p-5 shadow-lg">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Camisetas Azuis
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">{totalBlue}</span>
            <span className="text-xs font-medium text-slate-400">
              {totalShirts > 0 ? `${Math.round((totalBlue / totalShirts) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-4 sm:p-5 shadow-lg">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300"></span> Camisetas Brancas
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-200 font-mono">{totalWhite}</span>
            <span className="text-xs font-medium text-slate-400">
              {totalShirts > 0 ? `${Math.round((totalWhite / totalShirts) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="input-search-database"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Loja, Responsável, CPF ou Protocolo..."
            className="w-full bg-[#0d121c] border border-[#263245] rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-[#0d121c] border border-[#263245] rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-[#0d121c]">Todos os Status</option>
              <option value="novo" className="bg-[#0d121c]">Novo</option>
              <option value="em_separacao" className="bg-[#0d121c]">Em Separação</option>
              <option value="enviado" className="bg-[#0d121c]">Enviado</option>
              <option value="entregue" className="bg-[#0d121c]">Entregue</option>
            </select>
          </div>

          <button
            type="button"
            id="btn-export-csv"
            onClick={handleExportCSV}
            title="Exportar dados para planilha CSV"
            className="px-3 py-2 bg-[#172030] hover:bg-[#1f2b40] text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            id="btn-refresh-database"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 bg-[#172030] hover:bg-[#1f2b40] text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs transition-colors"
            title="Atualizar lista de pedidos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-[#131924] border border-[#232c3d] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0d121c] border-b border-[#232c3d] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Protocolo / Data</th>
                <th className="py-3.5 px-4">Loja</th>
                <th className="py-3.5 px-4">Responsável</th>
                <th className="py-3.5 px-4 text-center">Azuis</th>
                <th className="py-3.5 px-4 text-center">Brancas</th>
                <th className="py-3.5 px-4 text-center">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2738] text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Nenhum pedido encontrado com os filtros atuais.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {searchTerm || statusFilter !== 'todos'
                        ? 'Tente alterar os termos de busca ou selecionar "Todos os Status".'
                        : 'Preencha o formulário de requisição para registrar o primeiro pedido.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#161f30] transition-colors group">
                    {/* Protocolo & Data */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-mono font-bold text-white text-xs sm:text-sm">{order.orderNumber}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Loja */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">Nº {order.storeNumber}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[150px]">{order.storeName}</div>
                    </td>

                    {/* Responsável */}
                    <td className="py-4 px-4">
                      <div className="text-slate-200 font-medium truncate max-w-[140px]">{order.responsibleName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{order.responsibleWhatsapp}</div>
                    </td>

                    {/* Azuis */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {order.blueTotal}
                      </span>
                    </td>

                    {/* Brancas */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-bold text-slate-300 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">
                        {order.whiteTotal}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-extrabold text-white text-sm">
                        {order.totalShirts}
                      </span>
                    </td>

                    {/* Status with switcher */}
                    <td className="py-4 px-4">
                      <select
                        id={`select-status-${order.id}`}
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className="bg-[#0d121c] border border-[#2a3548] text-xs font-semibold rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="novo">Novo</option>
                        <option value="em_separacao">Em Separação</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregue">Entregue</option>
                      </select>
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          id={`btn-view-${order.id}`}
                          onClick={() => onViewOrderDetails(order)}
                          title="Visualizar detalhes do pedido"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4 text-sky-400" />
                        </button>

                        <button
                          type="button"
                          id={`btn-download-pdf-${order.id}`}
                          onClick={() => downloadOrderPdf(order)}
                          title="Baixar arquivo PDF"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
