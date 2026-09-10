'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Ticket, TicketDetail, PaymentMethod } from '@/types/api';

interface CheckoutModalProps {
  ticket: Ticket | null;
  hasActiveRegister: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTicket: TicketDetail) => void;
}

export function CheckoutModal({
  ticket,
  hasActiveRegister,
  isOpen,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !ticket?.id) {
      return;
    }
    let ignore = false;
    Promise.all([
      api.tickets.getById(ticket.id),
      api.paymentMethods.list(true),
    ])
      .then(([ticketData, methodsData]) => {
        if (!ignore) {
          setDetail(ticketData);
          setMethods(methodsData);
          if (methodsData.length > 0) {
            setSelectedMethodId(methodsData[0].id);
          }
          setTenderedAmount(String(ticketData.amountDue));
          setCashGiven('');
          setTipAmount('0');
          setError(null);
          setCompleted(false);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : 'Error al cargar datos del ticket.',
          );
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, ticket?.id]);

  if (!isOpen || !ticket) return null;

  const selectedMethod = methods.find((m) => m.id === selectedMethodId);
  const isCash = selectedMethod?.code?.toUpperCase() === 'CASH' ||
    selectedMethod?.name?.toLowerCase().includes('efectivo');

  const parsedTendered = parseFloat(tenderedAmount) || 0;
  const parsedCashGiven = parseFloat(cashGiven) || 0;
  const changeDue = isCash && parsedCashGiven > parsedTendered
    ? parsedCashGiven - parsedTendered
    : 0;

  const handleQuickAmount = (val: number) => {
    setTenderedAmount(String(val));
    if (isCash && parsedCashGiven < val) {
      setCashGiven(String(val));
    }
  };

  const handleSetExact = () => {
    if (detail) {
      setTenderedAmount(String(detail.amountDue));
      if (isCash) {
        setCashGiven(String(detail.amountDue));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasActiveRegister) {
      setError('No hay una caja abierta en esta sucursal.');
      return;
    }

    if (!selectedMethodId) {
      setError('Selecciona un método de pago.');
      return;
    }

    if (parsedTendered <= 0) {
      setError('El monto a pagar debe ser mayor a 0.');
      return;
    }

    if (detail && parsedTendered > detail.amountDue) {
      setError(`El monto a cobrar (S/ ${parsedTendered.toFixed(2)}) no puede exceder el saldo pendiente (S/ ${detail.amountDue.toFixed(2)}).`);
      return;
    }

    const parsedTip = parseFloat(tipAmount) || 0;

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await api.tickets.addPayment(ticket.id, {
        paymentMethodId: selectedMethodId,
        amount: parsedTendered,
        tipAmount: parsedTip > 0 ? parsedTip : undefined,
      });

      setDetail(updated);

      if (updated.status === 'PAID') {
        setCompleted(true);
        onSuccess(updated);
      } else {
        // Partially paid: prepare next payment in split flow
        setTenderedAmount(String(updated.amountDue));
        setCashGiven('');
        setTipAmount('0');
        onSuccess(updated);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al procesar el pago.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (code?: string, name?: string) => {
    const c = (code || '').toUpperCase();
    const n = (name || '').toLowerCase();
    if (c === 'CASH' || n.includes('efectivo')) {
      return <Banknote className="w-4 h-4" />;
    }
    if (c === 'CARD' || n.includes('tarjeta')) {
      return <CreditCard className="w-4 h-4" />;
    }
    if (c.includes('YAPE') || c.includes('PLIN') || n.includes('yape') || n.includes('plin')) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <DollarSign className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Punto de Cobro (POS)</h2>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700 font-semibold">
                  {ticket.code}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {ticket.status === 'PARTIALLY_PAID'
                  ? 'Ticket con pago parcial pendiente'
                  : 'Procesamiento y liquidación de ticket'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Screen State */}
        {completed ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">¡Ticket Pagado con Éxito!</h3>
              <p className="text-sm text-zinc-400 mt-1">
                El comprobante <span className="font-mono text-zinc-200">{ticket.code}</span> ha sido completamente liquidado.
              </p>
            </div>

            {changeDue > 0 && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center">
                <span className="text-xs text-emerald-300 uppercase tracking-wider font-semibold block">
                  Vuelto a Entregar
                </span>
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  S/ {changeDue.toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-5 pr-1 flex-1">
            {/* Cash register warning */}
            {!hasActiveRegister && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Atención:</strong> La caja está cerrada. Debes abrir la caja antes de registrar cualquier pago.
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                Cargando desglose del ticket...
              </div>
            ) : detail ? (
              <>
                {/* Items breakdown table */}
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
                  <div className="px-3 py-2 bg-zinc-800/60 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                    Detalle de Consumos
                  </div>
                  <div className="divide-y divide-zinc-800/60 text-xs">
                    {detail.items?.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-zinc-200">
                            {item.description || 'Ítem'}
                          </div>
                          <div className="text-zinc-500">
                            {item.quantity} x S/ {Number(item.unitPrice).toFixed(2)}
                            {Number(item.discountAmount) > 0 && (
                              <span className="text-red-400 ml-1">
                                (- S/ {Number(item.discountAmount).toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-zinc-100">
                          S/ {Number(item.lineTotal).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-zinc-200">S/ {Number(detail.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(detail.discountAmount) > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Descuento:</span>
                      <span className="font-mono">- S/ {Number(detail.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-400">
                    <span>IGV (18%):</span>
                    <span className="font-mono text-zinc-200">S/ {Number(detail.taxAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-zinc-700/60">
                    <span>Total Ticket:</span>
                    <span className="font-mono text-amber-400">S/ {Number(detail.total).toFixed(2)}</span>
                  </div>
                  {detail.amountPaid > 0 && (
                    <div className="flex justify-between text-emerald-400 pt-1 font-medium">
                      <span>Total Abonado / Pagado:</span>
                      <span className="font-mono">S/ {detail.amountPaid.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm text-amber-300 pt-1 border-t border-zinc-700/80">
                    <span>Saldo Restante por Cobrar:</span>
                    <span className="font-mono text-lg">S/ {detail.amountDue.toFixed(2)}</span>
                  </div>
                </div>

                {/* Previous Payments History (for split payment clarity) */}
                {detail.payments && detail.payments.length > 0 && (
                  <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                      Abonos Anteriores Registrados
                    </span>
                    <div className="space-y-1.5">
                      {detail.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
                        >
                          <div className="flex items-center gap-2">
                            {getMethodIcon(p.methodCode, p.methodName)}
                            <span>{p.methodName}</span>
                          </div>
                          <span className="font-mono font-semibold text-emerald-400">
                            + S/ {Number(p.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-zinc-800">
                  {/* Payment Methods Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                      Método de Pago
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {methods.map((method) => {
                        const isSelected = selectedMethodId === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => {
                              setSelectedMethodId(method.id);
                              if (isCash && !cashGiven) {
                                setCashGiven(tenderedAmount);
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-2 transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                                : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <span className={isSelected ? 'text-amber-400' : 'text-zinc-400'}>
                              {getMethodIcon(method.code, method.name)}
                            </span>
                            <span>{method.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amount to Pay & Quick Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Monto a Cobrar (S/)
                        </label>
                        <button
                          type="button"
                          onClick={handleSetExact}
                          className="text-xs text-amber-400 hover:underline"
                        >
                          Cobrar Total (S/ {detail.amountDue.toFixed(2)})
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-medium">
                          S/
                        </span>
                        <input
                          type="number"
                          step="0.10"
                          min="0.10"
                          max={detail.amountDue}
                          required
                          value={tenderedAmount}
                          onChange={(e) => setTenderedAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500 transition"
                        />
                      </div>

                      {/* Quick Shortcut Buttons */}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {[10, 20, 50, 100].map((chipVal) => (
                          <button
                            key={chipVal}
                            type="button"
                            onClick={() => handleQuickAmount(Math.min(chipVal, detail.amountDue))}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-medium border border-zinc-700 transition"
                          >
                            S/ {chipVal}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tip (Propina) */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                        Propina Voluntaria (S/)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-medium">
                          S/
                        </span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={tipAmount}
                          onChange={(e) => setTipAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-lg font-semibold focus:outline-none focus:border-amber-500 transition"
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Se asigna 100% al barbero sin deducciones.
                      </p>
                    </div>
                  </div>

                  {/* Cash Change (Vuelto) Calculator */}
                  {isCash && (
                    <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                          Efectivo Recibido del Cliente (S/)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">
                            S/
                          </span>
                          <input
                            type="number"
                            step="0.50"
                            min="0"
                            value={cashGiven}
                            onChange={(e) => setCashGiven(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono text-base font-semibold focus:outline-none focus:border-amber-500 transition"
                          />
                        </div>
                      </div>

                      <div className="text-center sm:text-right">
                        <span className="text-xs uppercase tracking-wider text-zinc-400 block">
                          Vuelto a Devolver:
                        </span>
                        <span
                          className={`font-mono text-2xl font-bold ${
                            changeDue > 0 ? 'text-emerald-400' : 'text-zinc-500'
                          }`}
                        >
                          S/ {changeDue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !hasActiveRegister || parsedTendered <= 0}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      {isSubmitting ? 'Procesando...' : `Registrar Pago (S/ ${parsedTendered.toFixed(2)})`}
                    </button>
                  </div>
                </form>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
