'use client';

import React, { useState } from 'react';
import { X, ArrowUpDown, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Product, StockMovementType } from '@/types/api';

interface MovementModalProps {
  branchId: string;
  products: Product[];
  selectedProduct: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MovementModal({
  branchId,
  products,
  selectedProduct,
  isOpen,
  onClose,
  onSuccess,
}: MovementModalProps) {
  const [productId, setProductId] = useState<string>(
    selectedProduct?.id || (products.length > 0 ? products[0].id : ''),
  );
  const [type, setType] = useState<StockMovementType>('PURCHASE');
  const [quantity, setQuantity] = useState<string>('10');
  const [reference, setReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setError('Selecciona un producto.');
      return;
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty === 0) {
      setError('La cantidad no puede ser 0.');
      return;
    }

    // In PURCHASE or RETURN, quantity is always positive incoming.
    // In ADJUSTMENT, it can be positive or negative.
    let finalQty = parsedQty;
    if (type === 'PURCHASE' || type === 'RETURN') {
      finalQty = Math.abs(parsedQty);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.inventory.registerMovement({
        branchId,
        productId,
        type,
        quantity: finalQty,
        reference: reference.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar movimiento.');
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
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Movimiento de Stock</h2>
              <p className="text-xs text-zinc-400">
                Ajuste auditado en el inventario de la sucursal
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

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Producto *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(${p.sku})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Tipo de Movimiento *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as StockMovementType)}
              className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
            >
              <option value="PURCHASE">Entrada por Compra (Ingreso de mercadería)</option>
              <option value="ADJUSTMENT">Ajuste Manual (+ o - por conteo físico o merma)</option>
              <option value="RETURN">Devolución de Cliente (+ retorno a stock)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Cantidad de Unidades *
            </label>
            <input
              type="number"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="10"
              className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500 transition"
            />
            {type === 'ADJUSTMENT' && (
              <p className="text-xs text-zinc-500 mt-1">
                Puedes usar valores negativos (ej. -3) si hubo merma, daño o pérdida.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Referencia o Nota de Auditoría (Opcional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej. Factura F001-492, Conteo mensual..."
              className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
            />
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
              {isSubmitting ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
