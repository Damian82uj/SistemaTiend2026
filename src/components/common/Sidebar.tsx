/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShoppingCart,
  Shirt,
  History,
  Repeat,
  Users,
  CreditCard,
  Truck,
  DollarSign,
  BarChart3,
  X,
  Wallet,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/formatters';

export type SectionKey =
  | 'sales'
  | 'inventory'
  | 'history'
  | 'exchanges'
  | 'clients'
  | 'debts'
  | 'purchases'
  | 'cash'
  | 'reports';

interface SidebarProps {
  currentSection: SectionKey;
  onSelectSection: (section: SectionKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { products, clients, settings, activeCashSession, getCurrentCashBalance } = useStore();
  const { cashInRegister } = getCurrentCashBalance();

  // Stock and debt alert counters
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const debtorsCount = clients.filter((c) => (c.currentDebt || 0) > 0).length;

  // The 9 commercial sections organized for daily boutique work (Punto de venta is #1)
  const menuItems: {
    id: SectionKey;
    label: string;
    number: string;
    icon: React.ElementType;
    badge?: number;
    badgeType?: 'alert' | 'info';
  }[] = [
    {
      id: 'sales',
      label: 'Punto de venta y cobros',
      number: '1',
      icon: ShoppingCart,
    },
    {
      id: 'inventory',
      label: 'Inventario y prendas',
      number: '2',
      icon: Shirt,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeType: 'alert',
    },
    {
      id: 'history',
      label: 'Historial de ventas',
      number: '3',
      icon: History,
    },
    {
      id: 'exchanges',
      label: 'Cambios y devoluciones',
      number: '4',
      icon: Repeat,
    },
    {
      id: 'clients',
      label: 'Clientes',
      number: '5',
      icon: Users,
    },
    {
      id: 'debts',
      label: 'Pagos pendientes y deudas',
      number: '6',
      icon: CreditCard,
      badge: debtorsCount > 0 ? debtorsCount : undefined,
      badgeType: 'info',
    },
    {
      id: 'purchases',
      label: 'Compras a proveedores',
      number: '7',
      icon: Truck,
    },
    {
      id: 'cash',
      label: 'Cuenta de caja',
      number: '8',
      icon: DollarSign,
    },
    {
      id: 'reports',
      label: 'Reportes y estadísticas',
      number: '9',
      icon: BarChart3,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#2D241E]/40 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container with soft boutique palette */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#FAF7F2] text-[#2D241E] flex flex-col border-r border-[#EADFD5] shadow-[2px_0_16px_rgba(110,83,66,0.03)] transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Boutique Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-[#EFE7DE] shrink-0 bg-[#FFFDF9]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C87D83] text-white flex items-center justify-center font-serif font-bold text-lg shadow-xs border border-[#C87D83]/20">
              A
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-[#2D241E] uppercase font-serif">
                {settings.storeName || 'Aura Boutique'}
              </div>
              <div className="text-[11px] text-[#8C6D58] font-medium tracking-wide">
                Gestión Comercial
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-[#8C6D58] hover:text-[#2D241E] hover:bg-[#F0EDE8] lg:hidden transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Register Pill Status */}
        <div className="px-4 py-3 border-b border-[#EFE7DE] bg-[#FDFBF7] shrink-0">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EBE3DA]">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeCashSession ? 'bg-[#4F725B]' : 'bg-[#C87D83]'
                }`}
              />
              <span className="text-xs font-medium text-[#4A3E36]">
                Cuenta de caja:
              </span>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                activeCashSession
                  ? 'bg-[#ECF3EE] text-[#4F725B]'
                  : 'bg-[#F9EFF0] text-[#C87D83]'
              }`}
            >
              {activeCashSession ? 'Turno Abierto' : 'Cerrada'}
            </span>
          </div>
        </div>

        {/* Nav Links in EXACT ordered list (1 to 9) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentSection === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all text-left group cursor-pointer ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#C87D83] font-semibold shadow-xs border border-[#E3D7CB]'
                    : 'text-[#6B5E55] hover:bg-[#F3EFEA] hover:text-[#2D241E]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span
                    className={`text-[10px] w-4 text-center shrink-0 font-medium ${
                      isActive ? 'text-[#C87D83]' : 'text-[#A39589]'
                    }`}
                  >
                    {item.number}.
                  </span>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#C87D83]' : 'text-[#8C6D58] group-hover:text-[#2D241E]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      item.badgeType === 'alert'
                        ? 'bg-[#F9EFF0] text-[#C87D83] border border-[#F3D6D8]'
                        : 'bg-[#F1EFF7] text-[#786591] border border-[#E0D8ED]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: Quick Register Cash Balance info */}
        <div className="p-4 border-t border-[#EFE7DE] shrink-0 bg-[#FFFDF9]/80">
          <button
            onClick={() => {
              onSelectSection('cash');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EBE3DA] hover:border-[#C87D83]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#ECF3EE] text-[#4F725B] flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] text-[#8C6D58] font-medium leading-tight">
                  Saldo en Cajón Físico
                </div>
                <div className="text-xs font-bold text-[#2D241E] tabular-nums font-mono">
                  {formatCurrency(cashInRegister, settings.currencySymbol)}
                </div>
              </div>
            </div>
            <span className="text-[11px] text-[#C87D83] font-medium">Ver caja</span>
          </button>
        </div>
      </aside>
    </>
  );
};
