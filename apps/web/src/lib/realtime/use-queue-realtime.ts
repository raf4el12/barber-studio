'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api/client';
import type { QueueEntry } from '@/types/api';

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

interface UseQueueRealtimeResult {
  entries: QueueEntry[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useQueueRealtime(
  branchId: string | null,
  token: string | null,
): UseQueueRealtimeResult {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!(branchId && token));
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!branchId || !token) {
      return;
    }

    let ignore = false;
    api.queue
      .list({ branchId, status: ['WAITING', 'IN_PROGRESS'] })
      .then((data) => {
        if (!ignore) {
          setEntries(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          if (err instanceof Error) setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [branchId, token]);

  const refresh = useCallback(async () => {
    if (!branchId || !token) return;
    try {
      const data = await api.queue.list({
        branchId,
        status: ['WAITING', 'IN_PROGRESS'],
      });
      setEntries(data);
    } catch {
      // Silent catch on polling refresh
    }
  }, [branchId, token]);

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
      setError(`Error de conexión WS: ${err.message}`);
    });

    socket.on(
      'queue.updated',
      (payload: { branchId: string; entries: QueueEntry[] }) => {
        if (payload.branchId === branchId) {
          setEntries(payload.entries);
        }
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [branchId, token]);

  return {
    entries,
    isConnected,
    isLoading,
    error,
    refresh,
  };
}
