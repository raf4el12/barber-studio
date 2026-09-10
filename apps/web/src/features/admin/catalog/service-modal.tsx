'use client';

import React, { useState } from 'react';
import { X, Scissors, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Service, ServiceCategory } from '@/types/api';

interface ServiceModalProps {
  service: Service | null; // null = create mode
  categories: ServiceCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (svc: Service) => void;
}

export function ServiceModal({
  service,
  categories,
  isOpen,
  onClose,
  onSuccess,
}: ServiceModalProps) {
  const isEditing = !!service;

  const [name, setName] = useState<string>(service?.name || '');
  const [categoryId, setCategoryId] = useState<string>(
    service?.categoryId || (categories.length > 0 ? categories[0].id : ''),
  );
  const [price, setPrice] = useState<string>(
    service ? String(service.price) : '35.00',
  );
  const [durationMinutes, setDurationMinutes] = useState<string>(
    service?.durationMinutes ? String(service.durationMinutes) : '30',
  );
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(
    service ? service.isActive : true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa el nombre del servicio.');
      return;
    }

    if (!categoryId) {
      setError('Selecciona una categoría de servicio.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Ingresa un precio válido (mayor o igual a 0).');
      return;
    }

    const parsedDuration = parseInt(durationMinutes, 10);
    if (isNaN(parsedDuration) || parsedDuration < 5) {
      setError('La duración estimada debe ser de al menos 5 minutos.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let result: Service;
      if (isEditing) {
        result = await api.catalog.updateService(service.id, {
          name: name.trim(),
          categoryId,
          price: parsedPrice,
          durationMinutes: parsedDuration,
          description: description.trim() || undefined,
          isActive,
        });
      } else {
        result = await api.catalog.createService({
          name: name.trim(),
          categoryId,
          price: parsedPrice,
          durationMinutes: parsedDuration,
          description: description.trim() || undefined,
        });
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el servicio.');
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
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Servicio' : 'Nuevo Servicio de Barbería'}
              </h2>
              <p className="text-xs text-zinc-400">
                Parámetros de atención, precio y duración
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
              Nombre del Servicio *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Corte Clásico + Barba, Fade Premium..."
              className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Categoría *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Precio de Venta (S/) *
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Duración Estimada (Minutos) *
              </label>
              <input
                type="number"
                step="5"
                min="5"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="30"
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-800"
                />
                <label htmlFor="isActive" className="text-sm text-zinc-300 font-medium cursor-pointer">
                  Servicio Activo en Catálogo
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Descripción o Instrucciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Incluye lavado, toalla caliente, perfilado..."
              className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition resize-none"
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
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Servicio' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
