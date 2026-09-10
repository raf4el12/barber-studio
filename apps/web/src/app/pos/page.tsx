'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { usePosRealtime } from '@/lib/realtime/use-pos-realtime';
import { api } from '@/lib/api/client';
import type { Ticket, CashRegister } from '@/types/api';
import { CashRegisterBanner } from '@/features/pos/cash-register-banner';
import { OpenRegisterModal } from '@/features/pos/open-register-modal';
import { CloseRegisterModal } from '@/features/pos/close-register-modal';
import { ApplyDiscountModal } from '@/features/pos/apply-discount-modal';
import { CheckoutModal } from '@/features/pos/checkout-modal';
import { PendingTicketsQueue } from '@/features/pos/pending-tickets-queue';
import {
  DollarSign,
  Radio,
  LogOut,
  Scissors,
  Loader2,
  Building2,
  Receipt,
  AlertOctagon,
} from 'lucide-react';

export default function PosStationPage() {
  const router = useRouter();
  const { user, token, branchId, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const {
    tickets,
    activeRegister,
    isConnected,
    isLoading: posLoading,
    refreshTickets,
    refreshRegister,
    setActiveRegister,
  } = usePosRealtime(branchId, token);

  const [isOpenRegisterOpen, setIsOpenRegisterOpen] = useState(false);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false);
  const [checkoutTicket, setCheckoutTicket] = useState<Ticket | null>(null);
  const [discountTicket, setDiscountTicket] = useState<Ticket | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  // Access control: only OWNER and CASHIER
  if (user && user.role !== 'OWNER' && user.role !== 'CASHIER') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Acceso Restringido</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          Tu cuenta tiene el rol de <strong>Barbero</strong>. El Punto de Venta (POS) y Arqueo de Caja están reservados para Cajeros y Administradores.
        </p>
        <Link
          href="/barber/queue"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition"
        >
          Volver a Mi Cola de Atención
        </Link>
      </div>
    );
  }

  const hasActiveRegister = !!activeRegister && !activeRegister.closedAt;
  const pendingTotal = tickets.reduce((sum, t) => sum + Number(t.total), 0);

  const handleCheckoutSuccess = async () => {
    await refreshTickets();
    setFeedbackMessage('Pago registrado exitosamente.');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDiscountSuccess = async () => {
    await refreshTickets();
    setFeedbackMessage('Descuento aplicado correctamente.');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleOpenRegisterSuccess = (created: CashRegister) => {
    setActiveRegister(created);
    void refreshRegister();
    setFeedbackMessage('Caja abierta correctamente.');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleCloseRegisterSuccess = (closed: CashRegister) => {
    setActiveRegister(closed);
    void refreshRegister();
    setFeedbackMessage('Caja cerrada y arqueo registrado.');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleVoidTicket = async (ticket: Ticket) => {
    const ok = window.confirm(
      `¿Estás seguro de anular el ticket ${ticket.code}? Esta acción es irreversible y quedará registrada en auditoría.`,
    );
    if (!ok) return;

    try {
      await api.tickets.void(ticket.id);
      await refreshTickets();
      setFeedbackMessage(`Ticket ${ticket.code} anulado.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al anular ticket.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-lg px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight leading-none">
                  Barber Studio
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-semibold border border-zinc-700/80">
                  POS
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                <Building2 className="h-3 w-3 text-zinc-500" />
                <span>{user?.name}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400 font-medium">
                  {user?.role === 'OWNER' ? 'Administrador' : 'Cajero'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime WS Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              <Radio
                className={`h-3.5 w-3.5 ${
                  isConnected ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'
                }`}
              />
              <span className="hidden sm:inline">
                {isConnected ? 'POS Conectado' : 'Conectando'}
              </span>
            </div>

            {/* Link to Barber Portal (for Owner/Admin) */}
            {user?.role === 'OWNER' && (
              <Link
                href="/barber/queue"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
              >
                <Scissors className="h-3.5 w-3.5 text-amber-400" />
                <span>Portal Barberos</span>
              </Link>
            )}

            {/* Logout button */}
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div className="max-w-md mx-auto fixed bottom-5 right-5 z-50 p-4 bg-emerald-900/90 border border-emerald-500 text-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-5">
          <p className="text-sm font-semibold">{feedbackMessage}</p>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Cash Register Session Banner */}
        <CashRegisterBanner
          register={activeRegister}
          onOpenClick={() => setIsOpenRegisterOpen(true)}
          onCloseClick={() => setIsCloseRegisterOpen(true)}
        />

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Tickets en Cola
              </span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {tickets.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total por Recaudar
              </span>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
                S/ {pendingTotal.toFixed(2)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Estado del Cajón
              </span>
              <p className={`text-base font-bold mt-1 ${hasActiveRegister ? 'text-emerald-400' : 'text-amber-400'}`}>
                {hasActiveRegister ? 'Caja Operativa' : 'Sin Sesión'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
              hasActiveRegister
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Cola de Tickets para Cobro
              </h2>
              <p className="text-xs text-zinc-500">
                Tickets emitidos por los barberos al culminar los servicios
              </p>
            </div>
            {posLoading && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Actualizando...</span>
              </div>
            )}
          </div>

          <PendingTicketsQueue
            tickets={tickets}
            userRole={user.role}
            hasActiveRegister={hasActiveRegister}
            onCheckout={(t) => setCheckoutTicket(t)}
            onDiscount={(t) => setDiscountTicket(t)}
            onVoid={handleVoidTicket}
          />
        </div>
      </main>

      {/* Modals */}
      {branchId && (
        <OpenRegisterModal
          branchId={branchId}
          isOpen={isOpenRegisterOpen}
          onClose={() => setIsOpenRegisterOpen(false)}
          onSuccess={handleOpenRegisterSuccess}
        />
      )}

      {activeRegister && (
        <CloseRegisterModal
          register={activeRegister}
          isOpen={isCloseRegisterOpen}
          onClose={() => setIsCloseRegisterOpen(false)}
          onSuccess={handleCloseRegisterSuccess}
        />
      )}

      <CheckoutModal
        ticket={checkoutTicket}
        hasActiveRegister={hasActiveRegister}
        isOpen={!!checkoutTicket}
        onClose={() => setCheckoutTicket(null)}
        onSuccess={handleCheckoutSuccess}
      />

      {discountTicket && (
        <ApplyDiscountModal
          ticket={discountTicket}
          isOpen={!!discountTicket}
          onClose={() => setDiscountTicket(null)}
          onSuccess={handleDiscountSuccess}
        />
      )}
    </div>
  );
}
