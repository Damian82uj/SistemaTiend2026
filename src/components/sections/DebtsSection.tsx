/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  CheckCircle,
  Clock,
  Printer,
  FileText,
  User,
  ArrowRight,
  X,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Client, DebtPayment } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import { ReceiptModal } from '../common/ReceiptModal';

export const DebtsSection: React.FC = () => {
  const { clients, debtPayments, sales, settings, recordDebtPayment } = useStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'receipts'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Modal
  const [selectedClientForPay, setSelectedClientForPay] = useState<Client | null>(null);
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [paymentNotes, setPaymentNotes] = useState<string>('Abono a cuenta corriente');

  // Receipt Modal
  const [completedReceipt, setCompletedReceipt] = useState<DebtPayment | null>(null);

  // Debt statistics
  const debtorClients = clients.filter((c) => (c.currentDebt || 0) > 0);
  const totalPendingDebt = debtorClients.reduce((acc, c) => acc + (c.currentDebt || 0), 0);
  const totalCollectedDebt = debtPayments.reduce((acc, p) => acc + p.amount, 0);

  const handleOpenPayment = (client: Client) => {
    setSelectedClientForPay(client);
    setAmountToPay(client.currentDebt || 0);
    setPaymentMethod('efectivo');
    setPaymentNotes('Abono a cuenta corriente');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPay) return;

    const res = recordDebtPayment({
      clientId: selectedClientForPay.id,
      amount: Number(amountToPay),
      paymentMethod,
      notes: paymentNotes,
    });

    if (res.success && res.receipt) {
      setCompletedReceipt(res.receipt);
      setSelectedClientForPay(null);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'pending') {
      const rows = debtorClients.map((c) => ({
        Cliente: c.name,
        Telefono: c.phone,
        Email: c.email || '',
        Deuda_Pendiente: c.currentDebt,
        Limite_Credito: c.creditLimit || 0,
        Fecha_Registro: c.createdAt,
      }));
      exportToCSV(`deudas_pendientes_${new Date().toISOString().split('T')[0]}`, rows);
    } else {
      const rows = debtPayments.map((p) => ({
        Recibo: p.receiptNumber,
        Cliente: p.clientName,
        Fecha: p.date,
        Monto_Abonado: p.amount,
        Metodo: p.paymentMethod,
        Saldo_Anterior: p.previousBalance,
        Saldo_Restante: p.newBalance,
        Cobrado_Por: p.cashierName,
      }));
      exportToCSV(`recibos_pagos_deuda_${new Date().toISOString().split('T')[0]}`, rows);
    }
  };

  const filteredDebtors = debtorClients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReceipts = debtPayments.filter(
    (p) =>
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Monto Total Pendiente por Cobrar</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#C87D83] mt-1 tabular-nums">
            {formatCurrency(totalPendingDebt, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-[#8C6D58] mt-0.5">
            En <span className="font-semibold text-[#2D241E]">{debtorClients.length}</span> cuentas corrientes
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Total Cobranzas Realizadas</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#4F725B] mt-1 tabular-nums">
            {formatCurrency(totalCollectedDebt, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-[#8C6D58] mt-0.5">
            Registrado en <span className="font-semibold text-[#2D241E]">{debtPayments.length}</span> pagos de cuotas
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Promedio de Deuda por Cuenta</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#2D241E] mt-1 tabular-nums">
            {formatCurrency(
              debtorClients.length > 0 ? Math.round(totalPendingDebt / debtorClients.length) : 0,
              settings.currencySymbol
            )}
          </div>
          <div className="text-[11px] text-[#8C6D58] mt-0.5">Límite sugerido configurable en ficha</div>
        </div>
      </div>

      {/* Tabs & Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#EADFD5] shadow-2xs overflow-hidden">
        {/* Navigation & Search Bar */}
        <div className="p-4 border-b border-[#EFE7DE] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFDF9]/60">
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1.5 rounded-xl border border-[#EBE3DA]">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-[#C87D83] text-white shadow-2xs'
                  : 'text-[#6E5342] hover:text-[#2D241E]'
              }`}
            >
              Cuentas Pendientes ({debtorClients.length})
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'receipts'
                  ? 'bg-[#C87D83] text-white shadow-2xs'
                  : 'text-[#6E5342] hover:text-[#2D241E]'
              }`}
            >
              Recibos de Pago Emitidos ({debtPayments.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#A39589] absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente o recibo..."
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-[#E3D7CB] rounded-xl outline-hidden focus:border-[#C87D83] bg-white text-[#2D241E] placeholder-[#A39589]"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#6E5342] bg-[#F5EFEB] hover:bg-[#EFE7DE] rounded-xl border border-[#E3D7CB] transition-colors shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PENDING DEBTS */}
        {activeTab === 'pending' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/75 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3 text-right">Saldo Deudor</th>
                  <th className="px-4 py-3">Última Operación / Compras</th>
                  <th className="px-4 py-3 text-right">Acción de Cobranza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredDebtors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-400">
                      ¡Excelente! No hay clientes con saldos deudores pendientes en este momento.
                    </td>
                  </tr>
                ) : (
                  filteredDebtors.map((client) => {
                    const clientSales = sales.filter((s) => s.clientId === client.id);
                    const lastSale = clientSales[0];

                    return (
                      <tr key={client.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">
                          {client.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-700 whitespace-nowrap">
                          {client.phone}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-red-600 text-sm tabular-nums whitespace-nowrap">
                          {formatCurrency(client.currentDebt || 0, settings.currencySymbol)}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 max-w-xs">
                          {lastSale ? (
                            <div>
                              <span className="font-semibold text-neutral-900">
                                {lastSale.operationNumber}
                              </span>{' '}
                              · {formatDate(lastSale.date)}
                              <div className="text-[11px] text-neutral-500 truncate">
                                {lastSale.notes || 'Venta a cuenta corriente'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-neutral-400">Saldo migrado o inicial</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenPayment(client)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors"
                          >
                            Registrar Cobro
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: RECEIPTS HISTORY */}
        {activeTab === 'receipts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/75 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nro Recibo</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Forma de Cobro</th>
                  <th className="px-4 py-3 text-right">Saldo Previo</th>
                  <th className="px-4 py-3 text-right">Monto Abonado</th>
                  <th className="px-4 py-3 text-right">Saldo Restante</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      Aún no se han emitido recibos de cobranza.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((rcp) => (
                    <tr key={rcp.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {rcp.receiptNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">
                        {rcp.clientName}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                        {formatDate(rcp.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize text-neutral-700">
                        {rcp.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-neutral-500 tabular-nums whitespace-nowrap">
                        {formatCurrency(rcp.previousBalance, settings.currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                        {formatCurrency(rcp.amount, settings.currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(rcp.newBalance, settings.currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setCompletedReceipt(rcp)}
                          className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                        >
                          Ver Recibo
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: RECORD PAYMENT */}
      {selectedClientForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Cobro de Saldo de Cuenta Corriente</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Cliente: {selectedClientForPay.name}</p>
              </div>
              <button
                onClick={() => setSelectedClientForPay(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="p-3 bg-red-50 text-red-900 rounded-lg flex justify-between text-xs">
                <span>Deuda Total Pendiente:</span>
                <span className="font-mono font-bold">
                  {formatCurrency(selectedClientForPay.currentDebt || 0, settings.currencySymbol)}
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-neutral-700">Monto a Cobrar ($) *</label>
                  <button
                    type="button"
                    onClick={() => setAmountToPay(selectedClientForPay.currentDebt || 0)}
                    className="text-[11px] text-neutral-900 underline font-medium"
                  >
                    Saldar total
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  max={selectedClientForPay.currentDebt || 999999}
                  required
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-mono border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Medio de Pago *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition-colors ${
                      paymentMethod === 'efectivo'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Efectivo (Entra a Caja)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition-colors ${
                      paymentMethod === 'transferencia'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Transferencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition-colors ${
                      paymentMethod === 'tarjeta'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Tarjeta
                  </button>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg flex justify-between text-xs">
                <span className="text-neutral-600">Saldo pendiente restante:</span>
                <span className="font-mono font-bold text-neutral-900">
                  {formatCurrency(
                    Math.max(0, (selectedClientForPay.currentDebt || 0) - amountToPay),
                    settings.currencySymbol
                  )}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Detalle o Concepto</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setSelectedClientForPay(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={amountToPay <= 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg disabled:opacity-50"
                >
                  Confirmar Cobro y Emitir Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {completedReceipt && (
        <ReceiptModal
          isOpen={!!completedReceipt}
          onClose={() => setCompletedReceipt(null)}
          data={{ type: 'debtPayment', receipt: completedReceipt }}
        />
      )}
    </div>
  );
};
