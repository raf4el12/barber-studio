'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api/client';
import type { CashRegister, Ticket } from '@/types/api';

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

interface UsePosRealtimeResult {
  tickets: Ticket[];
  activeRegister: CashRegister | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refreshTickets: () => Promise<void>;
  refreshRegister: () => Promise<void>;
  setActiveRegister: (register: CashRegister | null) => void;
}

export function usePosRealtime(
  branchId: string | null,
  token: string | null,
): UsePosRealtimeResult {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!(branchId && token));
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchActiveRegister = useCallback(async (bId: string) => {
    try {
      const reg = await api.cashRegisters.getActive(bId);
      setActiveRegister(reg);
    } catch {
      setActiveRegister(null);
    }
  }, []);

  const fetchPendingTickets = useCallback(async (bId: string) => {
    try {
      const all = await api.tickets.list({ branchId: bId });
      // Only keep tickets that are waiting for payment
      const pending = all.filter(
        (t) => t.status === 'OPEN' || t.status === 'PARTIALLY_PAID',
      );
      setTickets(pending);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, []);

  useEffect(() => {
    if (!branchId || !token) {
      return;
    }

    let ignore = false;
    Promise.all([
      api.cashRegisters.getActive(branchId).catch(() => null),
      api.tickets.list({ branchId }).catch(() => []),
    ]).then(([reg, all]) => {
      if (!ignore) {
        setActiveRegister(reg);
        const pending = all.filter(
          (t) => t.status === 'OPEN' || t.status === 'PARTIALLY_PAID',
        );
        setTickets(pending);
        setIsLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [branchId, token]);

  const refreshTickets = useCallback(async () => {
    if (!branchId) return;
    await fetchPendingTickets(branchId);
  }, [branchId, fetchPendingTickets]);

  const refreshRegister = useCallback(async () => {
    if (!branchId) return;
    await fetchActiveRegister(branchId);
  }, [branchId, fetchActiveRegister]);

  useEffect(() => {
    if (!branchId || !token) {
      return;
    }

    const socket = io(WS_BASE, {
      auth: { token },
      query: { branchId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setIsConnected(false);
      setError(`Error WS: ${err.message}`);
    });

    socket.on('ticket.created', (payload: { ticket: Ticket }) => {
      if (!payload?.ticket || payload.ticket.branchId !== branchId) return;
      setTickets((prev) => {
        if (prev.some((t) => t.id === payload.ticket.id)) return prev;
        return [payload.ticket, ...prev];
      });
    });

    socket.on('ticket.updated', (payload: { ticket: Ticket }) => {
      if (!payload?.ticket || payload.ticket.branchId !== branchId) return;
      setTickets((prev) => {
        const idx = prev.findIndex((t) => t.id === payload.ticket.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = payload.ticket;
          return next;
        }
        if (payload.ticket.status === 'OPEN' || payload.ticket.status === 'PARTIALLY_PAID') {
          return [payload.ticket, ...prev];
        }
        return prev;
      });
    });

    socket.on('ticket.paid', (payload: { ticket: Ticket }) => {
      if (!payload?.ticket) return;
      setTickets((prev) => prev.filter((t) => t.id !== payload.ticket.id));
    });

    socket.on('ticket.voided', (payload: { ticket: Ticket }) => {
      if (!payload?.ticket) return;
      setTickets((prev) => prev.filter((t) => t.id !== payload.ticket.id));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [branchId, token]);

  return {
    tickets,
    activeRegister,
    isConnected,
    isLoading,
    error,
    refreshTickets,
    refreshRegister,
    setActiveRegister,
  };
}
