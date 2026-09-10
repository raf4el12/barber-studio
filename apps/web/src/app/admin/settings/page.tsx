'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Branch } from '@/types/api';
import { SystemSettingsView } from '@/features/admin/settings/system-settings-view';
import { AuditLogsView } from '@/features/admin/settings/audit-logs-view';

type SettingsTab = 'parameters' | 'audit';

export default function SettingsAdminPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('parameters');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api.branches
      .list()
      .then((data) => {
        if (!ignore) {
          setBranches(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Error al cargar sucursales');
          setIsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Configuración y Auditoría
            </h1>
            <p className="text-xs text-zinc-400">
              Ajuste de parámetros tributarios y de comisiones, y trazabilidad de operaciones críticas.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('parameters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'parameters'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Parámetros del Sistema</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pista de Auditoría</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <span className="text-xs font-semibold">Cargando módulos de configuración...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div>
          {activeTab === 'parameters' && <SystemSettingsView branches={branches} />}
          {activeTab === 'audit' && <AuditLogsView branches={branches} />}
        </div>
      )}
    </div>
  );
}
