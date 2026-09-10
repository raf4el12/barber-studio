'use client';

import React, { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Product } from '@/types/api';

interface ProductModalProps {
  product: Product | null; // null = create mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (p: Product) => void;
}

export function ProductModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: ProductModalProps) {
  const isEditing = !!product;

  const [name, setName] = useState<string>(product?.name || '');
  const [sku, setSku] = useState<string>(product?.sku || '');
  const [price, setPrice] = useState<string>(
    product ? String(product.price) : '25.00',
  );
  const [cost, setCost] = useState<string>(
    product?.cost !== null && product?.cost !== undefined ? String(product.cost) : '',
  );
  const [description, setDescription] = useState<string>(product?.description || '');
  const [isActive, setIsActive] = useState<boolean>(
    product ? product.isActive : true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa el nombre del producto.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Ingresa un precio de venta válido (>= 0).');
      return;
    }

    const parsedCost = cost ? parseFloat(cost) : undefined;
    if (parsedCost !== undefined && (isNaN(parsedCost) || parsedCost < 0)) {
      setError('Ingresa un costo de compra válido (>= 0).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let result: Product;
      if (isEditing) {
        result = await api.products.update(product.id, {
          name: name.trim(),
          sku: sku.trim() || undefined,
          price: parsedPrice,
          cost: parsedCost,
          description: description.trim() || undefined,
          isActive,
        });
      } else {
        result = await api.products.create({
          name: name.trim(),
          sku: sku.trim() || undefined,
          price: parsedPrice,
          cost: parsedCost,
          description: description.trim() || undefined,
        });
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Producto' : 'Nuevo Producto Retail'}
              </h2>
              <p className="text-xs text-zinc-400">
                Catálogo comercial para venta al cliente
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Cera Mate Fijación Fuerte, Aceite Barba..."
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Código / SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PROD-001"
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500 transition uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Precio de Venta al Público (S/) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-medium text-xs">
                  S/
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Costo de Compra (S/)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-medium text-xs">
                  S/
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Descripción del Producto (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Presentación en 150g, base agua, aroma cítrico..."
              className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isProductActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-800"
              />
              <label htmlFor="isProductActive" className="text-sm text-zinc-300 font-medium cursor-pointer">
                Producto Disponible para Venta
              </label>
            </div>
          )}

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
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Producto' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
