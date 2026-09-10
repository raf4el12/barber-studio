'use client';

import React, { useEffect, useState } from 'react';
import type { QueueEntry } from '@/types/api';
import { UserCheck, Clock, CheckCircle2, Phone, FileText } from 'lucide-react';

export function ActiveTurnCard({
  entry,
  onComplete,
}: {
  entry: QueueEntry | null;
  onComplete: (entry: QueueEntry) => void;
}) {
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  useEffect(() => {
    if (!entry?.serviceStartTime) {
      const timer = setTimeout(() => setElapsedMinutes(0), 0);
      return () => clearTimeout(timer);
    }

    const calculateElapsed = () => {
      const start = new Date(entry.serviceStartTime!).getTime();
      const mins = Math.max(0, Math.floor((Date.now() - start) / 60000));
      setElapsedMinutes(mins);
    };

    const initialTimer = setTimeout(calculateElapsed, 0);
    const interval = setInterval(calculateElapsed, 15000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [entry?.serviceStartTime]);

  if (!entry) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/80 border-dashed rounded-2xl p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-zinc-800/60 flex items-center justify-center text-zinc-500 mx-auto mb-3">
          <UserCheck className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300">
          Sillón Disponible
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
          No tienes ningún cliente en atención en este momento. Toma un turno de la lista de espera abajo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 border-2 border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">
        En Progreso
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-500 font-mono">
              #{String(entry.sequenceNumber).padStart(3, '0')}
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {entry.customerName || 'Cliente Walk-in'}
            </h3>
          </div>
          {entry.customerPhone && (
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <Phone className="h-3 w-3 text-zinc-500" />
              {entry.customerPhone}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-amber-400 font-medium shrink-0 mt-4 sm:mt-0">
          <Clock className="h-3.5 w-3.5 animate-pulse" />
          <span>{elapsedMinutes} min</span>
        </div>
      </div>

      {entry.notes && (
        <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-2.5 mb-4 text-xs text-zinc-300 flex items-start gap-2">
          <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
          <span>{entry.notes}</span>
        </div>
      )}

      <button
        onClick={() => onComplete(entry)}
        className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer text-sm"
      >
        <CheckCircle2 className="h-4 w-4" />
        <span>Finalizar Servicio y Cobrar (POS)</span>
      </button>
    </div>
  );
}
