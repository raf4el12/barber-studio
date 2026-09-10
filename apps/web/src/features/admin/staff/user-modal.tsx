'use client';

import React, { useState } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { User, Branch, Role } from '@/types/api';

interface UserModalProps {
  user: User | null; // null = create mode
  branches: Branch[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (u: User) => void;
}

export function UserModal({
  user,
  branches,
  isOpen,
  onClose,
  onSuccess,
}: UserModalProps) {
  const isEditing = !!user;

  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<Role>(user?.role || 'BARBER');
  const [branchId, setBranchId] = useState<string>(
    user?.branchId || (branches.length > 0 ? branches[0].id : ''),
  );
  const [isActive, setIsActive] = useState<boolean>(
    user ? user.isActive : true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa el nombre completo.');
      return;
    }
    if (!email.trim()) {
      setError('Ingresa el correo electrónico.');
      return;
    }
    if (!isEditing && (!password || password.length < 8)) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (isEditing && password && password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let result: User;
      if (isEditing) {
        result = await api.users.update(user.id, {
          name: name.trim(),
          email: email.trim(),
          password: password.trim() || undefined,
          role,
          branchId: branchId || undefined,
          isActive,
        });
      } else {
        result = await api.users.create({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
          branchId: branchId || undefined,
        });
      }
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar usuario.');
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
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Cuenta de Usuario' : 'Nuevo Miembro del Equipo'}
              </h2>
              <p className="text-xs text-zinc-400">
                Asignación de roles, credenciales y sucursal
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
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Carlos Mendoza, Miguel Ángel..."
              className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Correo Electrónico (Login) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@barberstudio.pe"
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña (mín. 8 car.) *'}
              </label>
              <input
                type="password"
                required={!isEditing}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Dejar en blanco para mantener' : '••••••••'}
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Rol Operativo *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition font-medium"
              >
                <option value="BARBER">Barbero (Atención y Cola)</option>
                <option value="CASHIER">Cajero / Recepción (POS y Caja)</option>
                <option value="OWNER">Propietario / Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Sucursal Asignada *
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isUserActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-800"
              />
              <label htmlFor="isUserActive" className="text-sm text-zinc-300 font-medium cursor-pointer">
                Cuenta Activa (Habilitada para iniciar sesión)
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
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Cuenta' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
