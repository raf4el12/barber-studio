'use client';

import React, { useState } from 'react';
import { X, Award, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Customer } from '@/types/api';

interface RedeemLoyaltyModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPoints: number) => void;
}

const COMMON_REASONS = [
  'Canje por corte de cabello de cortesía',
  'Descuento especial por puntos acumulados',
  'Canje por producto de barbería / pomada',
  'Beneficio membresía de cliente frecuente',
];

export function RedeemLoyaltyModal({
  customer,
  isOpen,
  onClose,
  onSuccess,
}: RedeemLoyaltyModalProps) {
  const [points, setPoints] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !customer) return null;

  const currentBalance = customer.loyaltyPoints;

  const handleQuickPoints = (qty: number) => {
    const capped = Math.min(qty, currentBalance);
    setPoints(capped);
  };

  const handleRedeemAll = () => {
    setPoints(currentBalance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ptsNum = Number(points);

    if (!Number.isInteger(ptsNum) || ptsNum <= 0) {
      setError('Ingresa una cantidad de puntos válida (entero mayor a 0).');
      return;
    }

    if (ptsNum > currentBalance) {
      setError(`Saldo insuficiente. El cliente solo dispone de ${currentBalance} puntos.`);
      return;
    }

    if (!reason.trim()) {
      setError('Ingresa el motivo o concepto del canje.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.customers.redeemLoyalty(customer.id, {
        points: ptsNum,
        reason: reason.trim(),
      });
      const newBalance = currentBalance - ptsNum;
      onSuccess(newBalance);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el canje de puntos';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Canjear Puntos de Fidelidad
              </h2>
              <p className="text-xs text-zinc-400">
                Cliente: <span className="text-amber-400 font-medium">{customer.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Balance Display Card */}
          <div className="p-4 rounded-xl bg-linear-to-br from-amber-500/15 via-zinc-900 to-zinc-950 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-300 font-medium block">
                Saldo Disponible
              </span>
              <span className="text-2xl font-black text-amber-400">
                {currentBalance.toLocaleString()}{' '}
                <span className="text-xs text-amber-300/80 font-semibold">pts</span>
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          {currentBalance <= 0 ? (
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-center py-6">
              <p className="text-sm font-semibold text-zinc-300">
                Sin puntos para canjear
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Este cliente no cuenta con saldo acumulado disponible en su libro mayor.
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Puntos a Canjear <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRedeemAll}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                  >
                    Canjear todo ({currentBalance} pts)
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  max={currentBalance}
                  required
                  value={points}
                  onChange={(e) =>
                    setPoints(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  placeholder="Ej. 100"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[25, 50, 100, 200]
                    .filter((qty) => qty <= currentBalance)
                    .map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => handleQuickPoints(qty)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          points === qty
                            ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {qty} pts
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Motivo / Concepto del Canje <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Descuento por fidelidad en corte clásico"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition mb-2"
                />

                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-500 font-medium block">
                    Sugerencias frecuentes:
                  </span>
                  <div className="flex flex-col gap-1">
                    {COMMON_REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReason(r)}
                        className="text-left text-xs text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60 px-2 py-1 rounded-lg transition cursor-pointer truncate"
                      >
                        • {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition cursor-pointer"
            >
              Cerrar
            </button>
            {currentBalance > 0 && (
              <button
                type="submit"
                disabled={isSubmitting || !points || points <= 0 || !reason.trim()}
                className="px-5 py-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Canje</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
