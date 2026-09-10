'use client';

import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api/client';
import type {
  User,
  Branch,
  Service,
  Product,
  CommissionResolution,
} from '@/types/api';

interface CommissionSimulatorProps {
  barbers: User[];
  branches: Branch[];
  services: Service[];
  products: Product[];
}

export function CommissionSimulator({
  barbers,
  branches,
  services,
  products,
}: CommissionSimulatorProps) {
  const [barberId, setBarberId] = useState<string>(
    barbers.length > 0 ? barbers[0].id : '',
  );
  const [branchId, setBranchId] = useState<string>('');
  const [itemType, setItemType] = useState<'SERVICE' | 'PRODUCT'>('SERVICE');
  const [serviceId, setServiceId] = useState<string>(
    services.length > 0 ? services[0].id : '',
  );
  const [productId, setProductId] = useState<string>(
    products.length > 0 ? products[0].id : '',
  );
  const [unitPrice, setUnitPrice] = useState<string>(
    services.length > 0 ? String(services[0].price) : '35.00',
  );
  const [quantity, setQuantity] = useState<string>('1');
  const [resolution, setResolution] = useState<CommissionResolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleServiceChange = (sId: string) => {
    setServiceId(sId);
    const found = services.find((s) => s.id === sId);
    if (found) setUnitPrice(String(found.price));
  };

  const handleProductChange = (pId: string) => {
    setProductId(pId);
    const found = products.find((p) => p.id === pId);
    if (found) setUnitPrice(String(found.price));
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberId) {
      setError('Selecciona un barbero para la simulación.');
      return;
    }

    const priceNum = parseFloat(unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Ingresa un precio unitario válido.');
      return;
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 1) {
      setError('La cantidad debe ser al menos 1.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.commissions.preview({
        barberId,
        branchId: branchId || undefined,
        serviceId: itemType === 'SERVICE' ? serviceId || undefined : undefined,
        productId: itemType === 'PRODUCT' ? productId || undefined : undefined,
        unitPrice: priceNum,
        quantity: qtyNum,
      });
      setResolution(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error en la simulación.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'RULE':
        return 'Regla Específica de Mayor Prioridad';
      case 'USER_RATE':
        return 'Tasa Base Asignada al Barbero';
      case 'GLOBAL_SETTING':
        return 'Tasa Global Predeterminada del Salón';
      default:
        return source;
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">
            Simulador de Resolución de Comisiones
          </h3>
          <p className="text-xs text-zinc-400">
            Comprueba en tiempo real qué regla se activará ante una venta específica
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSimulate} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Barbero a Evaluar *
            </label>
            <select
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Sucursal (Opcional)
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Cualquier sucursal</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Tipo de Consumo *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setItemType('SERVICE');
                  if (services.length > 0) handleServiceChange(services[0].id);
                }}
                className={`flex-1 py-2 rounded-lg font-semibold border transition cursor-pointer ${
                  itemType === 'SERVICE'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                Servicio
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemType('PRODUCT');
                  if (products.length > 0) handleProductChange(products[0].id);
                }}
                className={`flex-1 py-2 rounded-lg font-semibold border transition cursor-pointer ${
                  itemType === 'PRODUCT'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                Producto
              </button>
            </div>
          </div>

          {itemType === 'SERVICE' ? (
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Servicio *
              </label>
              <select
                value={serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (S/ {Number(s.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Producto *
              </label>
              <select
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (S/ {Number(p.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Precio Venta Unitario (S/) *
            </label>
            <input
              type="number"
              step="0.50"
              min="0"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Cantidad de Unidades *
            </label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isLoading ? 'Resolviendo...' : 'Ejecutar Simulación'}
          </button>
        </div>
      </form>

      {/* Resolution Result Card */}
      {resolution && (
        <div className="bg-zinc-950 border border-emerald-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-sm">
                Resolución Exitosa
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                {resolution.type === 'PERCENTAGE'
                  ? `${resolution.value}% del Total`
                  : `S/ ${Number(resolution.value).toFixed(2)} Fijo por unidad`}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Criterio de asignación:{' '}
              <span className="text-zinc-200 font-semibold">
                {getSourceLabel(resolution.source)}
              </span>
            </p>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">
              Monto a Pagar al Barbero
            </span>
            <span className="font-mono text-2xl font-bold text-emerald-400">
              S/ {Number(resolution.amount).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
