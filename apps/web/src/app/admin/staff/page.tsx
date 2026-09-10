'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Loader2,
  Scissors,
  DollarSign,
  Shield,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { User, Branch, Role } from '@/types/api';
import { UserModal } from '@/features/admin/staff/user-modal';
import { BranchModal } from '@/features/admin/staff/branch-modal';

type ActiveTab = 'staff' | 'branches';

export default function StaffAdminPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('staff');
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [usersData, branchesData] = await Promise.all([
        api.users.list(),
        api.branches.list(),
      ]);
      setUsers(usersData);
      setBranches(branchesData);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([api.users.list(), api.branches.list()]).then(
      ([usersData, branchesData]) => {
        if (!ignore) {
          setUsers(usersData);
          setBranches(branchesData);
          setIsLoading(false);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`¿Seguro que deseas desactivar la cuenta de "${user.name}"?`)) return;
    try {
      await api.users.delete(user.id);
      await loadData();
      showToast(`Usuario "${user.name}" dado de baja.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar usuario.');
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la sucursal "${branch.name}"?`)) return;
    try {
      await api.branches.delete(branch.id);
      await loadData();
      showToast(`Sucursal "${branch.name}" eliminada.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar sucursal.');
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Shield className="w-3 h-3" />
            Admin / Dueño
          </span>
        );
      case 'CASHIER':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <DollarSign className="w-3 h-3" />
            Cajero / POS
          </span>
        );
      case 'BARBER':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Scissors className="w-3 h-3" />
            Barbero
          </span>
        );
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredBranches = branches.filter((b) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-emerald-900/90 border border-emerald-500 text-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Personal y Sucursales
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gestión de cuentas del equipo (barberos, cajeros) y red de locales físicos
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'staff' ? (
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setUserModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Miembro
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingBranch(null);
                setBranchModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Sede
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipo ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('branches');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Sedes / Sucursales ({branches.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {activeTab === 'staff' && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todos los Roles</option>
              <option value="BARBER">Barberos</option>
              <option value="CASHIER">Cajeros</option>
              <option value="OWNER">Administradores</option>
            </select>
          )}

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el equipo..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs">Cargando personal y sucursales...</p>
        </div>
      ) : activeTab === 'staff' ? (
        /* TEAM TABLE */
        <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/60 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Nombre</th>
                  <th className="p-3.5">Correo</th>
                  <th className="p-3.5">Rol</th>
                  <th className="p-3.5">Sucursal</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                      No se encontraron miembros del equipo.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const branch = branches.find((b) => b.id === u.branchId);
                    return (
                      <tr key={u.id} className="hover:bg-zinc-800/30 transition">
                        <td className="p-3.5 font-medium text-white">
                          {u.name}
                        </td>
                        <td className="p-3.5 font-mono text-zinc-400">
                          {u.email}
                        </td>
                        <td className="p-3.5">
                          {getRoleBadge(u.role)}
                        </td>
                        <td className="p-3.5 text-zinc-300">
                          {branch ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                              {branch.name}
                            </span>
                          ) : (
                            <span className="text-zinc-600 italic">Todas / Global</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              u.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            {u.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setUserModalOpen(true);
                            }}
                            title="Editar Usuario"
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteUser(u)}
                            title="Desactivar Cuenta"
                            className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* BRANCHES CARDS / TABLE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.length === 0 ? (
            <div className="col-span-full p-12 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              No hay sucursales registradas.
            </div>
          ) : (
            filteredBranches.map((branch) => {
              const assignedCount = users.filter((u) => u.branchId === branch.id).length;
              return (
                <div
                  key={branch.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between space-y-4 transition shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{branch.name}</h3>
                        <span className="text-[11px] text-zinc-500">
                          {assignedCount} miembros asignados
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBranch(branch);
                          setBranchModalOpen(true);
                        }}
                        title="Editar Sede"
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteBranch(branch)}
                        title="Eliminar Sede"
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 space-y-1">
                    {branch.address && (
                      <div>
                        <span className="text-zinc-500">Dirección: </span>
                        <span>{branch.address}</span>
                      </div>
                    )}
                    {branch.phone && (
                      <div>
                        <span className="text-zinc-500">Teléfono: </span>
                        <span className="font-mono text-zinc-300">{branch.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Estado Operativo</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        branch.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {branch.isActive ? 'Operativa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modals */}
      <UserModal
        user={editingUser}
        branches={branches}
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onSuccess={async () => {
          await loadData();
          showToast(editingUser ? 'Cuenta actualizada.' : 'Usuario creado exitosamente.');
        }}
      />

      <BranchModal
        branch={editingBranch}
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        onSuccess={async () => {
          await loadData();
          showToast(editingBranch ? 'Sede actualizada.' : 'Sede creada exitosamente.');
        }}
      />
    </div>
  );
}
