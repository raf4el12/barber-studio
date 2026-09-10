'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useQueueRealtime } from '@/lib/realtime/use-queue-realtime';
import { api } from '@/lib/api/client';
import type { QueueEntry } from '@/types/api';
import { PerformanceWidget } from '@/features/barber-portal/performance-widget';
import { ActiveTurnCard } from '@/features/barber-portal/active-turn-card';
import { QueueBoard } from '@/features/barber-portal/queue-board';
import { AddWalkinModal } from '@/features/barber-portal/add-walkin-modal';
import { CreateTicketModal } from '@/features/barber-portal/create-ticket-modal';
import { Scissors, LogOut, Radio, Loader2, Building2 } from 'lucide-react';

export default function BarberQueuePage() {
  const router = useRouter();
  const { user, token, branchId, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { entries, isConnected, refresh } = useQueueRealtime(
    branchId,
    token,
  );

  const [metricsKey, setMetricsKey] = useState<number>(0);
  const [isWalkinOpen, setIsWalkinOpen] = useState<boolean>(false);
  const [ticketModalEntry, setTicketModalEntry] = useState<QueueEntry | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  // Active turn = IN_PROGRESS assigned to this barber
  const activeTurn =
    entries.find(
      (e) => e.status === 'IN_PROGRESS' && e.assignedBarberId === user?.id,
    ) || null;

  // Actions
  const handleStartTurn = async (entry: QueueEntry) => {
    await api.queue.changeStatus(entry.id, 'IN_PROGRESS');
    await refresh();
    setMetricsKey(Date.now());
  };

  const handleClaimTurn = async (entry: QueueEntry) => {
    if (!user) return;
    await api.queue.assign(entry.id, user.id);
    await api.queue.changeStatus(entry.id, 'IN_PROGRESS');
    await refresh();
    setMetricsKey(Date.now());
  };

  const handleCancelTurn = async (entry: QueueEntry) => {
    await api.queue.changeStatus(entry.id, 'CANCELLED');
    await refresh();
  };

  const handleOpenTicketModal = (entry: QueueEntry) => {
    setTicketModalEntry(entry);
  };

  const handleTicketCreated = async () => {
    await refresh();
    setMetricsKey(Date.now());
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
              <Scissors className="h-4 w-4 -rotate-45" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                Barber Studio
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                <Building2 className="h-3 w-3 text-zinc-500" />
                <span>{user?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              <Radio
                className={`h-3 w-3 ${
                  isConnected ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'
                }`}
              />
              <span className="hidden sm:inline">
                {isConnected ? 'En Vivo' : 'Conectando'}
              </span>
            </div>

            <button
              onClick={logout}
              title="Cerrar sesión"
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
        {/* Real-time KPI Widget */}
        <PerformanceWidget branchId={branchId} lastUpdated={metricsKey} />

        {/* Customer in Chair Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 px-1">
            Mi Sillón de Atención
          </h2>
          <ActiveTurnCard
            entry={activeTurn}
            onComplete={handleOpenTicketModal}
          />
        </div>

        {/* Waiting List Board */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 px-1">
            Lista de Espera del Local
          </h2>
          <QueueBoard
            entries={entries}
            currentUserId={user?.id || ''}
            onStartTurn={handleStartTurn}
            onClaimTurn={handleClaimTurn}
            onCancelTurn={handleCancelTurn}
            onAddWalkin={() => setIsWalkinOpen(true)}
            hasActiveTurn={!!activeTurn}
          />
        </div>
      </main>

      {/* Modals */}
      {branchId && user && (
        <AddWalkinModal
          isOpen={isWalkinOpen}
          onClose={() => setIsWalkinOpen(false)}
          currentBarberId={user.id}
          branchId={branchId}
          onAdded={async () => {
            await refresh();
          }}
        />
      )}

      {branchId && (
        <CreateTicketModal
          isOpen={!!ticketModalEntry}
          onClose={() => setTicketModalEntry(null)}
          entry={ticketModalEntry}
          branchId={branchId}
          onTicketCreated={handleTicketCreated}
        />
      )}
    </div>
  );
}
