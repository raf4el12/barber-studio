'use client';

import React, { useState } from 'react';
import { X, Tag, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Ticket, TicketDetail } from '@/types/api';

interface ApplyDiscountModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: TicketDetail) => void;
}

export function ApplyDiscountModal({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}: ApplyDiscountModalProps) {
  const [discountAmount, setDiscountAmount] = useState<string>(
    ticket.discountAmount ? String(ticket.discountAmount) : '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSubtotal = Number(ticket.subtotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(discountAmount);
    if (isNaN(parsed) || parsed < 0) {
      setError('Ingresa un monto de descuento válido (>= 0).');
      return;
    }

    if (parsed > currentSubtotal) {
      setError(
        `El descuento (S/ ${parsed.toFixed(2)}) no puede exceder el subtotal (S/ ${currentSubtotal.toFixed(2)}).`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.tickets.applyDiscount(ticket.id, parsed);
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al aplicar descuento.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Descuento Manual</h2>
              <p className="text-xs text-zinc-400">
                Ticket: <span className="text-amber-400 font-mono font-semibold">{ticket.code}</span>
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

        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3 mb-4 text-xs flex justify-between text-zinc-400">
          <span>Subtotal base del ticket:</span>
          <span className="font-mono font-bold text-zinc-100">
            S/ {currentSubtotal.toFixed(2)}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Monto a Descontar (S/)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-medium">
                S/
              </span>
              <input
                type="number"
                step="0.50"
                min="0"
                max={currentSubtotal}
                required
                autoFocus
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-lg font-semibold focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              El descuento se aplica al total antes de recalcular el IGV.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Tag className="w-4 h-4" />
              {isSubmitting ? 'Aplicando...' : 'Aplicar Descuento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
