'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Tag,
  Ban,
  Clock,
  Receipt,
  Search,
} from 'lucide-react';
import type { Ticket, Role } from '@/types/api';

interface PendingTicketsQueueProps {
  tickets: Ticket[];
  userRole: Role;
  hasActiveRegister: boolean;
  onCheckout: (ticket: Ticket) => void;
  onDiscount: (ticket: Ticket) => void;
  onVoid: (ticket: Ticket) => void;
}

export function PendingTicketsQueue({
  tickets,
  userRole,
  hasActiveRegister,
  onCheckout,
  onDiscount,
  onVoid,
}: PendingTicketsQueueProps) {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'PARTIALLY_PAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'OPEN' && t.status !== 'OPEN') return false;
    if (filter === 'PARTIALLY_PAID' && t.status !== 'PARTIALLY_PAID') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (t.code || '').toLowerCase().includes(q);
      const matchBarber = (t.barberId || '').toLowerCase().includes(q);
      return matchCode || matchBarber;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header controls & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              filter === 'ALL'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('OPEN')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              filter === 'OPEN'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Abiertos ({tickets.filter((t) => t.status === 'OPEN').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('PARTIALLY_PAID')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              filter === 'PARTIALLY_PAID'
                ? 'bg-blue-500/20 text-blue-300 shadow-sm border border-blue-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Parciales ({tickets.filter((t) => t.status === 'PARTIALLY_PAID').length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-500">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-semibold text-zinc-300">
              No hay tickets pendientes por cobrar
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Los tickets generados por los barberos en sus estaciones aparecerán en esta lista en tiempo real.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((t) => {
            const isPartial = t.status === 'PARTIALLY_PAID';
            const createdTime = t.createdAt
              ? new Date(t.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '--:--';

            return (
              <div
                key={t.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between space-y-4 transition shadow-lg group relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isPartial ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                />

                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-base">
                        {t.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isPartial
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isPartial ? 'Pago Parcial' : 'Abierto'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{createdTime}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                      Total a Cobrar
                    </span>
                    <span className="font-mono text-lg font-bold text-amber-400">
                      S/ {Number(t.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Subtotals & Discounts Info */}
                <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-lg p-2.5 text-xs space-y-1 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono text-zinc-300">
                      S/ {Number(t.subtotal).toFixed(2)}
                    </span>
                  </div>
                  {Number(t.discountAmount) > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Descuento:</span>
                      <span className="font-mono">
                        - S/ {Number(t.discountAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>IGV (18%):</span>
                    <span className="font-mono text-zinc-300">
                      S/ {Number(t.taxAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => onCheckout(t)}
                    disabled={!hasActiveRegister}
                    className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Cobrar
                  </button>

                  <button
                    type="button"
                    onClick={() => onDiscount(t)}
                    title="Aplicar Descuento"
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>

                  {userRole === 'OWNER' && (
                    <button
                      type="button"
                      onClick={() => onVoid(t)}
                      title="Anular Ticket (Solo Dueño)"
                      className="p-2 bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-300 rounded-lg border border-zinc-700 hover:border-red-800 transition cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
