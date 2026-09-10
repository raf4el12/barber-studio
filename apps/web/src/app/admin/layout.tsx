'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Scissors,
  Layers,
  Boxes,
  Users,
  Percent,
  DollarSign,
  LogOut,
  Building2,
  Loader2,
  ShieldAlert,
  Award,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  // Strictly OWNER can access backoffice administration
  if (user.role !== 'OWNER') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Acceso Restringido</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          El panel de Administración y Configuración Maestra está reservado exclusivamente para los propietarios y administradores generales.
        </p>
        <div className="flex gap-3">
          {user.role === 'CASHIER' ? (
            <Link
              href="/pos"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition"
            >
              Ir a Estación POS
            </Link>
          ) : (
            <Link
              href="/barber/queue"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition"
            >
              Ir a Mi Cola de Atención
            </Link>
          )}
        </div>
      </div>
    );
  }

  const navLinks = [
    {
      href: '/admin/catalog',
      label: 'Catálogo Maestro',
      icon: <Layers className="w-4 h-4" />,
      active: pathname.startsWith('/admin/catalog'),
    },
    {
      href: '/admin/inventory',
      label: 'Inventario y Stock',
      icon: <Boxes className="w-4 h-4" />,
      active: pathname.startsWith('/admin/inventory'),
    },
    {
      href: '/admin/staff',
      label: 'Personal y Sedes',
      icon: <Users className="w-4 h-4" />,
      active: pathname.startsWith('/admin/staff'),
    },
    {
      href: '/admin/commissions',
      label: 'Comisiones',
      icon: <Percent className="w-4 h-4" />,
      active: pathname.startsWith('/admin/commissions'),
    },
    {
      href: '/admin/customers',
      label: 'Clientes y Puntos',
      icon: <Award className="w-4 h-4" />,
      active: pathname.startsWith('/admin/customers'),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-lg px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
              <Scissors className="h-5 w-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight leading-none">
                  Barber Studio
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-semibold border border-zinc-700/80">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                <Building2 className="h-3 w-3 text-zinc-500" />
                <span>{user.name}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-amber-400 font-medium">Propietario</span>
              </div>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  link.active
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Operational Links & Logout */}
          <div className="flex items-center gap-2">
            <Link
              href="/pos"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Caja / POS</span>
            </Link>

            <Link
              href="/barber/queue"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              <span>Cola Barberos</span>
            </Link>

            <button
              onClick={logout}
              title="Cerrar sesión"
              className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center gap-1 mt-3 pt-2 border-t border-zinc-800/80 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition ${
                link.active
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white bg-zinc-900'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 text-zinc-400 hover:text-white bg-zinc-900"
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>POS</span>
          </Link>
          <Link
            href="/barber/queue"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 text-zinc-400 hover:text-white bg-zinc-900"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Cola</span>
          </Link>
        </div>
      </header>

      {/* Main Backoffice Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
