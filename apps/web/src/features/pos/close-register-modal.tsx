'use client';

import React, { useState } from 'react';
import { X, Lock, AlertTriangle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { CashRegister } from '@/types/api';

interface CloseRegisterModalProps {
  register: CashRegister;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (closedRegister: CashRegister) => void;
}

export function CloseRegisterModal({
  register,
  isOpen,
  onClose,
  onSuccess,
}: CloseRegisterModalProps) {
  const [closingCountedCash, setClosingCountedCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedCounted = parseFloat(closingCountedCash);
    if (isNaN(parsedCounted) || parsedCounted < 0) {
      setError('Ingresa el monto de efectivo físico contado (mayor o igual a 0).');
      return;
    }

    setIsSubmitting(true);
    try {
      const closed = await api.cashRegisters.close(register.id, {
        closingCountedCash: parsedCounted,
        notes: notes.trim() || undefined,
      });
      onSuccess(closed);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al cerrar la caja.');
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
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Arqueo y Cierre de Caja</h2>
              <p className="text-xs text-zinc-400">Finalizar sesión del turno</p>
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

        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span>Fondo Inicial Registrado:</span>
            <span className="font-mono font-semibold text-zinc-200">
              S/ {Number(register.openingAmount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Hora de Apertura:</span>
            <span className="text-zinc-300">
              {new Date(register.openedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
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
              Efectivo Físico Contado en Cajón (S/)
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
                autoFocus
                value={closingCountedCash}
                onChange={(e) => setClosingCountedCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-lg font-semibold focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Cuenta todo el dinero físico en billetes y monedas dentro del cajón.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Observaciones del Cierre (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Cuadró exacto / faltaron S/ 0.50 en sencillo..."
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-start gap-2 text-xs text-amber-300/80">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Una vez cerrada la caja, no podrás cobrar nuevos tickets hasta que se realice una nueva apertura.
            </span>
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
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              {isSubmitting ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
