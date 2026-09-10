'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Award,
  Plus,
  Search,
  CheckCircle2,
  Loader2,
  Trash2,
  Edit2,
  Building2,
  Sparkles,
  HeartHandshake,
  Gift,
  Eye,
  FileText,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Customer, Branch } from '@/types/api';
import { CustomerModal } from '@/features/admin/customers/customer-modal';
import { RedeemLoyaltyModal } from '@/features/admin/customers/redeem-loyalty-modal';
import { CustomerDetailDrawer } from '@/features/admin/customers/customer-detail-drawer';

export default function CustomersAdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [loyaltyFilter, setLoyaltyFilter] = useState<'ALL' | 'WITH_POINTS' | 'ZERO_POINTS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals & Drawer State
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [redeemCustomer, setRedeemCustomer] = useState<Customer | null>(null);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [customersData, branchesData] = await Promise.all([
        api.customers.list(),
        api.branches.list(),
      ]);
      setCustomers(customersData);
      setBranches(branchesData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([api.customers.list(), api.branches.list()])
      .then(([customersData, branchesData]) => {
        if (!ignore) {
          setCustomers(customersData);
          setBranches(branchesData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos');
          setIsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const matchesBranch =
        branchFilter === 'ALL' ||
        (branchFilter === 'NONE' && !c.branchId) ||
        c.branchId === branchFilter;

      const matchesLoyalty =
        loyaltyFilter === 'ALL' ||
        (loyaltyFilter === 'WITH_POINTS' && c.loyaltyPoints > 0) ||
        (loyaltyFilter === 'ZERO_POINTS' && c.loyaltyPoints === 0);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && c.isActive) ||
        (statusFilter === 'INACTIVE' && !c.isActive);

      return matchesSearch && matchesBranch && matchesLoyalty && matchesStatus;
    });
  }, [customers, searchQuery, branchFilter, loyaltyFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.isActive).length;
    const withPoints = customers.filter((c) => c.loyaltyPoints > 0).length;
    const totalCirculatingPoints = customers.reduce(
      (acc, c) => acc + (c.loyaltyPoints || 0),
      0,
    );

    return {
      totalCustomers,
      activeCustomers,
      withPoints,
      totalCirculatingPoints,
    };
  }, [customers]);

  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    branches.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [branches]);

  // Handle customer deletion
  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      await api.customers.delete(deletingCustomer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id));
      if (detailCustomer?.id === deletingCustomer.id) {
        setDetailDrawerOpen(false);
      }
      showToast(`Cliente "${deletingCustomer.name}" eliminado correctamente.`);
      setDeletingCustomer(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar cliente');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handlers for modal success
  const handleCustomerSaved = (saved: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    if (detailCustomer?.id === saved.id) {
      setDetailCustomer(saved);
    }

    showToast(
      editingCustomer
        ? `Cliente "${saved.name}" actualizado con éxito.`
        : `Cliente "${saved.name}" registrado correctamente.`,
    );
  };

  const handlePointsRedeemed = (newPoints: number) => {
    if (!redeemCustomer) return;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === redeemCustomer.id ? { ...c, loyaltyPoints: newPoints } : c,
      ),
    );
    if (detailCustomer?.id === redeemCustomer.id) {
      setDetailCustomer((prev) => (prev ? { ...prev, loyaltyPoints: newPoints } : null));
    }
    showToast(`Canje realizado con éxito. Nuevo saldo: ${newPoints} pts.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Clientes y Fidelización
              </h1>
              <p className="text-xs text-zinc-400">
                Directorio unificado, libro mayor de puntos de lealtad e historial de visitas.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setCustomerModalOpen(true);
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Clientes</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalCustomers}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {stats.activeCustomers} activos registrados
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Puntos en Circulación</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {stats.totalCirculatingPoints.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Saldo acumulado por compras
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Clientes con Saldo</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-white">{stats.withPoints}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {stats.totalCustomers > 0
              ? `${Math.round((stats.withPoints / stats.totalCustomers) * 100)}% de la base`
              : '0% de la base'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Fidelización Activa</span>
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.activeCustomers}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Habilitados para acumular y canjear
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o correo electrónico..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 transition"
          >
            <option value="ALL">Todas las Sedes</option>
            <option value="NONE">Sin sede asignada</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Loyalty Filter */}
          <select
            value={loyaltyFilter}
            onChange={(e) =>
              setLoyaltyFilter(e.target.value as 'ALL' | 'WITH_POINTS' | 'ZERO_POINTS')
            }
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 transition"
          >
            <option value="ALL">Todos los Saldos</option>
            <option value="WITH_POINTS">Con Puntos (&gt; 0)</option>
            <option value="ZERO_POINTS">Sin Puntos (0)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
            }
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 transition"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Solo Activos</option>
            <option value="INACTIVE">Solo Inactivos</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              setIsLoading(true);
              loadData();
            }}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition font-medium"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Main Customers Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <span className="text-xs font-semibold">Cargando directorio de clientes...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6">
          <Users className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">
            No se encontraron clientes
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
            {searchQuery || branchFilter !== 'ALL' || loyaltyFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Aún no has registrado clientes en el sistema.'}
          </p>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setCustomerModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Registrar Primer Cliente
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Contacto</th>
                  <th className="px-5 py-3.5">Sede Preferida</th>
                  <th className="px-5 py-3.5 text-center">Puntos Fidelidad</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredCustomers.map((c) => {
                  const hasPoints = c.loyaltyPoints > 0;
                  const branchName = c.branchId ? branchMap.get(c.branchId) : null;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-800/40 transition group cursor-pointer"
                      onClick={() => {
                        setDetailCustomer(c);
                        setDetailDrawerOpen(true);
                      }}
                    >
                      {/* Name and Notes */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white group-hover:text-amber-400 transition">
                                {c.name}
                              </span>
                              {c.notes && (
                                <span
                                  title={c.notes}
                                  className="text-amber-400/80 hover:text-amber-300"
                                >
                                  <FileText className="w-3.5 h-3.5 inline" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-500">
                              ID: {c.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact info */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>{c.phone || <span className="text-zinc-600">—</span>}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {c.email || <span className="text-zinc-600">—</span>}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Preferred Branch */}
                      <td className="px-5 py-3.5">
                        {branchName ? (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Building2 className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                            <span>{branchName}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-[11px] italic">
                            Todas las Sedes
                          </span>
                        )}
                      </td>

                      {/* Loyalty Points Badge */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
                          <Award
                            className={`w-3.5 h-3.5 ${
                              hasPoints ? 'text-amber-400' : 'text-zinc-600'
                            }`}
                          />
                          <span
                            className={`font-bold font-mono ${
                              hasPoints ? 'text-amber-400' : 'text-zinc-500'
                            }`}
                          >
                            {c.loyaltyPoints}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-semibold">
                            pts
                          </span>
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {c.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-5 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {/* View Detail / History */}
                          <button
                            onClick={() => {
                              setDetailCustomer(c);
                              setDetailDrawerOpen(true);
                            }}
                            title="Ver Ficha e Historial"
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Redeem Points */}
                          <button
                            onClick={() => {
                              setRedeemCustomer(c);
                              setRedeemModalOpen(true);
                            }}
                            disabled={c.loyaltyPoints <= 0}
                            title={
                              c.loyaltyPoints > 0
                                ? 'Canjear Puntos'
                                : 'Sin saldo de puntos disponible'
                            }
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition cursor-pointer"
                          >
                            <Gift className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingCustomer(c);
                              setCustomerModalOpen(true);
                            }}
                            title="Editar Cliente"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingCustomer(c)}
                            title="Eliminar Cliente"
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Modal (Create / Edit) */}
      <CustomerModal
        customer={editingCustomer}
        branches={branches}
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={handleCustomerSaved}
      />

      {/* Redeem Loyalty Modal */}
      <RedeemLoyaltyModal
        customer={redeemCustomer}
        isOpen={redeemModalOpen}
        onClose={() => setRedeemModalOpen(false)}
        onSuccess={handlePointsRedeemed}
      />

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        customer={detailCustomer}
        branchName={detailCustomer?.branchId ? branchMap.get(detailCustomer.branchId) : undefined}
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        onEdit={(c) => {
          setEditingCustomer(c);
          setCustomerModalOpen(true);
        }}
        onRedeem={(c) => {
          setRedeemCustomer(c);
          setRedeemModalOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white mb-2">
              ¿Eliminar ficha de cliente?
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Estás a punto de deshabilitar y archivar al cliente{' '}
              <strong className="text-white">{deletingCustomer.name}</strong>. Esta acción
              no eliminará su historial de tickets previos en auditoría.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, Eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
