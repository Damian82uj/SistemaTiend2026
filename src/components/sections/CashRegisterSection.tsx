/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DollarSign,
  PlusCircle,
  MinusCircle,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  X,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { CashMovement, CashSession } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';

export const CashRegisterSection: React.FC = () => {
  const {
    cashMovements,
    cashSessions,
    activeCashSession,
    settings,
    openCashRegister,
    closeCashRegister,
    addCashMovement,
    getCurrentCashBalance,
    sales,
  } = useStore();
  const { can, isAdmin, currentUser } = useAuth();

  // Modals
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  // Open session form
  const [initialCashInput, setInitialCashInput] = useState<number>(30000);
  const [openNotes, setOpenNotes] = useState<string>('Apertura de turno comercial');

  // Close session form
  const [countedCashInput, setCountedCashInput] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState<string>('');

  // Manual movement form
  const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('egreso');
  const [movementCategory, setMovementCategory] = useState<CashMovement['category']>('gasto_operativo');
  const [movementAmount, setMovementAmount] = useState<number>(5000);
  const [movementConcept, setMovementConcept] = useState<string>('');

  const { cashInRegister, digitalTotal } = getCurrentCashBalance();

  // Distinction calculations:
  // 1. Total ventas registradas
  const totalSalesVolume = sales
    .filter((s) => s.status === 'completada')
    .reduce((acc, s) => acc + s.total, 0);

  // 2. Cobros efectivamente recibidos en efectivo
  const cashFromSales = cashMovements
    .filter((m) => m.type === 'ingreso' && (m.category === 'venta_efectivo' || m.category === 'pago_deuda_efectivo'))
    .reduce((acc, m) => acc + m.amount, 0);

  // 3. Gastos y salidas de caja
  const cashOutflows = cashMovements
    .filter((m) => m.type === 'egreso')
    .reduce((acc, m) => acc + m.amount, 0);

  // Handlers
  const handleOpenRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = openCashRegister(Number(initialCashInput), openNotes);
    if (res.success) {
      setIsOpenModalOpen(false);
    }
  };

  const handleCloseRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = closeCashRegister(Number(countedCashInput), closeNotes);
    if (res.success) {
      setIsCloseModalOpen(false);
    }
  };

  const handleAddMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementConcept.trim() || movementAmount <= 0) {
      alert('Complete concepto y monto válido.');
      return;
    }
    const res = addCashMovement(movementType, movementCategory, Number(movementAmount), movementConcept.trim());
    if (res.success) {
      setIsMovementModalOpen(false);
      setMovementConcept('');
      setMovementAmount(5000);
    }
  };

  const handleExportCSV = () => {
    const rows = cashMovements.map((m) => ({
      Fecha: m.date,
      Tipo: m.type,
      Categoria: m.category,
      Monto: m.amount,
      Concepto: m.concept,
      Cajero: m.cashierName,
    }));
    exportToCSV(`movimientos_caja_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Session State Banner */}
      <div className="soft-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
              activeCashSession
                ? 'bg-[#ECF3EE] text-[#4F725B] border border-[#D1E1D5]'
                : 'bg-[#FAF0F1] text-[#C87D83] border border-[#F3D6D8]'
            }`}
          >
            {activeCashSession ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#2D241E] font-serif">
                {activeCashSession ? 'Cuenta de Caja Abierta' : 'Cuenta de Caja Cerrada'}
              </h2>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  activeCashSession ? 'bg-[#ECF3EE] text-[#4F725B]' : 'bg-[#FAF0F1] text-[#C87D83]'
                }`}
              >
                {activeCashSession ? 'Turno Activo' : 'Sin Turno'}
              </span>
            </div>
            <p className="text-xs text-[#8C6D58] mt-0.5">
              {activeCashSession
                ? `Abierta por ${activeCashSession.openedBy} el ${formatDate(activeCashSession.openedAt)} · Fondo inicial: ${formatCurrency(activeCashSession.initialCash, settings.currencySymbol)}`
                : 'Abra una sesión con fondo inicial para habilitar el control del turno comercial.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {activeCashSession ? (
            <>
              <button
                onClick={() => setIsMovementModalOpen(true)}
                className="flex-1 md:flex-initial px-3.5 py-2 text-xs font-semibold text-[#6E5342] bg-[#F5EFEB] hover:bg-[#EFE7DE] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#C87D83]" />
                <span>Registrar Entrada / Salida</span>
              </button>
              {can('canCloseCashRegister') && (
                <button
                  onClick={() => {
                    setCountedCashInput(cashInRegister);
                    setIsCloseModalOpen(true);
                  }}
                  className="flex-1 md:flex-initial px-4 py-2 text-xs font-semibold text-white bg-[#C87D83] hover:bg-[#B56C72] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Cierre de Caja (Arqueo)</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsOpenModalOpen(true)}
              className="w-full md:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#C87D83] hover:bg-[#B56C72] rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Nueva Cuenta de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo en Cajón Físico */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Efectivo en Cajón Físico</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
              {formatCurrency(cashInRegister, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Fondo inicial + cobros efectivo - egresos
            </div>
          </div>
        </div>

        {/* Card 2: Cobros Digitales */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Cobros Electrónicos / Banco</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
              {formatCurrency(digitalTotal, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Tarjetas y transferencias bancarias
            </div>
          </div>
        </div>

        {/* Card 3: Salidas de Caja y Gastos */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Egresos y Gastos de Caja</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <MinusCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-red-600 tabular-nums">
              {formatCurrency(cashOutflows, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Insumos, pagos de proveedor y retiros
            </div>
          </div>
        </div>

        {/* Card 4: Distinción Ventas vs Cobrado Real */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium">Ventas Totales Registradas</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 tabular-nums">
              {formatCurrency(totalSalesVolume, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Volumen bruto facturado en prendas
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Libro Diario de Movimientos de Caja</h3>
            <p className="text-xs text-neutral-500">
              Registro estricto de cada ingreso y egreso de efectivo físico
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100/75 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Concepto / Motivo</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {cashMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No hay movimientos registrados en la caja.
                  </td>
                </tr>
              ) : (
                cashMovements.map((mov) => {
                  const isIncome = mov.type === 'ingreso';

                  return (
                    <tr key={mov.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-neutral-600 whitespace-nowrap">
                        {formatDate(mov.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isIncome ? '+ Ingreso' : '- Egreso'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900 max-w-sm">
                        {mov.concept}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap capitalize text-[11px]">
                        {mov.category.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums whitespace-nowrap text-sm">
                        <span className={isIncome ? 'text-emerald-700' : 'text-red-600'}>
                          {isIncome ? '+' : '-'}
                          {formatCurrency(mov.amount, settings.currencySymbol)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{mov.cashierName}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: OPEN REGISTER */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Apertura de Caja</h3>
              <button
                onClick={() => setIsOpenModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Fondo Inicial de Cambio ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(Number(e.target.value))}
                  placeholder="30000"
                  className="w-full px-3 py-2 text-base font-mono border border-neutral-300 rounded-lg outline-hidden"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Dinero con el que se inicia el turno en el cajón para dar cambio.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Notas de Turno</label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
                >
                  Abrir Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLOSE REGISTER (ARQUEO) */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Arqueo y Cierre de Caja</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Control de billetes contados vs saldo del sistema</p>
              </div>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-between text-xs">
                <span className="text-neutral-600">Efectivo Teórico del Sistema:</span>
                <span className="font-mono font-bold text-neutral-900">
                  {formatCurrency(cashInRegister, settings.currencySymbol)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Efectivo Físico Contado en Cajón ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-mono border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              {/* Difference feedback */}
              <div
                className={`p-3 rounded-lg text-xs flex justify-between items-center ${
                  countedCashInput - cashInRegister === 0
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : countedCashInput - cashInRegister > 0
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                <span>Diferencia de Arqueo:</span>
                <span className="font-mono font-bold">
                  {countedCashInput - cashInRegister === 0
                    ? 'Exacto (Sin diferencia)'
                    : countedCashInput - cashInRegister > 0
                    ? `Sobrante: +${formatCurrency(countedCashInput - cashInRegister, settings.currencySymbol)}`
                    : `Faltante: ${formatCurrency(countedCashInput - cashInRegister, settings.currencySymbol)}`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Observaciones de Cierre</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Detalles sobre billetes retirados o entrega de turno"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
                >
                  Confirmar y Cerrar Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL CASH MOVEMENT */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Registrar Entrada / Salida de Dinero</h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('egreso');
                      setMovementCategory('gasto_operativo');
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      movementType === 'egreso'
                        ? 'border-red-600 bg-red-600 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    - Salida / Egreso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('ingreso');
                      setMovementCategory('ingreso_manual');
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      movementType === 'ingreso'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    + Entrada / Ingreso
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Categoría</label>
                <select
                  value={movementCategory}
                  onChange={(e) => setMovementCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden bg-white"
                >
                  {movementType === 'egreso' ? (
                    <>
                      <option value="gasto_operativo">Gasto Operativo (Limpieza, insumos, merienda)</option>
                      <option value="retiro_caja">Retiro de Caja / Dueño</option>
                      <option value="pago_proveedor_efectivo">Pago a Proveedor en Efectivo</option>
                      <option value="devolucion_dinero_egreso">Reintegro / Devolución a Cliente</option>
                    </>
                  ) : (
                    <>
                      <option value="ingreso_manual">Ingreso Manual de Efectivo</option>
                      <option value="diferencia_cambio_ingreso">Cobro de Diferencia por Cambio</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Monto ($) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-mono border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Concepto o Motivo Detallado *
                </label>
                <input
                  type="text"
                  required
                  value={movementConcept}
                  onChange={(e) => setMovementConcept(e.target.value)}
                  placeholder="Ej. Compra de cintas, bolsas y artículos de limpieza"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
