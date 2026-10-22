/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Calendar,
  Package,
  Layers,
  ArrowUpRight,
  CreditCard,
  Percent,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, exportToCSV } from '../../utils/formatters';

export const ReportsSection: React.FC = () => {
  const { sales, products, cashMovements, clients, purchases, settings } = useStore();
  const { can, isAdmin } = useAuth();

  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Filter sales, cash movements by timeframe
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    return sales.filter((s) => {
      if (s.status !== 'completada') return false;
      const sDate = new Date(s.date);
      if (timeframe === 'today') return s.date.startsWith(todayStr);
      if (timeframe === 'week') return sDate >= weekAgo;
      if (timeframe === 'month') return sDate >= monthAgo;
      if (timeframe === 'year') return sDate >= yearAgo;
      return true;
    });
  }, [sales, timeframe]);

  // Aggregate stats
  const totalBilled = filteredSales.reduce((acc, s) => acc + s.total, 0);

  // COGS (Costo de las prendas vendidas)
  const totalCOGS = filteredSales.reduce((acc, s) => {
    return acc + s.items.reduce((itemAcc, item) => itemAcc + item.costPrice * item.quantity, 0);
  }, 0);

  // Estimated gross profit
  const grossProfit = totalBilled - totalCOGS;

  // Actual cash collected for this timeframe
  const totalAmountPaid = filteredSales.reduce((acc, s) => acc + s.amountPaid, 0);

  // Expenses in cash movements
  const totalExpenses = cashMovements
    .filter((m) => m.type === 'egreso' && m.category === 'gasto_operativo')
    .reduce((acc, m) => acc + m.amount, 0);

  const netEstimatedProfit = grossProfit - totalExpenses;

  // Top 5 Best Selling Garments
  const bestsellerMap: Record<
    string,
    { name: string; code: string; units: number; revenue: number }
  > = {};

  for (const s of filteredSales) {
    for (const it of s.items) {
      if (!bestsellerMap[it.productId]) {
        bestsellerMap[it.productId] = {
          name: it.productName,
          code: it.productCode,
          units: 0,
          revenue: 0,
        };
      }
      bestsellerMap[it.productId].units += it.quantity;
      bestsellerMap[it.productId].revenue += it.subtotal;
    }
  }

  const topProducts = Object.values(bestsellerMap)
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  // Sales by Category
  const categoryMap: Record<string, number> = {};
  for (const s of filteredSales) {
    for (const it of s.items) {
      categoryMap[it.category] = (categoryMap[it.category] || 0) + it.subtotal;
    }
  }

  // Payment methods breakdown
  const paymentBreakdown: Record<string, number> = {};
  for (const s of filteredSales) {
    paymentBreakdown[s.paymentMethod] = (paymentBreakdown[s.paymentMethod] || 0) + s.total;
  }

  // Exports
  const handleExportSales = () => {
    const rows = filteredSales.map((s) => ({
      Operacion: s.operationNumber,
      Fecha: s.date,
      Cliente: s.clientName || 'Cliente Salón',
      Prendas: s.items.map((i) => `${i.quantity}x ${i.productName}`).join('; '),
      Subtotal: s.subtotal,
      Descuento: s.discountAmount,
      Total: s.total,
      Metodo_Pago: s.paymentMethod,
      Abonado: s.amountPaid,
      Saldo_Pendiente: s.pendingBalance,
      Cajero: s.cashierName,
    }));
    exportToCSV(`reporte_ventas_${timeframe}_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Timeframe Selector & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="bg-[#FFFFFF] p-1.5 rounded-2xl border border-[#EADFD5] flex items-center gap-1.5 w-fit shadow-2xs">
          <button
            onClick={() => setTimeframe('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'today' ? 'bg-[#C87D83] text-white shadow-2xs' : 'text-[#6E5342] hover:text-[#2D241E] hover:bg-[#FAF7F2]'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'week' ? 'bg-[#C87D83] text-white shadow-2xs' : 'text-[#6E5342] hover:text-[#2D241E] hover:bg-[#FAF7F2]'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'month' ? 'bg-[#C87D83] text-white shadow-2xs' : 'text-[#6E5342] hover:text-[#2D241E] hover:bg-[#FAF7F2]'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'year' ? 'bg-[#C87D83] text-white shadow-2xs' : 'text-[#6E5342] hover:text-[#2D241E] hover:bg-[#FAF7F2]'
            }`}
          >
            Año
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'all' ? 'bg-[#C87D83] text-white shadow-2xs' : 'text-[#6E5342] hover:text-[#2D241E] hover:bg-[#FAF7F2]'
            }`}
          >
            Histórico Completo
          </button>
        </div>

        <button
          onClick={handleExportSales}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#6E5342] bg-[#F5EFEB] border border-[#E3D7CB] hover:bg-[#EFE7DE] rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Reporte a Excel/CSV</span>
        </button>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Facturación Total (Ventas)</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#2D241E] mt-1 tabular-nums">
            {formatCurrency(totalBilled, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-[#8C6D58] mt-1">
            En <span className="font-semibold text-[#2D241E]">{filteredSales.length}</span> tickets emitidos
          </div>
        </div>

        {/* Amount Actually Paid */}
        <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Dinero Efectivamente Cobrado</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#4F725B] mt-1 tabular-nums">
            {formatCurrency(totalAmountPaid, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {totalBilled > 0 ? Math.round((totalAmountPaid / totalBilled) * 100) : 100}% del total cobrado
          </div>
        </div>

        {/* COGS (Admin only) */}
        {can('canViewCosts') && (
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Costo de Mercadería Vendida (COGS)</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 mt-1 tabular-nums">
              {formatCurrency(totalCOGS, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">Costo al por mayor de lo vendido</div>
          </div>
        )}

        {/* Estimated Gross Margin (Admin only) */}
        {can('canViewCosts') && (
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Ganancia Bruta Estimada</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 mt-1 tabular-nums">
              {formatCurrency(grossProfit, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Margen Bruto:{' '}
              <strong className="text-neutral-900">
                {totalBilled > 0 ? Math.round((grossProfit / totalBilled) * 100) : 0}%
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Bestsellers & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Bestsellers */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900">Top 5 Prendas Más Vendidas</h3>
            <span className="text-[11px] text-neutral-400 font-mono">Por unidades</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No hay ventas registradas en este período.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-neutral-900">{prod.name}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{prod.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-neutral-900">{prod.units} unidades</div>
                    <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
                      {formatCurrency(prod.revenue, settings.currencySymbol)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales by Category */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900">Facturación por Categoría de Ropa</h3>
            <span className="text-[11px] text-neutral-400 font-mono">Volumen $</span>
          </div>

          {Object.keys(categoryMap).length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No hay datos para mostrar en este rango.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryMap).map(([cat, amount]) => {
                const percent = totalBilled > 0 ? Math.round((amount / totalBilled) * 100) : 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-neutral-800">{cat}</span>
                      <span className="font-mono font-bold text-neutral-900 tabular-nums">
                        {formatCurrency(amount, settings.currencySymbol)}{' '}
                        <span className="text-[10px] text-neutral-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="bg-neutral-900 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Distribución por Método de Cobro</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['efectivo', 'transferencia', 'tarjeta_debito', 'cuenta_corriente'].map((method) => {
            const amount = paymentBreakdown[method] || 0;
            const percent = totalBilled > 0 ? Math.round((amount / totalBilled) * 100) : 0;

            return (
              <div key={method} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {method.replace(/_/g, ' ')}
                </div>
                <div className="text-lg font-bold font-mono text-neutral-900 mt-1 tabular-nums">
                  {formatCurrency(amount, settings.currencySymbol)}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">{percent}% de la facturación</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
