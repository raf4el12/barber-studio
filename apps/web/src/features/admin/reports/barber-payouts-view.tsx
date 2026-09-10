'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  Percent,
  Coins,
  Loader2,
  AlertTriangle,
  Printer,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Branch, BarberPayoutsReport } from '@/types/api';

interface BarberPayoutsViewProps {
  branches: Branch[];
  initialBranchId?: string;
}

export function BarberPayoutsView({
  branches,
  initialBranchId,
}: BarberPayoutsViewProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    initialBranchId || (branches.length > 0 ? branches[0].id : ''),
  );

  // Default to last 30 days
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });

  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [report, setReport] = useState<BarberPayoutsReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentKey = `${selectedBranchId}-${fromDate}-${toDate}`;
  const isLoading = Boolean(
    selectedBranchId && fromDate && toDate && loadedKey !== currentKey,
  );

  const fetchPayouts = useCallback(
    async (branchId: string, from: string, to: string) => {
      if (!branchId || !from || !to) return;
      try {
        const data = await api.reports.barberPayouts({
          branchId,
          from,
          to,
        });
        setReport(data);
        setError(null);
        setLoadedKey(`${branchId}-${from}-${to}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar liquidaciones');
        setReport(null);
        setLoadedKey(`${branchId}-${from}-${to}`);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedBranchId && fromDate && toDate) {
      let ignore = false;
      const key = `${selectedBranchId}-${fromDate}-${toDate}`;
      api.reports
        .barberPayouts({ branchId: selectedBranchId, from: fromDate, to: toDate })
        .then((data) => {
          if (!ignore) {
            setReport(data);
            setError(null);
            setLoadedKey(key);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setError(err instanceof Error ? err.message : 'Error al cargar liquidaciones');
            setReport(null);
            setLoadedKey(key);
          }
        });
      return () => {
        ignore = true;
      };
    }
  }, [selectedBranchId, fromDate, toDate]);

  const setPreset = (days: number) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - days);
    setFromDate(past.toISOString().slice(0, 10));
    setToDate(today.toISOString().slice(0, 10));
  };

  const selectedBranchName =
    branches.find((b) => b.id === selectedBranchId)?.name || 'Sucursal';

  const totalPayout = report
    ? report.totals.commission + report.totals.tips
    : 0;

  return (
    <div className="space-y-6">
      {/* Filter and Date Range Controls */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date range pickers */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-[11px] text-zinc-500">Desde</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
            <span className="text-[11px] text-zinc-500">Hasta</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPreset(0)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={() => setPreset(7)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
            >
              7 días
            </button>
            <button
              onClick={() => setPreset(15)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
            >
              15 días
            </button>
            <button
              onClick={() => setPreset(30)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
            >
              30 días
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPayouts(selectedBranchId, fromDate, toDate)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
          >
            Filtrar
          </button>
          {report && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <span className="text-xs font-semibold">
            Calculando comisiones acumuladas y propinas del periodo...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payouts Content */}
      {report && !isLoading && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold">Comisiones Acumuladas</span>
                <Percent className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                ${Number(report.totals.commission).toFixed(2)}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Total devengado por servicios y productos
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold">Propinas Recaudadas</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                +${Number(report.totals.tips).toFixed(2)}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Entregadas directamente a los barberos
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-linear-to-br from-amber-500/15 via-zinc-900 to-zinc-950 border border-amber-500/30">
              <div className="flex items-center justify-between text-amber-300 mb-2">
                <span className="text-xs font-semibold">Total a Liquidar</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                ${totalPayout.toFixed(2)}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {report.payouts.length} barberos activos en el periodo
              </p>
            </div>
          </div>

          {/* Barber Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  Desglose de Liquidación — {selectedBranchName}
                </h3>
              </div>
              <span className="text-xs text-zinc-500">
                Periodo: {fromDate} al {toDate}
              </span>
            </div>

            {report.payouts.length === 0 ? (
              <div className="py-16 text-center text-zinc-500">
                <Users className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                <p className="text-sm font-bold text-zinc-300">
                  Sin liquidaciones para este rango
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  No se encontraron tickets cobrados con asignación de personal en las fechas seleccionadas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3.5">Barbero</th>
                      <th className="px-5 py-3.5 text-center">Tickets Cobrados</th>
                      <th className="px-5 py-3.5 text-right">Comisión</th>
                      <th className="px-5 py-3.5 text-right">Propinas</th>
                      <th className="px-5 py-3.5 text-right">Monto a Liquidar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {report.payouts.map((p) => (
                      <tr key={p.barberId} className="hover:bg-zinc-800/30 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                              {p.barberName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-white">
                              {p.barberName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono text-zinc-300">
                          {p.tickets}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-amber-400 font-semibold">
                          ${Number(p.commission).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-emerald-400 font-semibold">
                          ${Number(p.tips).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-white font-black text-sm">
                          ${Number(p.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-950 font-bold border-t border-zinc-800 text-white">
                    <tr>
                      <td className="px-5 py-3">Total Consolidado</td>
                      <td className="px-5 py-3 text-center font-mono text-zinc-400">
                        {report.payouts.reduce((acc, p) => acc + p.tickets, 0)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-amber-400">
                        ${Number(report.totals.commission).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-emerald-400">
                        ${Number(report.totals.tips).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-amber-400 text-base">
                        ${totalPayout.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
