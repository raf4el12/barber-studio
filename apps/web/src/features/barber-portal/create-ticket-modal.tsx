'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import type { QueueEntry, Service, Product, CreateTicketItemDto } from '@/types/api';
import { Receipt, X, Trash2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface SelectedItem {
  id: string; // unique selection key
  type: 'SERVICE' | 'PRODUCT';
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export function CreateTicketModal({
  isOpen,
  onClose,
  entry,
  branchId,
  onTicketCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  entry: QueueEntry | null;
  branchId: string;
  onTicketCreated: () => void;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [tipAmount, setTipAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadCatalog = async () => {
      setLoadingCatalog(true);
      setError(null);
      try {
        const [servs, prods] = await Promise.all([
          api.catalog.getServices(),
          api.catalog.getProducts(),
        ]);
        setServices(servs.filter((s) => s.isActive));
        setProducts(prods.filter((p) => p.isActive));

        // Preselect first service as default if empty
        if (servs.length > 0) {
          const first = servs[0];
          setSelectedItems((prev) =>
            prev.length === 0
              ? [
                  {
                    id: `serv-${first.id}`,
                    type: 'SERVICE',
                    itemId: first.id,
                    name: first.name,
                    unitPrice: Number(first.price),
                    quantity: 1,
                  },
                ]
              : prev,
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoadingCatalog(false);
      }
    };

    void loadCatalog();
  }, [isOpen]);

  if (!isOpen || !entry) return null;

  const addService = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    setSelectedItems((prev) => [
      ...prev,
      {
        id: `serv-${service.id}-${Date.now()}`,
        type: 'SERVICE',
        itemId: service.id,
        name: service.name,
        unitPrice: Number(service.price),
        quantity: 1,
      },
    ]);
  };

  const addProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setSelectedItems((prev) => [
      ...prev,
      {
        id: `prod-${product.id}-${Date.now()}`,
        type: 'PRODUCT',
        itemId: product.id,
        name: product.name,
        unitPrice: Number(product.price),
        quantity: 1,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = selectedItems.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );
  const tip = Number(tipAmount) > 0 ? Number(tipAmount) : 0;
  const estimatedTotal = subtotal + tip;

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError('Debes agregar al menos un servicio o producto realizado.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const items: CreateTicketItemDto[] = selectedItems.map((item) => ({
      serviceId: item.type === 'SERVICE' ? item.itemId : undefined,
      productId: item.type === 'PRODUCT' ? item.itemId : undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    try {
      await api.tickets.create({
        branchId,
        queueEntryId: entry.id,
        customerId: entry.customerId || undefined,
        items,
        tipAmount: tip > 0 ? tip : undefined,
      });

      onTicketCreated();
      onClose();
      setSelectedItems([]);
      setTipAmount('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al generar el ticket');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Finalizar y Generar Ticket
            </h3>
            <p className="text-xs text-zinc-400">
              Turno #{String(entry.sequenceNumber).padStart(3, '0')} •{' '}
              <span className="text-zinc-200 font-medium">
                {entry.customerName || 'Cliente Walk-in'}
              </span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Servicios y Productos Entregados
            </label>

            {loadingCatalog ? (
              <div className="py-6 flex items-center justify-center text-xs text-zinc-500 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <span>Cargando catálogo...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-zinc-800 text-zinc-400 mr-2">
                        {item.type === 'SERVICE' ? 'Servicio' : 'Producto'}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        S/ {(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-600 hover:text-red-400 p-1 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addService(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="" disabled>
                  + Agregar otro servicio...
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — S/ {Number(s.price).toFixed(2)}
                  </option>
                ))}
              </select>

              {products.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addProduct(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="" disabled>
                    + Agregar producto (cera, etc.)...
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — S/ {Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Propina Voluntaria del Cliente (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-zinc-500 font-mono">
                S/
              </span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="0.00"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Total a Pagar en Caja:</span>
            <span className="text-xl font-black text-amber-400 font-mono">
              S/ {estimatedTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Volver
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting || selectedItems.length === 0}
              className="flex-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando al POS...</span>
                </>
              ) : (
                <span>Emitir Ticket a Caja</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
