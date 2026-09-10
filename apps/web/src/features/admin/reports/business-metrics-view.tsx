'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Building2,
  Calendar,
  DollarSign,
  Scissors,
  Users,
  Loader2,
  AlertTriangle,
  BarChart3,
  Flame,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Branch, BusinessMetricsReport } from '@/types/api';

interface BusinessMetricsViewProps {
  branches: Branch[];
  initialBranchId?: string;
}

export function BusinessMetricsView({
  branches,
  initialBranchId,
}: BusinessMetricsViewProps) {
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
  const [report, setReport] = useState<BusinessMetricsReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentKey = `${selectedBranchId}-${fromDate}-${toDate}`;
  const isLoading = Boolean(
    selectedBranchId && fromDate && toDate && loadedKey !== currentKey,
  );

  const fetchMetrics = useCallback(
    async (branchId: string, from: string, to: string) => {
      if (!branchId || !from || !to) return;
      try {
        const data = await api.reports.metrics({
          branchId,
          from,
          to,
        });
        setReport(data);
        setError(null);
        setLoadedKey(`${branchId}-${from}-${to}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar métricas');
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
        .metrics({ branchId: selectedBranchId, from: fromDate, to: toDate })
        .then((data) => {
          if (!ignore) {
            setReport(data);
            setError(null);
            setLoadedKey(key);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setError(err instanceof Error ? err.message : 'Error al cargar métricas');
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

  // Aggregated KPIs
  const summaryStats = useMemo(() => {
    if (!report || report.dailyVolume.length === 0) {
      return { totalRevenue: 0, totalTickets: 0, avgTicket: 0, topService: null };
    }

    const totalRevenue = report.dailyVolume.reduce((acc, d) => acc + d.revenue, 0);
    const totalTickets = report.dailyVolume.reduce((acc, d) => acc + d.tickets, 0);
    const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;
    const topService = report.topServices.length > 0 ? report.topServices[0] : null;

    return { totalRevenue, totalTickets, avgTicket, topService };
  }, [report]);

  // Max revenue for bar chart scaling
  const maxRevenue = useMemo(() => {
    if (!report || report.dailyVolume.length === 0) return 1;
    const max = Math.max(...report.dailyVolume.map((d) => d.revenue));
    return max > 0 ? max : 1;
  }, [report]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
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

          {/* Date range */}
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

          {/* Quick presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPreset(7)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
            >
              7d
            </button>
            <button
              onClick={() => setPreset(15)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
            >
              15d
            </button>
            <button
              onClick={() => setPreset(30)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
            >
              30d
            </button>
            <button
              onClick={() => setPreset(90)}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
            >
              90d
            </button>
          </div>
        </div>

        <button
          onClick={() => fetchMetrics(selectedBranchId, fromDate, toDate)}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
        >
          Filtrar
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <span className="text-xs font-semibold">
            Generando analítica de negocio, servicios estrella y productividad...
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

      {/* Metrics Content */}
      {report && !isLoading && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold">Facturación Total</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                ${summaryStats.totalRevenue.toFixed(2)}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Periodo seleccionado
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold">Tickets Cobrados</span>
                <Scissors className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {summaryStats.totalTickets}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Atenciones completadas
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold">Ticket Promedio</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400 font-mono">
                ${summaryStats.avgTicket.toFixed(2)}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Gasto medio por cliente
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold">Servicio Estrella</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-sm font-bold text-white truncate">
                {summaryStats.topService ? summaryStats.topService.serviceName : '—'}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block truncate">
                {summaryStats.topService
                  ? `${summaryStats.topService.quantity} veces ($${summaryStats.topService.revenue.toFixed(2)})`
                  : 'Sin datos'}
              </span>
            </div>
          </div>

          {/* Daily Volume Bar Chart */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  Evolución Diaria de Facturación y Tickets
                </h3>
              </div>
              <span className="text-xs text-zinc-400">
                {report.dailyVolume.length} días con actividad
              </span>
            </div>

            {report.dailyVolume.length === 0 ? (
              <p className="text-xs text-zinc-500 py-12 text-center">
                No hay actividad registrada en el rango de fechas seleccionado.
              </p>
            ) : (
              <div>
                {/* Visual Bar Chart */}
                <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 overflow-x-auto border-b border-zinc-800">
                  {report.dailyVolume.map((d) => {
                    const heightPercent = Math.max(
                      8,
                      Math.round((d.revenue / maxRevenue) * 100),
                    );

                    return (
                      <div
                        key={d.date}
                        className="flex-1 min-w-[28px] max-w-[48px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap shadow-xl">
                          <span className="font-bold text-amber-400">${d.revenue.toFixed(2)}</span>
                          <span className="text-zinc-400"> · {d.tickets} tickets</span>
                        </div>

                        {/* Bar */}
                        <div
                          className="w-full bg-linear-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300 rounded-t-md transition-all duration-200"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-axis dates sample */}
                <div className="flex justify-between text-[10px] text-zinc-500 pt-2 font-mono">
                  <span>{report.dailyVolume[0]?.date}</span>
                  {report.dailyVolume.length > 2 && (
                    <span>
                      {
                        report.dailyVolume[
                          Math.floor(report.dailyVolume.length / 2)
                        ]?.date
                      }
                    </span>
                  )}
                  <span>
                    {report.dailyVolume[report.dailyVolume.length - 1]?.date}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Two-column layout: Top Services & Top Barbers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Services */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  Top Servicios Más Solicitados
                </h3>
              </div>

              {report.topServices.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">
                  Sin servicios cobrados en este periodo.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.topServices.map((s, idx) => {
                    const topQty = report.topServices[0]?.quantity || 1;
                    const pct = Math.round((s.quantity / topQty) * 100);

                    return (
                      <div
                        key={s.serviceId}
                        className="p-3 bg-zinc-950 rounded-xl border border-zinc-800"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300 flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {s.serviceName}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-amber-400 font-mono">
                              ${Number(s.revenue).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-zinc-500 ml-2 font-mono">
                              ({s.quantity}x)
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Barbers by Performance */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  Ranking de Productividad de Barberos
                </h3>
              </div>

              {report.topBarbers.length === 0 ? (
                <p className="text-xs text-zinc-500 py-8 text-center">
                  Sin registros de atención de personal en este periodo.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.topBarbers.map((b, idx) => (
                    <div
                      key={b.barberId}
                      className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : idx === 1
                                ? 'bg-zinc-700/50 text-zinc-200 border border-zinc-600'
                                : idx === 2
                                  ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                                  : 'bg-zinc-900 text-zinc-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {b.barberName}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {b.tickets} tickets atendidos · ${Number(b.tips).toFixed(2)} en propinas
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-white block">
                          ${Number(b.total).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          Comisión: ${Number(b.commission).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
