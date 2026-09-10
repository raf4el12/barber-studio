'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Building2,
  Calendar,
  Filter,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  FileCode,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Branch, AuditLog } from '@/types/api';

interface AuditLogsViewProps {
  branches: Branch[];
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  TICKET_VOIDED: {
    label: 'Anulación de Ticket',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  COMMISSION_RULE_CHANGED: {
    label: 'Regla de Comisión',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  SETTING_CHANGED: {
    label: 'Configuración de Sistema',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  STOCK_ADJUSTED: {
    label: 'Ajuste de Stock / Kardex',
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  CASH_REGISTER_CLOSED: {
    label: 'Cierre de Caja',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  LOYALTY_REDEEMED: {
    label: 'Canje de Fidelidad',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  USER_ROLE_CHANGED: {
    label: 'Cambio de Rol / Sede',
    color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  },
};

export function AuditLogsView({ branches }: AuditLogsViewProps) {
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Selected Log for metadata inspection modal
  const [inspectedLog, setInspectedLog] = useState<AuditLog | null>(null);

  const currentKey = `${actionFilter}-${branchFilter}-${fromDate}-${toDate}-${page}`;
  const isLoading = loadedKey !== currentKey;

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.audit.list({
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        branchId: branchFilter !== 'ALL' ? branchFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        limit,
      });
      setLogs(res.data);
      setTotal(res.total);
      setError(null);
      setLoadedKey(`${actionFilter}-${branchFilter}-${fromDate}-${toDate}-${page}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar logs de auditoría');
      setLogs([]);
      setTotal(0);
      setLoadedKey(`${actionFilter}-${branchFilter}-${fromDate}-${toDate}-${page}`);
    }
  }, [actionFilter, branchFilter, fromDate, toDate, page, limit]);

  useEffect(() => {
    let ignore = false;
    const key = `${actionFilter}-${branchFilter}-${fromDate}-${toDate}-${page}`;
    api.audit
      .list({
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        branchId: branchFilter !== 'ALL' ? branchFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        limit,
      })
      .then((res) => {
        if (!ignore) {
          setLogs(res.data);
          setTotal(res.total);
          setError(null);
          setLoadedKey(key);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Error al cargar logs');
          setLogs([]);
          setTotal(0);
          setLoadedKey(key);
        }
      });
    return () => {
      ignore = true;
    };
  }, [actionFilter, branchFilter, fromDate, toDate, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const branchMap = new Map<string, string>();
  branches.forEach((b) => branchMap.set(b.id, b.name));

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Action Filter */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
            <Filter className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">
                Todas las Acciones Críticas
              </option>
              {Object.entries(ACTION_LABELS).map(([action, conf]) => (
                <option key={action} value={action} className="bg-zinc-900 text-white">
                  {conf.label}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">
                Todas las Sedes
              </option>
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
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
            <span className="text-[11px] text-zinc-500">-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
        >
          Actualizar
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <span className="text-xs font-semibold">
            Consultando registros inmutables de auditoría...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Table */}
      {!isLoading && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-white">
                Pista de Auditoría y Trazabilidad de Operaciones
              </h3>
            </div>
            <span className="text-xs text-zinc-500">
              Total eventos registrados: <strong className="text-zinc-300">{total}</strong>
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              <Shield className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-bold text-zinc-300">
                Sin eventos de auditoría registrados
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Las operaciones críticas (anulación de tickets, cambios de comisiones, cuadres de caja) se registrarán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="px-5 py-3.5">Fecha y Hora</th>
                    <th className="px-5 py-3.5">Acción Crítica</th>
                    <th className="px-5 py-3.5">Entidad / Ref</th>
                    <th className="px-5 py-3.5">Sede</th>
                    <th className="px-5 py-3.5">Usuario / Operador</th>
                    <th className="px-5 py-3.5 text-right">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {logs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || {
                      label: log.action,
                      color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                    };
                    const branchName = log.branchId
                      ? branchMap.get(log.branchId) || log.branchId
                      : 'Global';

                    return (
                      <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                        {/* Date */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-zinc-400 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{formatDate(log.createdAt)}</span>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${actionInfo.color}`}
                          >
                            {actionInfo.label}
                          </span>
                        </td>

                        {/* Entity */}
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-white">
                            {log.entityType || 'Sistema'}
                          </div>
                          {log.entityId && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ID: {log.entityId.slice(0, 10)}...
                            </span>
                          )}
                        </td>

                        {/* Branch */}
                        <td className="px-5 py-3.5 text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-zinc-500" />
                            <span>{branchName}</span>
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-5 py-3.5 text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-zinc-500" />
                            <span className="font-mono text-[11px]">
                              {log.userId ? `${log.userId.slice(0, 8)}...` : 'Sistema / Auto'}
                            </span>
                          </div>
                        </td>

                        {/* Metadata action */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setInspectedLog(log)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Ver detalles / diff de auditoría"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
              <span>
                Página <strong className="text-white">{page}</strong> de{' '}
                <strong className="text-white">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metadata Detail Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Detalle y Snapshot de Auditoría
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    Evento: {inspectedLog.action} · {formatDate(inspectedLog.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Entidad</span>
                  <span className="font-semibold text-white">
                    {inspectedLog.entityType || 'General'}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">ID de Entidad</span>
                  <span className="font-mono text-zinc-300 truncate block">
                    {inspectedLog.entityId || '—'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Metadata del Evento (Diff / Payload Inmutable)
                </span>
                <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-amber-400 overflow-x-auto max-h-72 leading-relaxed">
                  {JSON.stringify(inspectedLog.metadata, null, 2) || '{}'}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setInspectedLog(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
