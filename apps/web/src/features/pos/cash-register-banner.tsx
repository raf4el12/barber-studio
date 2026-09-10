'use client';

import React from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import type { CashRegister } from '@/types/api';

interface CashRegisterBannerProps {
  register: CashRegister | null;
  onOpenClick: () => void;
  onCloseClick: () => void;
}

export function CashRegisterBanner({
  register,
  onOpenClick,
  onCloseClick,
}: CashRegisterBannerProps) {
  const isOpen = !!register && !register.closedAt;

  if (isOpen) {
    const openedTime = register.openedAt
      ? new Date(register.openedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--:--';

    return (
      <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-300">Caja Abierta</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Turno Activo
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              Fondo inicial:{' '}
              <span className="text-zinc-200 font-semibold font-mono">
                S/ {Number(register.openingAmount).toFixed(2)}
              </span>{' '}
              · Apertura: <span className="text-zinc-300">{openedTime}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseClick}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-sm font-medium rounded-lg border border-zinc-700 transition flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Lock className="w-4 h-4 text-amber-400" />
          Cerrar Turno (Arqueo)
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-300">Caja Cerrada</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              Requiere Apertura
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Abre la caja con el fondo inicial en efectivo para habilitar el cobro de tickets en el POS.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenClick}
        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm rounded-lg transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer self-stretch sm:self-auto justify-center"
      >
        <Unlock className="w-4 h-4" />
        Abrir Caja
      </button>
    </div>
  );
}
