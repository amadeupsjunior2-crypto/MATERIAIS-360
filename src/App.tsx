import React, { useState, useEffect, useCallback } from 'react';
import { ClientHeader } from './components/ClientHeader';
import { AdminHeader } from './components/AdminHeader';
import { OrderForm } from './components/OrderForm';
import { OrdersDatabase } from './components/OrdersDatabase';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Order, OrderStatus } from './types';
import { getOrderPdfBase64 } from './utils/pdfGenerator';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export default function App() {
  // Mode state: 'client' (Public Client Front) vs 'admin' (Management Front)
  const [viewMode, setViewMode] = useState<'client' | 'admin'>('client');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Admin Tab: 'database' | 'form'
  const [activeTab, setActiveTab] = useState<'form' | 'database'>('database');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check URL query parameters and stored auth session on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const storedAuth = sessionStorage.getItem('requisicao_auth_mode');

    if (modeParam === 'admin' || storedAuth === 'admin') {
      setViewMode('admin');
      setIsAdminAuthenticated(true);
    } else {
      setViewMode('client');
    }
  }, []);

  // Fetch orders from database
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle new order submission
  const handleSubmitOrder = async (formData: Partial<Order>) => {
    setIsSubmitting(true);
    try {
      // 1. Generate base64 PDF of the order
      const pdfBase64 = getOrderPdfBase64(formData);

      // 2. Send to backend to persist in database
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pdfBase64,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao registrar pedido');
      }

      // 3. Add to local state & display feedback toast
      setOrders((prev) => [data.order, ...prev]);
      showToast(
        viewMode === 'admin'
          ? 'Pedido registrado no banco de dados com sucesso!'
          : 'Requisição gerada e e-mail aberto no seu aplicativo de mensagens!',
        'success'
      );
    } catch (err: any) {
      console.error('Submit order error:', err);
      showToast(err.message || 'Erro ao processar pedido', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete order from database (Confirmation modal is handled in UI)
  const handleDeleteOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        showToast('Pedido removido com sucesso do banco de dados');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir pedido', 'error');
    }
  };

  // Handle update order status
  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        if (selectedOrderDetails && selectedOrderDetails.id === id) {
          setSelectedOrderDetails((prev) => (prev ? { ...prev, status } : null));
        }
        showToast(`Status atualizado para: ${status.replace('_', ' ').toUpperCase()}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar status', 'error');
    }
  };

  // Handle resend email
  const handleResendEmail = async (order: Order) => {
    try {
      const pdfBase64 = getOrderPdfBase64(order);
      const targetEmail = order.supervisorEmail || order.emailSentTo || '';
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          email: targetEmail,
          pdfBase64,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `E-mail reenviado para ${targetEmail}`);
        fetchOrders();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao reenviar e-mail', 'error');
    }
  };

  // Admin login success
  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setViewMode('admin');
    setIsLoginModalOpen(false);
    sessionStorage.setItem('requisicao_auth_mode', 'admin');
    showToast('Acesso administrativo desbloqueado com sucesso!');
  };

  // Admin logout
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setViewMode('client');
    sessionStorage.removeItem('requisicao_auth_mode');
    showToast('Você saiu do painel administrativo.');
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Dynamic Header depending on View Mode */}
      {viewMode === 'client' ? (
        <ClientHeader onAdminClick={() => setIsLoginModalOpen(true)} />
      ) : (
        <AdminHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          ordersCount={orders.length}
          onSwitchToClient={() => setViewMode('client')}
          onLogout={handleAdminLogout}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {viewMode === 'client' ? (
          /* Client Front: Pure Clean Order Form with NO navigation tabs */
          <OrderForm
            onSubmitOrder={handleSubmitOrder}
            isSubmitting={isSubmitting}
            isAdmin={false}
          />
        ) : (
          /* Admin Front: Management Dashboard with Database & Manual Entry Tabs */
          <div className="space-y-6">
            {activeTab === 'database' ? (
              <OrdersDatabase
                orders={orders}
                isLoading={isLoading}
                onRefresh={fetchOrders}
                onDeleteOrder={handleDeleteOrder}
                onUpdateStatus={handleUpdateStatus}
                onResendEmail={handleResendEmail}
                onViewOrderDetails={(order) => setSelectedOrderDetails(order)}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-[#131924] border border-[#232c3d] rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">Registro Manual de Pedido</h2>
                    <p className="text-xs text-slate-400">
                      Cadastre um novo pedido diretamente pelo painel administrativo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('database')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    ← Voltar ao Banco de Dados
                  </button>
                </div>

                <OrderForm
                  onSubmitOrder={async (data) => {
                    await handleSubmitOrder(data);
                    setActiveTab('database');
                  }}
                  isSubmitting={isSubmitting}
                  isAdmin={true}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-[#1a2333] bg-[#0c101a] py-6 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Sistema de Requisição de Uniformes
            </span>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'client' && (
              <button
                type="button"
                id="btn-footer-admin-login"
                onClick={() => {
                  if (isAdminAuthenticated) {
                    setViewMode('admin');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="text-slate-500 hover:text-slate-300 text-[11px] flex items-center gap-1 transition-colors group"
                title="Acesso exclusivo do gestor"
              >
                <Lock className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                <span>Acesso Administrativo</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold text-white transition-all animate-in slide-in-from-bottom-5 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrderDetails}
        isOpen={Boolean(selectedOrderDetails)}
        onClose={() => setSelectedOrderDetails(null)}
        onResendEmail={handleResendEmail}
        onDeleteOrder={handleDeleteOrder}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        adminPassword="27751973"
      />
    </div>
  );
}
