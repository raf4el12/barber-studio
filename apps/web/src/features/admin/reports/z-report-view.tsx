'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Building2,
  Printer,
  Receipt,
  AlertTriangle,
  Loader2,
  Coins,
  Percent,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Branch, ZReportData } from '@/types/api';

interface ZReportViewProps {
  branches: Branch[];
  initialBranchId?: string;
}

export function ZReportView({ branches, initialBranchId }: ZReportViewProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    initialBranchId || (branches.length > 0 ? branches[0].id : ''),
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [report, setReport] = useState<ZReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentKey = `${selectedBranchId}-${selectedDate}`;
  const isLoading = Boolean(selectedBranchId && selectedDate && loadedKey !== currentKey);

  const fetchZReport = useCallback(async (branchId: string, date: string) => {
    if (!branchId || !date) return;
    try {
      const data = await api.reports.zReport({
        branchId,
        date,
      });
      setReport(data);
      setError(null);
      setLoadedKey(`${branchId}-${date}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar Arqueo Z');
      setReport(null);
      setLoadedKey(`${branchId}-${date}`);
    }
  }, []);

  useEffect(() => {
    if (selectedBranchId && selectedDate) {
      let ignore = false;
      const key = `${selectedBranchId}-${selectedDate}`;
      api.reports
        .zReport({ branchId: selectedBranchId, date: selectedDate })
        .then((data) => {
          if (!ignore) {
            setReport(data);
            setError(null);
            setLoadedKey(key);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setError(err instanceof Error ? err.message : 'Error al generar Arqueo Z');
            setReport(null);
            setLoadedKey(key);
          }
        });
      return () => {
        ignore = true;
      };
    }
  }, [selectedBranchId, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  const selectedBranchName =
    branches.find((b) => b.id === selectedBranchId)?.name || 'Sucursal';

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
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

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => fetchZReport(selectedBranchId, selectedDate)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
          >
            Actualizar
          </button>
        </div>

        {report && (
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Arqueo Z</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <span className="text-xs font-semibold">
            Consolidando datos y generando Arqueo Z-Report...
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

      {/* Report Body */}
      {report && !isLoading && (
        <div className="space-y-6 print:space-y-4 print:text-black">
          {/* Printable Header */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Z-Report Fiscal / Operativo
                </span>
                <span className="text-xs text-zinc-400">
                  {report.scope.kind === 'register' ? 'Por Sesión de Caja' : 'Cierre Diario'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {selectedBranchName}
              </h2>
              <p className="text-xs text-zinc-400">
                Fecha del informe:{' '}
                <strong className="text-zinc-200">{selectedDate}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-zinc-400 block">Total Recaudado</span>
              <span className="text-3xl font-black text-amber-400 font-mono">
                ${Number(report.totals.revenue).toFixed(2)}
              </span>
              <span className="text-[11px] text-zinc-500 block">
                {report.totals.tickets} tickets cobrados
              </span>
            </div>
          </div>

          {/* KPI Financial Breakdown Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Subtotal
              </span>
              <span className="text-lg font-bold text-white font-mono">
                ${Number(report.totals.subtotal).toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Descuentos
              </span>
              <span className="text-lg font-bold text-red-400 font-mono">
                -${Number(report.totals.discounts).toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Impuestos (IGV)
              </span>
              <span className="text-lg font-bold text-zinc-300 font-mono">
                ${Number(report.totals.tax).toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Propinas Recibidas
              </span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                +${Number(report.totals.tips).toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 col-span-2 lg:col-span-1">
              <span className="text-[11px] font-semibold text-amber-300 block mb-1">
                Ingreso Neto
              </span>
              <span className="text-lg font-black text-amber-400 font-mono">
                ${Number(report.totals.revenue).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Cash Drawer Reconciliation (if available) */}
          {report.cash && (
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Arqueo y Cuadre de Caja de Efectivo
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Conciliación de monto inicial vs ventas en efectivo
                    </p>
                  </div>
                </div>

                {report.cash.difference !== null && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      report.cash.difference === 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : report.cash.difference > 0
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {report.cash.difference === 0
                      ? 'Caja Cuadrada Exacta'
                      : report.cash.difference > 0
                        ? `Sobrante: +$${report.cash.difference.toFixed(2)}`
                        : `Faltante: -$${Math.abs(report.cash.difference).toFixed(2)}`}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 block mb-1">Efectivo Esperado</span>
                  <span className="text-base font-bold text-white font-mono">
                    ${Number(report.cash.expected).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    (Apertura + Cobros en efectivo)
                  </span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 block mb-1">Efectivo Contado</span>
                  <span className="text-base font-bold text-white font-mono">
                    {report.cash.counted !== null
                      ? `$${Number(report.cash.counted).toFixed(2)}`
                      : 'Pendiente de Cierre'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    (Declarado por cajero)
                  </span>
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 block mb-1">Diferencia</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      report.cash.difference === null
                        ? 'text-zinc-500'
                        : report.cash.difference === 0
                          ? 'text-emerald-400'
                          : report.cash.difference > 0
                            ? 'text-blue-400'
                            : 'text-red-400'
                    }`}
                  >
                    {report.cash.difference !== null
                      ? `$${Number(report.cash.difference).toFixed(2)}`
                      : '—'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    (Contado - Esperado)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Income By Payment Method */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-white">
                Ventas Desglosadas por Método de Pago
              </h3>
            </div>

            {report.incomeByMethod.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No se registraron pagos en esta fecha o sucursal.
              </p>
            ) : (
              <div className="space-y-3">
                {report.incomeByMethod.map((m) => {
                  const percentage =
                    report.totals.revenue > 0
                      ? Math.round((m.total / report.totals.revenue) * 100)
                      : 0;

                  return (
                    <div
                      key={m.methodCode}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {m.methodName}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            ({m.count} transacciones)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black font-mono text-amber-400">
                            ${Number(m.total).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-zinc-500 ml-2 font-semibold">
                            {percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Barber Payouts in Session */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  Liquidación de Comisiones y Propinas a Barberos
                </h3>
              </div>
              <span className="text-xs text-zinc-400">
                Total liquidable:{' '}
                <strong className="text-amber-400 font-mono">
                  $
                  {report.payouts
                    .reduce((acc, p) => acc + p.total, 0)
                    .toFixed(2)}
                </strong>
              </span>
            </div>

            {report.payouts.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No hubo tickets cobrados con asignación de barbero en este turno.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-2.5">Barbero</th>
                      <th className="px-4 py-2.5 text-center">Tickets</th>
                      <th className="px-4 py-2.5 text-right">Comisión Devengada</th>
                      <th className="px-4 py-2.5 text-right">Propinas</th>
                      <th className="px-4 py-2.5 text-right">Total a Liquidar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {report.payouts.map((p) => (
                      <tr key={p.barberId} className="hover:bg-zinc-800/30 transition">
                        <td className="px-4 py-3 font-semibold text-white">
                          {p.barberName}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-zinc-300">
                          {p.tickets}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-amber-400 font-semibold">
                          ${Number(p.commission).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-400 font-semibold">
                          ${Number(p.tips).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white font-bold">
                          ${Number(p.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
