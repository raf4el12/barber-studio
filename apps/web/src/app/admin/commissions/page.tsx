'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Loader2,
  Calendar,
  Building2,
  User,
  Scissors,
  Package,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type {
  CommissionRule,
  User as UserType,
  Branch,
  Service,
  ServiceCategory,
  Product,
} from '@/types/api';
import { RuleModal } from '@/features/admin/commissions/rule-modal';
import { CommissionSimulator } from '@/features/admin/commissions/commission-simulator';

export default function CommissionsAdminPage() {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [barbers, setBarbers] = useState<UserType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [
        rulesData,
        usersData,
        branchesData,
        servicesData,
        categoriesData,
        productsData,
      ] = await Promise.all([
        api.commissions.list(),
        api.users.list(),
        api.branches.list(),
        api.catalog.getServices(),
        api.catalog.getCategories(),
        api.products.list(),
      ]);
      setRules(rulesData);
      setBarbers(usersData.filter((u) => u.role === 'BARBER'));
      setBranches(branchesData);
      setServices(servicesData);
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.commissions.list(),
      api.users.list(),
      api.branches.list(),
      api.catalog.getServices(),
      api.catalog.getCategories(),
      api.products.list(),
    ]).then(
      ([
        rulesData,
        usersData,
        branchesData,
        servicesData,
        categoriesData,
        productsData,
      ]) => {
        if (!ignore) {
          setRules(rulesData);
          setBarbers(usersData.filter((u) => u.role === 'BARBER'));
          setBranches(branchesData);
          setServices(servicesData);
          setCategories(categoriesData);
          setProducts(productsData);
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

  const handleDeleteRule = async (rule: CommissionRule) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar la regla "${rule.name || rule.id}"?`,
      )
    )
      return;
    try {
      await api.commissions.delete(rule.id);
      await loadData();
      showToast('Regla de comisión eliminada.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar regla.');
    }
  };

  const renderScopeBadges = (r: CommissionRule) => {
    const badges = [];

    if (r.barberId) {
      const b = barbers.find((item) => item.id === r.barberId);
      badges.push(
        <span
          key="barber"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-amber-300 text-[10px] border border-zinc-700"
        >
          <User className="w-3 h-3" />
          {b?.name || 'Barbero'}
        </span>,
      );
    }

    if (r.serviceId) {
      const s = services.find((item) => item.id === r.serviceId);
      badges.push(
        <span
          key="service"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-blue-300 text-[10px] border border-zinc-700"
        >
          <Scissors className="w-3 h-3" />
          {s?.name || 'Servicio'}
        </span>,
      );
    }

    if (r.serviceCategoryId) {
      const c = categories.find((item) => item.id === r.serviceCategoryId);
      badges.push(
        <span
          key="cat"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-purple-300 text-[10px] border border-zinc-700"
        >
          Cat: {c?.name || 'Categoría'}
        </span>,
      );
    }

    if (r.productId) {
      const p = products.find((item) => item.id === r.productId);
      badges.push(
        <span
          key="prod"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-emerald-300 text-[10px] border border-zinc-700"
        >
          <Package className="w-3 h-3" />
          {p?.name || 'Producto'}
        </span>,
      );
    }

    if (r.branchId) {
      const br = branches.find((item) => item.id === r.branchId);
      badges.push(
        <span
          key="branch"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] border border-zinc-700"
        >
          <Building2 className="w-3 h-3" />
          {br?.name || 'Sede'}
        </span>,
      );
    }

    if (badges.length === 0) {
      return (
        <span className="text-zinc-500 italic text-[11px]">
          Regla Global (Toda la cadena)
        </span>
      );
    }

    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-emerald-900/90 border border-emerald-500 text-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Motor de Comisiones
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configuración jerárquica de porcentajes y montos por servicio, producto o barbero
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingRule(null);
            setRuleModalOpen(true);
          }}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva Regla de Comisión
        </button>
      </div>

      {/* Simulator Section */}
      <CommissionSimulator
        barbers={barbers}
        branches={branches}
        services={services}
        products={products}
      />

      {/* Rules Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
            Reglas de Comisión Configuradas ({rules.length})
          </h2>
        </div>

        <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/60 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Prioridad</th>
                  <th className="p-3.5">Nombre / Regla</th>
                  <th className="p-3.5">Ámbito de Aplicación</th>
                  <th className="p-3.5">Tipo y Valor</th>
                  <th className="p-3.5">Vigencia</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                      Cargando reglas de comisiones...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-zinc-500">
                      No hay reglas de comisión registradas. Se aplicará la tasa base de cada barbero.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => {
                    const isPercentage = r.type === 'PERCENTAGE';
                    const hasDates = !!(r.startsAt || r.endsAt);

                    return (
                      <tr key={r.id} className="hover:bg-zinc-800/30 transition">
                        <td className="p-3.5">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                            P-{r.priority}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-white">
                          <div>{r.name || 'Regla sin nombre'}</div>
                        </td>
                        <td className="p-3.5">
                          {renderScopeBadges(r)}
                        </td>
                        <td className="p-3.5 font-mono">
                          <span
                            className={`font-bold text-sm ${
                              isPercentage ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {isPercentage
                              ? `${r.value}%`
                              : `S/ ${Number(r.value).toFixed(2)}`}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            {isPercentage ? 'del total' : 'por unidad'}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-400">
                          {hasDates ? (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3 h-3 text-zinc-500" />
                              <span>
                                {r.startsAt ? new Date(r.startsAt).toLocaleDateString() : 'Inicio'}
                                {' - '}
                                {r.endsAt ? new Date(r.endsAt).toLocaleDateString() : 'Sin fin'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">Permanente</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              r.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            {r.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRule(r);
                              setRuleModalOpen(true);
                            }}
                            title="Editar Regla"
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteRule(r)}
                            title="Eliminar Regla"
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
      </div>

      {/* Rule Modal */}
      <RuleModal
        rule={editingRule}
        barbers={barbers}
        branches={branches}
        services={services}
        categories={categories}
        products={products}
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        onSuccess={async () => {
          await loadData();
          showToast(editingRule ? 'Regla actualizada.' : 'Regla de comisión creada.');
        }}
      />
    </div>
  );
}
