'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  Building2,
  Calendar,
  Award,
  Receipt,
  FileText,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Gift,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Customer, Ticket, CustomerLoyaltyData } from '@/types/api';

interface CustomerDetailDrawerProps {
  customer: Customer | null;
  branchName?: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (c: Customer) => void;
  onRedeem: (c: Customer) => void;
}

export function CustomerDetailDrawer({
  customer,
  branchName,
  isOpen,
  onClose,
  onEdit,
  onRedeem,
}: CustomerDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'loyalty'>('history');
  const [loadedCustomerId, setLoadedCustomerId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loyaltyData, setLoyaltyData] = useState<CustomerLoyaltyData | null>(null);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  const [errorLoyalty, setErrorLoyalty] = useState<string | null>(null);

  const isLoading = Boolean(isOpen && customer && loadedCustomerId !== customer.id);

  useEffect(() => {
    if (!isOpen || !customer) return;

    let ignore = false;

    Promise.allSettled([
      api.customers.getHistory(customer.id),
      api.customers.getLoyalty(customer.id),
    ]).then(([historyRes, loyaltyRes]) => {
      if (ignore) return;
      if (historyRes.status === 'fulfilled') {
        setTickets(historyRes.value);
        setErrorHistory(null);
      } else {
        setErrorHistory(
          historyRes.reason instanceof Error
            ? historyRes.reason.message
            : 'Error al cargar tickets',
        );
      }

      if (loyaltyRes.status === 'fulfilled') {
        setLoyaltyData(loyaltyRes.value);
        setErrorLoyalty(null);
      } else {
        setErrorLoyalty(
          loyaltyRes.reason instanceof Error
            ? loyaltyRes.reason.message
            : 'Error al cargar puntos',
        );
      }

      setLoadedCustomerId(customer.id);
    });

    return () => {
      ignore = true;
    };
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const currentPoints = loyaltyData ? loyaltyData.balance : customer.loyaltyPoints;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-lg">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {customer.name}
                  </h2>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      customer.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {customer.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                  {branchName ? (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                      {branchName}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                      Todas las Sedes
                    </span>
                  )}
                  <span className="text-zinc-600">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Cliente desde {new Date(customer.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEdit(customer)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                title="Editar cliente"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                title="Cerrar panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Contact Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
              <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">
                {customer.phone || <span className="text-zinc-500">Sin teléfono registrado</span>}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
              <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">
                {customer.email || <span className="text-zinc-500">Sin correo registrado</span>}
              </span>
            </div>
          </div>

          {/* Loyalty Banner Card */}
          <div className="mt-4 p-4 rounded-xl bg-linear-to-r from-amber-500/20 via-zinc-900 to-zinc-900 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-amber-300/80 font-medium block">
                  Puntos de Fidelización Acumulados
                </span>
                <span className="text-2xl font-black text-amber-400 tracking-tight">
                  {currentPoints.toLocaleString()}{' '}
                  <span className="text-xs font-semibold text-amber-300/90">pts</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => onRedeem(customer)}
              disabled={currentPoints <= 0}
              className="px-3.5 py-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-amber-500/20 cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Canjear Puntos</span>
            </button>
          </div>

          {/* Customer Preferences / Notes */}
          {customer.notes && (
            <div className="mt-3 p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Notas y Preferencias de Servicio:</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">
                &ldquo;{customer.notes}&rdquo;
              </p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-5 border-b border-zinc-800 -mb-6">
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'history'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Historial de Visitas ({tickets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'loyalty'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Libro Mayor de Puntos ({loyaltyData?.ledger.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'history' && (
            <div>
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
                  <span className="text-xs">Cargando historial de tickets...</span>
                </div>
              ) : errorHistory ? (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorHistory}</span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 bg-zinc-950/50 rounded-2xl border border-zinc-800/80 p-6">
                  <Receipt className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm font-semibold text-zinc-300">
                    Sin visitas registradas
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Este cliente aún no registra tickets cobrados o en atención.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {t.code}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              t.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : t.status === 'PARTIALLY_PAID'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : t.status === 'VOIDED'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {t.status === 'PAID'
                              ? 'Pagado'
                              : t.status === 'PARTIALLY_PAID'
                                ? 'Abonado'
                                : t.status === 'VOIDED'
                                  ? 'Anulado'
                                  : 'Abierto'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">
                          ${Number(t.total).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(t.createdAt)}</span>
                        {t.paidAt && (
                          <>
                            <span className="text-zinc-700">·</span>
                            <span className="text-zinc-400">
                              Cobrado el {formatDate(t.paidAt)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Items */}
                      {t.items && t.items.length > 0 && (
                        <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                          {t.items.map((item) => {
                            const itemName =
                              item.description ||
                              item.service?.name ||
                              item.product?.name ||
                              'Servicio / Producto';
                            const price = Number(
                              item.lineTotal ?? Number(item.unitPrice) * item.quantity,
                            );

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs text-zinc-300"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500 font-mono">
                                    {item.quantity}x
                                  </span>
                                  <span>{itemName}</span>
                                </div>
                                <span className="text-zinc-400 font-medium">
                                  ${price.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div>
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
                  <span className="text-xs">Cargando libro mayor de fidelidad...</span>
                </div>
              ) : errorLoyalty ? (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorLoyalty}</span>
                </div>
              ) : !loyaltyData || loyaltyData.ledger.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 bg-zinc-950/50 rounded-2xl border border-zinc-800/80 p-6">
                  <Award className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm font-semibold text-zinc-300">
                    Sin movimientos de puntos
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Las transacciones se generan automáticamente al cobrar tickets en Caja POS o al realizar canjes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Reverse order so newest transactions are first */}
                  {[...loyaltyData.ledger].reverse().map((entry) => {
                    const isPositive = entry.points > 0;
                    return (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">
                              {entry.reason}
                            </p>
                            <span className="text-[11px] text-zinc-500">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-sm font-black font-mono block ${
                              isPositive ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {isPositive ? `+${entry.points}` : entry.points} pts
                          </span>
                          {entry.runningBalance !== undefined && (
                            <span className="text-[10px] text-zinc-500 font-medium">
                              Saldo: {entry.runningBalance} pts
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
