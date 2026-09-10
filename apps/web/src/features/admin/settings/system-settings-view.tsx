'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Building2,
  Percent,
  Coins,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Branch, Setting } from '@/types/api';

interface SystemSettingsViewProps {
  branches: Branch[];
}

export function SystemSettingsView({ branches }: SystemSettingsViewProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(''); // '' = Global
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [taxRate, setTaxRate] = useState<string>('18');
  const [commissionBasePercentage, setCommissionBasePercentage] = useState<string>('40');
  const [commissionBase, setCommissionBase] = useState<string>('pre_tax');
  const [loyaltyPointsPerCurrency, setLoyaltyPointsPerCurrency] = useState<string>('10');

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const currentScope = selectedBranchId || 'global';
  const isLoading = loadedScope !== currentScope;

  const showSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => {
      setSaveSuccess(null);
    }, 3500);
  };

  const populateForm = (list: Setting[]) => {
    const map = new Map<string, string>();
    list.forEach((s) => map.set(s.key, s.value));

    if (map.has('tax_rate')) setTaxRate(map.get('tax_rate')!);
    else setTaxRate('18');

    if (map.has('commission_base_percentage'))
      setCommissionBasePercentage(map.get('commission_base_percentage')!);
    else setCommissionBasePercentage('40');

    if (map.has('commission_base'))
      setCommissionBase(map.get('commission_base')!);
    else setCommissionBase('pre_tax');

    if (map.has('loyalty_points_per_currency'))
      setLoyaltyPointsPerCurrency(map.get('loyalty_points_per_currency')!);
    else setLoyaltyPointsPerCurrency('10');
  };

  useEffect(() => {
    let ignore = false;
    const scope = selectedBranchId || 'global';
    api.settings
      .list(selectedBranchId || undefined)
      .then((data) => {
        if (!ignore) {
          setSettings(data);
          populateForm(data);
          setError(null);
          setLoadedScope(scope);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Error al cargar configuraciones');
          setLoadedScope(scope);
        }
      });
    return () => {
      ignore = true;
    };
  }, [selectedBranchId]);

  const handleSaveSetting = async (key: string, value: string, label: string) => {
    setSavingKey(key);
    try {
      await api.settings.upsert({
        key,
        value,
        branchId: selectedBranchId || null,
      });
      showSuccess(`Parámetro "${label}" guardado exitosamente.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Error al guardar ${label}`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey('all');
    setError(null);
    try {
      await Promise.all([
        api.settings.upsert({
          key: 'tax_rate',
          value: taxRate,
          branchId: selectedBranchId || null,
        }),
        api.settings.upsert({
          key: 'commission_base_percentage',
          value: commissionBasePercentage,
          branchId: selectedBranchId || null,
        }),
        api.settings.upsert({
          key: 'commission_base',
          value: commissionBase,
          branchId: selectedBranchId || null,
        }),
        api.settings.upsert({
          key: 'loyalty_points_per_currency',
          value: loyaltyPointsPerCurrency,
          branchId: selectedBranchId || null,
        }),
      ]);
      showSuccess('Todas las configuraciones se actualizaron con éxito.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {saveSuccess && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Scope Selector Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-white">
                Configuración Global (Toda la Empresa)
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                  Override Sede: {b.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-zinc-400">
            {selectedBranchId ? (
              <span className="text-amber-400 font-medium">
                Modo: Sobrescribe valores globales para esta sucursal
              </span>
            ) : (
              <span className="text-zinc-500">
                Aplica a todas las sedes que no tengan un override específico
              </span>
            )}
          </span>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={savingKey !== null || isLoading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20"
        >
          {savingKey === 'all' ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>Guardando todo...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Todos los Parámetros</span>
            </>
          )}
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <span className="text-xs font-semibold">Cargando parámetros del sistema...</span>
        </div>
      )}

      {/* Error Banner */}
      {error && !isLoading && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Impuesto / IGV */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Tasa de Impuesto / IGV (`tax_rate`)
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Porcentaje aplicado al cálculo tributario en tickets
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Define el porcentaje de impuesto al valor agregado gravado sobre los servicios y productos vendidos en la estación POS.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500 transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">
                    %
                  </span>
                </div>
                <button
                  onClick={() => handleSaveSetting('tax_rate', taxRate, 'Tasa de Impuesto')}
                  disabled={savingKey !== null}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  {savingKey === 'tax_rate' ? 'Guardando...' : 'Aplicar'}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span>Ejemplo en Perú: 18% para régimen estándar de IGV.</span>
            </div>
          </div>

          {/* Card 2: Comisión Base por Defecto */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Comisión Base General (`commission_base_percentage`)
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Fallback cuando no aplica ninguna regla específica
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Porcentaje predeterminado que recibe el barbero por cada atención si no existe una regla jerárquica con mayor prioridad.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissionBasePercentage}
                    onChange={(e) => setCommissionBasePercentage(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500 transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">
                    %
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleSaveSetting(
                      'commission_base_percentage',
                      commissionBasePercentage,
                      'Comisión Base General',
                    )
                  }
                  disabled={savingKey !== null}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  {savingKey === 'commission_base_percentage' ? 'Guardando...' : 'Aplicar'}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span>Estándar de la industria: entre 35% y 50% por servicio.</span>
            </div>
          </div>

          {/* Card 3: Base de Cálculo de Comisión */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Base de Cálculo de Comisión (`commission_base`)
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Criterio sobre el importe gravable del ticket
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Determina si el porcentaje de comisión se calcula antes de descontar impuestos (`pre_tax`) o después de aplicar impuestos y descuentos (`post_tax`).
              </p>

              <div className="mt-4 flex items-center gap-3">
                <select
                  value={commissionBase}
                  onChange={(e) => setCommissionBase(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="pre_tax">Antes de Impuestos (Pre-Tax) — Recomendado</option>
                  <option value="post_tax">Después de Impuestos (Post-Tax)</option>
                </select>
                <button
                  onClick={() =>
                    handleSaveSetting(
                      'commission_base',
                      commissionBase,
                      'Base de Cálculo de Comisión',
                    )
                  }
                  disabled={savingKey !== null}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  {savingKey === 'commission_base' ? 'Guardando...' : 'Aplicar'}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span>Pre-tax protege al barbero evitando que los impuestos del ticket reduzcan su comisión.</span>
            </div>
          </div>

          {/* Card 4: Ratio de Puntos de Fidelización */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Puntos de Fidelización (`loyalty_points_per_currency`)
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Factor de conversión de gasto a saldo de lealtad
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Monto gastado en tickets pagados necesario para ganar 1 punto de fidelidad. Por ejemplo, con valor 10, un ticket de $50 otorga 5 puntos.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={loyaltyPointsPerCurrency}
                    onChange={(e) => setLoyaltyPointsPerCurrency(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500 transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                    monto / 1 pt
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleSaveSetting(
                      'loyalty_points_per_currency',
                      loyaltyPointsPerCurrency,
                      'Ratio de Puntos de Fidelización',
                    )
                  }
                  disabled={savingKey !== null}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  {savingKey === 'loyalty_points_per_currency' ? 'Guardando...' : 'Aplicar'}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Los puntos acumulados se registran automáticamente al cobrar en POS.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
