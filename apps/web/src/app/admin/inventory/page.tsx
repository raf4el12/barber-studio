'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  ArrowUpDown,
  Sliders,
  AlertTriangle,
  Search,
  CheckCircle2,
  Loader2,
  Building2,
  Package,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import type { InventoryItem, Product, Branch } from '@/types/api';
import { MovementModal } from '@/features/admin/inventory/movement-modal';
import { ThresholdModal } from '@/features/admin/inventory/threshold-modal';

export default function InventoryAdminPage() {
  const { branchId: userBranchId } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [selectedItemForThreshold, setSelectedItemForThreshold] = useState<InventoryItem | null>(null);

  // Initial load of branches and products
  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.branches.list(),
      api.products.list(),
    ]).then(([branchList, prodList]) => {
      if (!ignore) {
        setBranches(branchList);
        setProducts(prodList);
        const activeId = userBranchId || (branchList.length > 0 ? branchList[0].id : '');
        setSelectedBranchId(activeId);
      }
    });

    return () => {
      ignore = true;
    };
  }, [userBranchId]);

  // Load inventory whenever selectedBranchId changes
  const loadInventory = useCallback(async (bId: string) => {
    if (!bId) return;
    try {
      const data = await api.inventory.list(bId);
      setInventory(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    let ignore = false;
    api.inventory
      .list(selectedBranchId)
      .then((data) => {
        if (!ignore) {
          setInventory(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedBranchId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // KPIs
  const totalStockUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = inventory.filter(
    (item) => item.quantity <= item.lowStockThreshold,
  ).length;

  // Filter items
  const filteredInventory = inventory.filter((item) => {
    if (onlyLowStock && item.quantity > item.lowStockThreshold) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.product?.name || '').toLowerCase().includes(q);
      const matchSku = (item.product?.sku || '').toLowerCase().includes(q);
      return matchName || matchSku;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-emerald-900/90 border border-emerald-500 text-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header & Branch Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Inventario y Control de Stock
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gestión multisede de existencias físicas, movimientos auditados y alertas mínimas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch selector */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-amber-500" />
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setIsLoading(true);
              }}
              className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                  Sucursal: {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedProductForMovement(null);
              setMovementModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" />
            Registrar Movimiento
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Productos en Sucursal
            </span>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {inventory.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Unidades Físicas Totales
            </span>
            <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {totalStockUnits}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Alertas de Bajo Stock
            </span>
            <p
              className={`text-2xl font-bold font-mono mt-1 ${
                lowStockCount > 0 ? 'text-red-400' : 'text-zinc-500'
              }`}
            >
              {lowStockCount}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
              lowStockCount > 0
                ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyLowStock(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              !onlyLowStock
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({inventory.length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyLowStock(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              onlyLowStock
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'text-zinc-400 hover:text-red-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Críticos / Alertas ({lowStockCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por producto o SKU..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Producto</th>
                <th className="p-3.5">Stock Físico</th>
                <th className="p-3.5">Umbral Alerta</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    Cargando inventario de la sucursal...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500">
                    No se encontraron registros de inventario para esta sucursal.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.quantity <= item.lowStockThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                      <td className="p-3.5 font-mono text-zinc-400">
                        {item.product?.sku || '—'}
                      </td>
                      <td className="p-3.5 font-medium text-white">
                        <div>{item.product?.name || item.productId}</div>
                        {item.product?.price && (
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            PVP: S/ {Number(item.product.price).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-base font-bold">
                        <span className={isLow ? 'text-red-400' : 'text-zinc-100'}>
                          {item.quantity} unidades
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-400">
                        Min. {item.lowStockThreshold}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isLow
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isLow ? 'Stock Crítico' : 'Normal'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductForMovement(item.product || null);
                            setMovementModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium rounded-lg border border-zinc-700 transition cursor-pointer"
                        >
                          Ajustar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItemForThreshold(item);
                            setThresholdModalOpen(true);
                          }}
                          className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                          title="Configurar Umbral de Alerta"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedBranchId && (
        <MovementModal
          branchId={selectedBranchId}
          products={products}
          selectedProduct={selectedProductForMovement}
          isOpen={movementModalOpen}
          onClose={() => setMovementModalOpen(false)}
          onSuccess={async () => {
            await loadInventory(selectedBranchId);
            showToast('Movimiento de stock registrado.');
          }}
        />
      )}

      {selectedBranchId && selectedItemForThreshold && (
        <ThresholdModal
          item={selectedItemForThreshold}
          branchId={selectedBranchId}
          isOpen={thresholdModalOpen}
          onClose={() => setThresholdModalOpen(false)}
          onSuccess={async () => {
            await loadInventory(selectedBranchId);
            showToast('Umbral de seguridad actualizado.');
          }}
        />
      )}
    </div>
  );
}
