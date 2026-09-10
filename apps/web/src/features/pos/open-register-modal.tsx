'use client';

import React, { useState } from 'react';
import { X, Unlock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { CashRegister } from '@/types/api';

interface OpenRegisterModalProps {
  branchId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (register: CashRegister) => void;
}

export function OpenRegisterModal({
  branchId,
  isOpen,
  onClose,
  onSuccess,
}: OpenRegisterModalProps) {
  const [openingAmount, setOpeningAmount] = useState<string>('100.00');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(openingAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Ingresa un monto de apertura válido (mayor o igual a 0).');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.cashRegisters.open({
        branchId,
        openingAmount: parsedAmount,
        notes: notes.trim() || undefined,
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al abrir la caja.');
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
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Apertura de Caja</h2>
              <p className="text-xs text-zinc-400">Inicia el turno de cobros</p>
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

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Fondo Inicial en Efectivo (S/)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-medium">
                S/
              </span>
              <input
                type="number"
                step="0.10"
                min="0"
                required
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-lg font-semibold focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Monto físico con el que inicia el cajón (cambio/sencillo).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Billetes de 20 y monedas surtidas..."
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition resize-none"
            />
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
              <Unlock className="w-4 h-4" />
              {isSubmitting ? 'Abriendo...' : 'Confirmar Apertura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
