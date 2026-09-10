'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Scissors,
  Layers,
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Service, ServiceCategory, Product } from '@/types/api';
import { ServiceModal } from '@/features/admin/catalog/service-modal';
import { CategoryModal } from '@/features/admin/catalog/category-modal';
import { ProductModal } from '@/features/admin/catalog/product-modal';

type ActiveTab = 'services' | 'categories' | 'products';

export default function CatalogAdminPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [svcData, catData, prodData] = await Promise.all([
        api.catalog.getServices(),
        api.catalog.getCategories(),
        api.products.list(),
      ]);
      setServices(svcData);
      setCategories(catData);
      setProducts(prodData);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.catalog.getServices(),
      api.catalog.getCategories(),
      api.products.list(),
    ]).then(([svcData, catData, prodData]) => {
      if (!ignore) {
        setServices(svcData);
        setCategories(catData);
        setProducts(prodData);
        setIsLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Delete Handlers
  const handleDeleteService = async (service: Service) => {
    if (!window.confirm(`¿Seguro que deseas dar de baja el servicio "${service.name}"?`)) return;
    try {
      await api.catalog.deleteService(service.id);
      await loadData();
      showToast(`Servicio "${service.name}" eliminado del catálogo.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar servicio.');
    }
  };

  const handleDeleteCategory = async (category: ServiceCategory) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la categoría "${category.name}"?`)) return;
    try {
      await api.catalog.deleteCategory(category.id);
      await loadData();
      showToast(`Categoría "${category.name}" eliminada.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar categoría.');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`¿Seguro que deseas dar de baja el producto "${product.name}"?`)) return;
    try {
      await api.products.delete(product.id);
      await loadData();
      showToast(`Producto "${product.name}" eliminado del catálogo.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar producto.');
    }
  };

  // Filtered Services
  const filteredServices = services.filter((s) => {
    if (selectedCategoryFilter !== 'ALL' && s.categoryId !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      return s.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Filtered Categories
  const filteredCategories = categories.filter((c) => {
    if (searchQuery.trim()) {
      return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-emerald-900/90 border border-emerald-500 text-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Catálogo Maestro
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Administración centralizada de servicios, categorías y productos para venta
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'services' && (
            <button
              type="button"
              onClick={() => {
                setEditingService(null);
                setServiceModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Servicio
            </button>
          )}

          {activeTab === 'categories' && (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          )}

          {activeTab === 'products' && (
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Tab Selectors & Search Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('services');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'services'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Servicios ({services.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('categories');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categorías ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'products'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Productos ({products.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown Filter for Services Tab */}
          {activeTab === 'services' && (
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Search bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en catálogo..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs">Cargando catálogo...</p>
        </div>
      ) : (
        <>
          {/* 1. SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/60 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="p-3.5">Servicio</th>
                      <th className="p-3.5">Categoría</th>
                      <th className="p-3.5">Duración</th>
                      <th className="p-3.5">Precio (S/)</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredServices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                          No se encontraron servicios registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredServices.map((svc) => {
                        const cat = categories.find((c) => c.id === svc.categoryId);
                        return (
                          <tr key={svc.id} className="hover:bg-zinc-800/30 transition">
                            <td className="p-3.5 font-medium text-white">
                              <div>{svc.name}</div>
                              {svc.description && (
                                <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                                  {svc.description}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 text-zinc-300">
                              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-[11px]">
                                {cat?.name || 'General'}
                              </span>
                            </td>
                            <td className="p-3.5 text-zinc-400 font-mono">
                              {svc.durationMinutes || 30} min
                            </td>
                            <td className="p-3.5 font-mono font-bold text-amber-400">
                              S/ {Number(svc.price).toFixed(2)}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  svc.isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                }`}
                              >
                                {svc.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingService(svc);
                                  setServiceModalOpen(true);
                                }}
                                title="Editar Servicio"
                                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteService(svc)}
                                title="Eliminar Servicio"
                                className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          )}

          {/* 2. CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.length === 0 ? (
                <div className="col-span-full p-12 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
                  No hay categorías registradas.
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const associatedServices = services.filter((s) => s.categoryId === cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                            <span className="text-[11px] text-zinc-500">
                              {associatedServices.length} servicios asociados
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryModalOpen(true);
                            }}
                            title="Editar Categoría"
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteCategory(cat)}
                            title="Eliminar Categoría"
                            className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 3. PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/60 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="p-3.5">SKU</th>
                      <th className="p-3.5">Producto</th>
                      <th className="p-3.5">Costo (S/)</th>
                      <th className="p-3.5">Precio Venta (S/)</th>
                      <th className="p-3.5">Margen</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-500">
                          No se encontraron productos retail registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => {
                        const priceNum = Number(prod.price);
                        const costNum = prod.cost !== null && prod.cost !== undefined ? Number(prod.cost) : null;
                        const marginPercent = costNum !== null && costNum > 0
                          ? Math.round(((priceNum - costNum) / costNum) * 100)
                          : null;

                        return (
                          <tr key={prod.id} className="hover:bg-zinc-800/30 transition">
                            <td className="p-3.5 font-mono text-zinc-400">
                              {prod.sku || '—'}
                            </td>
                            <td className="p-3.5 font-medium text-white">
                              <div>{prod.name}</div>
                              {prod.description && (
                                <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                                  {prod.description}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-zinc-400">
                              {costNum !== null ? `S/ ${costNum.toFixed(2)}` : '—'}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-amber-400">
                              S/ {priceNum.toFixed(2)}
                            </td>
                            <td className="p-3.5 font-mono">
                              {marginPercent !== null ? (
                                <span className={marginPercent >= 50 ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
                                  +{marginPercent}%
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  prod.isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                }`}
                              >
                                {prod.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setProductModalOpen(true);
                                }}
                                title="Editar Producto"
                                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteProduct(prod)}
                                title="Eliminar Producto"
                                className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          )}
        </>
      )}

      {/* Modals */}
      <ServiceModal
        service={editingService}
        categories={categories}
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onSuccess={async () => {
          await loadData();
          showToast(editingService ? 'Servicio actualizado.' : 'Servicio creado.');
        }}
      />

      <CategoryModal
        category={editingCategory}
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={async () => {
          await loadData();
          showToast(editingCategory ? 'Categoría actualizada.' : 'Categoría creada.');
        }}
      />

      <ProductModal
        product={editingProduct}
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSuccess={async () => {
          await loadData();
          showToast(editingProduct ? 'Producto actualizado.' : 'Producto creado.');
        }}
      />
    </div>
  );
}
