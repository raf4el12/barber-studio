'use client';

import React, { useState } from 'react';
import { X, Sliders, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { InventoryItem } from '@/types/api';

interface ThresholdModalProps {
  item: InventoryItem | null;
  branchId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ThresholdModal({
  item,
  branchId,
  isOpen,
  onClose,
  onSuccess,
}: ThresholdModalProps) {
  const [threshold, setThreshold] = useState<string>(
    item ? String(item.lowStockThreshold) : '5',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = parseInt(threshold, 10);
    if (isNaN(parsed) || parsed < 0) {
      setError('Ingresa un umbral válido (mayor o igual a 0).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.inventory.updateThreshold({
        branchId,
        productId: item.productId,
        lowStockThreshold: parsed,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el umbral.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Umbral de Stock Mínimo</h2>
              <p className="text-xs text-zinc-400">
                Alerta de reposición automática
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

        <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span>Producto:</span>
            <span className="font-semibold text-white">
              {item.product?.name || item.productId}
            </span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Stock Actual en Sucursal:</span>
            <span className="font-mono font-bold text-zinc-200">
              {item.quantity} unidades
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
              Cantidad Mínima de Seguridad (Alerta)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              autoFocus
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="5"
              className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500 transition"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Cuando el stock físico llegue a esta cantidad o menos, el sistema marcará el producto en alerta crítica.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Umbral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
