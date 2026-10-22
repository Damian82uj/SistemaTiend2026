/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Calendar } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SectionKey } from './Sidebar';
import { formatCurrency } from '../../utils/formatters';

interface HeaderProps {
  currentSection: SectionKey;
  onOpenMobileSidebar: () => void;
  onNavigateSection?: (section: SectionKey) => void;
}

const SECTION_TITLES: Record<SectionKey, { title: string; subtitle: string }> = {
  sales: { title: 'Punto de Venta y Cobros', subtitle: 'Atención al cliente, cobro ágil y emisión de tickets' },
  inventory: { title: 'Inventario y Registro de Ropa', subtitle: 'Catálogo de prendas, talles, colores y control de stock' },
  history: { title: 'Historial de Ventas', subtitle: 'Detalle cronológico de todas las operaciones realizadas' },
  exchanges: { title: 'Cambios y Devoluciones', subtitle: 'Gestión de prendas, notas de crédito y diferencias' },
  clients: { title: 'Clientes', subtitle: 'Fichero de clientes, historial de compras y cuentas' },
  debts: { title: 'Pagos Pendientes y Deudas', subtitle: 'Control de saldos fiados y cobros a cuenta' },
  purchases: { title: 'Compras a Proveedores', subtitle: 'Recepción de mercadería, facturas y costos' },
  cash: { title: 'Cuenta de Caja', subtitle: 'Arqueo de caja, entradas, salidas y control del turno' },
  reports: { title: 'Reportes y Estadísticas', subtitle: 'Métricas de ventas, rotación de prendas y balances' },
};

export const Header: React.FC<HeaderProps> = ({ currentSection, onOpenMobileSidebar, onNavigateSection }) => {
  const { getCurrentCashBalance, settings, activeCashSession } = useStore();
  const { cashInRegister } = getCurrentCashBalance();

  const sectionInfo = SECTION_TITLES[currentSection] || {
    title: 'Aura Boutique',
    subtitle: 'Sistema de Gestión Comercial',
  };

  // Formatted current date in Spanish
  const todayDateFormatted = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="h-20 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EADFD5] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors">
      {/* Zone 1: Mobile toggle & Breadcrumb Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-1 text-[#6B5E55] hover:text-[#2D241E] hover:bg-[#F3EFEA] rounded-xl lg:hidden transition-colors cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-[#2D241E] tracking-tight truncate font-serif">
            {sectionInfo.title}
          </h1>
          <p className="text-xs text-[#8C6D58] hidden sm:block truncate mt-0.5">
            {sectionInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Zone 2: Date + Quick Cash indicator */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Current Date Display */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-[#FFFFFF] border border-[#EBE3DA] rounded-xl text-xs text-[#6B5E55] shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-[#C87D83]" />
          <span className="capitalize">{todayDateFormatted}</span>
        </div>

        {/* Cuenta de Caja Pill / Quick Access */}
        <button
          onClick={() => onNavigateSection && onNavigateSection('cash')}
          className="flex items-center gap-2.5 px-3.5 py-2 bg-[#FFFFFF] hover:bg-[#FDFBF7] border border-[#E3D7CB] hover:border-[#C87D83]/50 rounded-xl text-xs text-left shadow-2xs transition-all cursor-pointer"
          title="Ver Cuenta de Caja"
        >
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeCashSession ? 'bg-[#4F725B]' : 'bg-[#C87D83]'}`} />
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-[#8C6D58] font-medium leading-tight">
              Cuenta de Caja
            </span>
            <span className="font-mono font-bold text-[#2D241E] tabular-nums text-xs">
              {formatCurrency(cashInRegister, settings.currencySymbol)}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
