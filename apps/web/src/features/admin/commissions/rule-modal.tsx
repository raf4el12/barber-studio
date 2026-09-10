'use client';

import React, { useState } from 'react';
import { X, Percent, AlertCircle, Calendar } from 'lucide-react';
import { api } from '@/lib/api/client';
import type {
  CommissionRule,
  User,
  Branch,
  Service,
  ServiceCategory,
  Product,
} from '@/types/api';

interface RuleModalProps {
  rule: CommissionRule | null; // null = create mode
  barbers: User[];
  branches: Branch[];
  services: Service[];
  categories: ServiceCategory[];
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (r: CommissionRule) => void;
}

export function RuleModal({
  rule,
  barbers,
  branches,
  services,
  categories,
  products,
  isOpen,
  onClose,
  onSuccess,
}: RuleModalProps) {
  const isEditing = !!rule;

  const [name, setName] = useState<string>(rule?.name || '');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>(
    rule?.type || 'PERCENTAGE',
  );
  const [value, setValue] = useState<string>(rule ? String(rule.value) : '40');
  const [priority, setPriority] = useState<string>(
    rule?.priority !== undefined ? String(rule.priority) : '10',
  );
  const [barberId, setBarberId] = useState<string>(rule?.barberId || '');
  const [branchId, setBranchId] = useState<string>(rule?.branchId || '');
  const [serviceId, setServiceId] = useState<string>(rule?.serviceId || '');
  const [serviceCategoryId, setServiceCategoryId] = useState<string>(
    rule?.serviceCategoryId || '',
  );
  const [productId, setProductId] = useState<string>(rule?.productId || '');
  const [startsAt, setStartsAt] = useState<string>(
    rule?.startsAt ? rule.startsAt.split('T')[0] : '',
  );
  const [endsAt, setEndsAt] = useState<string>(
    rule?.endsAt ? rule.endsAt.split('T')[0] : '',
  );
  const [isActive, setIsActive] = useState<boolean>(
    rule ? rule.isActive : true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedVal = parseFloat(value);
    if (isNaN(parsedVal) || parsedVal < 0) {
      setError('Ingresa un valor de comisión válido (mayor o igual a 0).');
      return;
    }

    if (type === 'PERCENTAGE' && parsedVal > 100) {
      setError('El porcentaje de comisión no puede exceder el 100%.');
      return;
    }

    const parsedPriority = parseInt(priority, 10);
    if (isNaN(parsedPriority) || parsedPriority < 0) {
      setError('La prioridad debe ser un número entero mayor o igual a 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim() || undefined,
      type,
      value: parsedVal,
      priority: parsedPriority,
      barberId: barberId || undefined,
      branchId: branchId || undefined,
      serviceId: serviceId || undefined,
      serviceCategoryId: serviceCategoryId || undefined,
      productId: productId || undefined,
      startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      isActive,
    };

    try {
      let result: CommissionRule;
      if (isEditing) {
        result = await api.commissions.update(rule.id, payload);
      } else {
        result = await api.commissions.create(payload);
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la regla.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Regla de Comisión' : 'Nueva Regla de Comisión'}
              </h2>
              <p className="text-xs text-zinc-400">
                Ajuste fino de porcentajes y montos por servicio, producto o barbero
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
          {/* Name & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Nombre Descriptivo de la Regla (Opcional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Cera S/5 Fijo, 50% en Tinte..."
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Prioridad *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="10"
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition"
              />
              <p className="text-[10px] text-zinc-500 mt-0.5">Mayor número gana</p>
            </div>
          </div>

          {/* Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Tipo de Comisión *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
              >
                <option value="PERCENTAGE">Porcentaje (% sobre el subtotal)</option>
                <option value="FIXED">Monto Fijo (S/ por unidad vendida)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {type === 'PERCENTAGE' ? 'Porcentaje de Comisión (%) *' : 'Monto Fijo en Soles (S/) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-medium text-xs">
                  {type === 'PERCENTAGE' ? '%' : 'S/'}
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Scope Selectors (Specificity hierarchy) */}
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block">
              Ámbito y Filtros de Aplicación (Opcionales)
            </span>
            <p className="text-[11px] text-zinc-400">
              Deja en blanco para que aplique como regla general, o especifica para crear una excepción.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Barbero Específico
                </label>
                <select
                  value={barberId}
                  onChange={(e) => setBarberId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Todos los barberos</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Sucursal Específica
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Servicio Específico
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => {
                    setServiceId(e.target.value);
                    if (e.target.value) setProductId('');
                  }}
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Cualquier servicio</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (S/ {Number(s.price).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Categoría de Servicio
                </label>
                <select
                  value={serviceCategoryId}
                  onChange={(e) => setServiceCategoryId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Cualquier categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Producto Retail Específico
                </label>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    if (e.target.value) {
                      setServiceId('');
                      setServiceCategoryId('');
                    }
                  }}
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Cualquier producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''} - S/ {Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Validity dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Vigencia Desde (Opcional)
              </label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Vigencia Hasta (Opcional)
              </label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isRuleActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-800"
              />
              <label htmlFor="isRuleActive" className="text-sm text-zinc-300 font-medium cursor-pointer">
                Regla Activa y Aplicable
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
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Regla' : 'Crear Regla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
