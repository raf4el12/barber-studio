'use client';

import React, { useState } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Branch } from '@/types/api';

interface BranchModalProps {
  branch: Branch | null; // null = create mode
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (b: Branch) => void;
}

export function BranchModal({
  branch,
  isOpen,
  onClose,
  onSuccess,
}: BranchModalProps) {
  const isEditing = !!branch;

  const [name, setName] = useState<string>(branch?.name || '');
  const [address, setAddress] = useState<string>(branch?.address || '');
  const [phone, setPhone] = useState<string>(branch?.phone || '');
  const [isActive, setIsActive] = useState<boolean>(
    branch ? branch.isActive : true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa el nombre de la sucursal.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let result: Branch;
      if (isEditing) {
        result = await api.branches.update(branch.id, {
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          isActive,
        });
      } else {
        result = await api.branches.create({
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
        });
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la sucursal.');
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Sede / Sucursal' : 'Nueva Sede / Sucursal'}
              </h2>
              <p className="text-xs text-zinc-400">
                Punto físico de atención y caja
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
              Nombre del Local / Sede *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Sede Central Miraflores, San Isidro..."
              className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Dirección Física
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej. Av. Larco 1042, Piso 1"
              className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. +51 987 654 321"
              className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isBranchActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-800"
              />
              <label htmlFor="isBranchActive" className="text-sm text-zinc-300 font-medium cursor-pointer">
                Sucursal Operativa y Activa
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
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Sede' : 'Crear Sede'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
