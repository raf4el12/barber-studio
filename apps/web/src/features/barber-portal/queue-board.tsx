'use client';

import React, { useState } from 'react';
import type { QueueEntry } from '@/types/api';
import { Users, User, Play, X, Clock, Plus } from 'lucide-react';

export function QueueBoard({
  entries,
  currentUserId,
  onStartTurn,
  onClaimTurn,
  onCancelTurn,
  onAddWalkin,
  hasActiveTurn,
}: {
  entries: QueueEntry[];
  currentUserId: string;
  onStartTurn: (entry: QueueEntry) => Promise<void>;
  onClaimTurn: (entry: QueueEntry) => Promise<void>;
  onCancelTurn: (entry: QueueEntry) => Promise<void>;
  onAddWalkin: () => void;
  hasActiveTurn: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'assigned' | 'general'>('assigned');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const waitingEntries = entries.filter((e) => e.status === 'WAITING');

  const myAssigned = waitingEntries.filter(
    (e) => e.assignedBarberId === currentUserId,
  );
  const generalQueue = waitingEntries.filter(
    (e) => e.assignedBarberId === null,
  );

  const displayedList = activeTab === 'assigned' ? myAssigned : generalQueue;

  const handleStart = async (entry: QueueEntry) => {
    setActionLoadingId(entry.id);
    try {
      await onStartTurn(entry);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClaim = async (entry: QueueEntry) => {
    setActionLoadingId(entry.id);
    try {
      await onClaimTurn(entry);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (entry: QueueEntry) => {
    if (!confirm(`¿Deseas cancelar el turno #${entry.sequenceNumber}?`)) return;
    setActionLoadingId(entry.id);
    try {
      await onCancelTurn(entry);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Asignados</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'assigned'
                  ? 'bg-zinc-950 text-amber-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {myAssigned.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'general'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>General</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'general'
                  ? 'bg-zinc-950 text-amber-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {generalQueue.length}
            </span>
          </button>
        </div>

        <button
          onClick={onAddWalkin}
          className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-700/60 transition cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-amber-400" />
          <span>+ Cliente</span>
        </button>
      </div>

      {hasActiveTurn && (
        <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 text-center">
          ⚠️ Ya tienes un cliente en el sillón. Finaliza el turno actual antes de tomar otro.
        </div>
      )}

      {displayedList.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-xs">
          {activeTab === 'assigned'
            ? 'No tienes clientes asignados en espera actualmente.'
            : 'La cola general de espera está vacía.'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedList.map((entry) => {
            const isLoading = actionLoadingId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-3 flex items-center justify-between gap-3 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-amber-400 shrink-0">
                    #{String(entry.sequenceNumber).padStart(3, '0')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {entry.customerName || 'Cliente Walk-in'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {entry.customerPhone && (
                        <span>• {entry.customerPhone}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activeTab === 'assigned' ? (
                    <button
                      disabled={hasActiveTurn || isLoading}
                      onClick={() => void handleStart(entry)}
                      className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-zinc-950" />
                      <span>Atender</span>
                    </button>
                  ) : (
                    <button
                      disabled={hasActiveTurn || isLoading}
                      onClick={() => void handleClaim(entry)}
                      className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-zinc-950" />
                      <span>Tomar</span>
                    </button>
                  )}

                  <button
                    disabled={isLoading}
                    onClick={() => void handleCancel(entry)}
                    title="Cancelar turno"
                    className="text-zinc-600 hover:text-red-400 p-2 rounded-lg transition hover:bg-red-500/10 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
