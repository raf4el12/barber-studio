'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import type { PerformanceSummary } from '@/types/api';
import { Scissors, DollarSign, Award, Wallet, RefreshCw } from 'lucide-react';

export function PerformanceWidget({
  branchId,
  lastUpdated,
}: {
  branchId: string | null;
  lastUpdated?: number;
}) {
  const [data, setData] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!branchId) return;
    let ignore = false;
    api.performance
      .get(branchId)
      .then((res) => {
        if (!ignore) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [branchId, lastUpdated]);

  const handleManualRefresh = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await api.performance.get(branchId);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Award className="h-4 w-4 text-amber-500" />
          Mi Rendimiento (Turno Actual)
        </h2>
        <button
          onClick={() => void handleManualRefresh()}
          title="Actualizar métricas"
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs">Cortes</span>
            <Scissors className="h-3.5 w-3.5 text-zinc-500" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            {data?.completedTurns ?? 0}
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs">Comisiones</span>
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-xl font-bold text-emerald-400 tracking-tight">
            S/ {Number(data?.totalCommission ?? 0).toFixed(2)}
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs">Propinas</span>
            <Wallet className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <span className="text-xl font-bold text-amber-400 tracking-tight">
            S/ {Number(data?.totalTips ?? 0).toFixed(2)}
          </span>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-300/80 mb-1">
            <span className="text-xs font-semibold">Total Neto</span>
            <Award className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span className="text-xl font-black text-amber-400 tracking-tight">
            S/ {Number(data?.netPayout ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
