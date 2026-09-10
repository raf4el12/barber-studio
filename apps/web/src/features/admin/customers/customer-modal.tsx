'use client';

import React, { useState } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Customer, Branch, CreateCustomerDto, UpdateCustomerDto } from '@/types/api';

interface CustomerModalProps {
  customer: Customer | null; // null = create mode
  branches: Branch[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (c: Customer) => void;
}

export function CustomerModal({
  customer,
  branches,
  isOpen,
  onClose,
  onSuccess,
}: CustomerModalProps) {
  const isEditing = !!customer;

  const [name, setName] = useState<string>(customer?.name || '');
  const [phone, setPhone] = useState<string>(customer?.phone || '');
  const [email, setEmail] = useState<string>(customer?.email || '');
  const [branchId, setBranchId] = useState<string>(customer?.branchId || '');
  const [notes, setNotes] = useState<string>(customer?.notes || '');
  const [isActive, setIsActive] = useState<boolean>(customer ? customer.isActive : true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa el nombre completo del cliente.');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        const dto: UpdateCustomerDto = {
          name: name.trim(),
          phone: phone.trim() ? phone.trim() : null,
          email: email.trim() ? email.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
          branchId: branchId || null,
          isActive,
        };
        const updated = await api.customers.update(customer.id, dto);
        onSuccess(updated);
        onClose();
      } else {
        const dto: CreateCustomerDto = {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
          branchId: branchId || undefined,
          isActive,
        };
        const created = await api.customers.create(dto);
        onSuccess(created);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el cliente';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isEditing
                  ? `Actualizando datos de ${customer.name}`
                  : 'Ficha y perfil de fidelización del cliente'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nombre Completo <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Roberto Gómez"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+51 987 654 321"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Sede Preferida / Habitual
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
            >
              <option value="">Todas las Sedes / Sin Asignación Fija</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {!b.isActive && '(Inactiva)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Notas y Preferencias del Cliente
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferencias de corte (ej. Fade medio, peinado lateral), productos favoritos, alergias o instrucciones especiales..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
              <span className="text-xs font-semibold text-white block">
                Estado del Cliente
              </span>
              <span className="text-xs text-zinc-400">
                Los clientes inactivos no aparecerán en la búsqueda rápida de tickets
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
