/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  History,
  DollarSign,
  Edit2,
  X,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Client, Sale, DebtPayment } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ClientsSection: React.FC = () => {
  const { clients, sales, debtPayments, settings, addClient, updateClient, recordDebtPayment } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebt, setFilterDebt] = useState<'all' | 'withDebt' | 'clean'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [statementClient, setStatementClient] = useState<Client | null>(null);

  // Quick Debt Payment Modal
  const [paymentClient, setPaymentClient] = useState<Client | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [payNotes, setPayNotes] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 50000,
    notes: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 50000,
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      address: client.address || '',
      creditLimit: client.creditLimit || 50000,
      notes: client.notes || '',
    });
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Nombre y teléfono son obligatorios.');
      return;
    }

    addClient({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      creditLimit: Number(formData.creditLimit),
      notes: formData.notes.trim(),
    });

    setIsAddModalOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    updateClient(editingClient.id, {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      creditLimit: Number(formData.creditLimit),
      notes: formData.notes.trim(),
    });

    setEditingClient(null);
  };

  const handleOpenPayment = (client: Client) => {
    setPaymentClient(client);
    setPayAmount(client.currentDebt || 0);
    setPayMethod('efectivo');
    setPayNotes('Cobro de cuota de cuenta corriente');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentClient) return;

    recordDebtPayment({
      clientId: paymentClient.id,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      notes: payNotes,
    });

    setPaymentClient(null);
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchDebt = true;
    if (filterDebt === 'withDebt') matchDebt = (c.currentDebt || 0) > 0;
    if (filterDebt === 'clean') matchDebt = (c.currentDebt || 0) <= 0;

    return matchSearch && matchDebt;
  });

  // Client stats
  const totalDebtSum = clients.reduce((acc, c) => acc + (c.currentDebt || 0), 0);
  const debtorCount = clients.filter((c) => (c.currentDebt || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Total Clientes Registrados</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#2D241E] mt-1 tabular-nums">
            {clients.length} <span className="text-xs font-normal text-[#8C6D58]">fichas</span>
          </div>
          <div className="text-[11px] text-[#8C6D58] mt-0.5">Base de datos de clientes frecuentes</div>
        </div>

        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Clientes con Saldo Pendiente</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#C87D83] mt-1 tabular-nums">
            {debtorCount} <span className="text-xs font-normal text-[#8C6D58]">con deuda</span>
          </div>
          <div className="text-[11px] text-[#8C6D58] mt-0.5">Cuentas con compras fiadas o señas</div>
        </div>

        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Monto Total a Cobrar</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#2D241E] mt-1 tabular-nums">
            {formatCurrency(totalDebtSum, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-[#8C6D58] mt-0.5">Saldo pendiente exigible acumulado</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#EADFD5] shadow-2xs overflow-hidden">
        {/* Actions bar */}
        <div className="p-4 border-b border-[#EFE7DE] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFDF9]/60">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A39589] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente por nombre, teléfono o email..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-[#E3D7CB] rounded-xl outline-hidden focus:border-[#C87D83] bg-white text-[#2D241E] placeholder-[#A39589]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterDebt}
              onChange={(e) => setFilterDebt(e.target.value as any)}
              className="px-3 py-2 text-xs border border-[#E3D7CB] rounded-xl outline-hidden bg-white text-[#2D241E] cursor-pointer"
            >
              <option value="all">Todos los Clientes</option>
              <option value="withDebt">Con Deuda Pendiente</option>
              <option value="clean">Sin Deudas (Al Día)</option>
            </select>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#C87D83] hover:bg-[#B56C72] rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EFE7DE] text-[#8C6D58] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Nombre del Cliente</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3 text-right">Saldo Pendiente</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No se encontraron clientes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const hasDebt = (client.currentDebt || 0) > 0;

                  return (
                    <tr key={client.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">
                        {client.name}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 font-mono whitespace-nowrap">
                        {client.phone}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                        {client.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-[11px] max-w-[150px] truncate">
                        {client.address || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span className={hasDebt ? 'text-red-600 text-sm' : 'text-neutral-500'}>
                          {formatCurrency(client.currentDebt || 0, settings.currencySymbol)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {hasDebt ? (
                          <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                            Con Deuda
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Al Día
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDebt && (
                            <button
                              onClick={() => handleOpenPayment(client)}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                            >
                              Cobrar Cuota
                            </button>
                          )}
                          <button
                            onClick={() => setStatementClient(client)}
                            title="Ver ficha y cuenta corriente"
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            title="Editar datos"
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD CLIENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Registrar Nuevo Cliente</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Valeria Soria"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="11-4455-8910"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Dirección / Domicilio</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle, número, piso"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Límite de Crédito Disponible ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Notas u Observaciones</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Talle preferido, estilo, etc."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CLIENT */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Editar Cliente</h3>
              <button
                onClick={() => setEditingClient(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Límite de Crédito ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
                >
                  Actualizar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STATEMENT / HISTORIAL DEL CLIENTE */}
      {statementClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-neutral-200 shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Ficha y Estado de Cuenta: {statementClient.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Tel: {statementClient.phone} {statementClient.email ? `· ${statementClient.email}` : ''}
                </p>
              </div>
              <button
                onClick={() => setStatementClient(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balance Card */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between shrink-0 mb-4 text-xs">
              <div>
                <span className="text-neutral-500">Saldo actual adeudado:</span>
                <div className="text-lg font-bold font-mono text-red-600 tabular-nums">
                  {formatCurrency(statementClient.currentDebt || 0, settings.currencySymbol)}
                </div>
              </div>
              {(statementClient.currentDebt || 0) > 0 && (
                <button
                  onClick={() => {
                    handleOpenPayment(statementClient);
                    setStatementClient(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
                >
                  Registrar Cobro
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Sales associated with client */}
              <div>
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                  Compras Realizadas por el Cliente
                </h4>
                {sales.filter((s) => s.clientId === statementClient.id).length === 0 ? (
                  <div className="text-xs text-neutral-400 py-3">No hay compras asociadas aún.</div>
                ) : (
                  <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden text-xs">
                    {sales
                      .filter((s) => s.clientId === statementClient.id)
                      .map((sale) => (
                        <div key={sale.id} className="p-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900 font-mono">
                              {sale.operationNumber}
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              {formatDate(sale.date)} · {sale.items.length} prenda(s)
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-neutral-900 tabular-nums">
                              {formatCurrency(sale.total, settings.currencySymbol)}
                            </div>
                            {sale.pendingBalance > 0 && (
                              <div className="text-[10px] text-red-600 font-mono">
                                Saldo debiendo: {formatCurrency(sale.pendingBalance, settings.currencySymbol)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Debt payments made */}
              <div>
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                  Historial de Pagos y Cancelación de Deuda
                </h4>
                {debtPayments.filter((p) => p.clientId === statementClient.id).length === 0 ? (
                  <div className="text-xs text-neutral-400 py-3">No hay pagos de deuda registrados.</div>
                ) : (
                  <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden text-xs">
                    {debtPayments
                      .filter((p) => p.clientId === statementClient.id)
                      .map((pay) => (
                        <div key={pay.id} className="p-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900 font-mono">
                              Recibo {pay.receiptNumber}
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              {formatDate(pay.date)} · Método: {pay.paymentMethod}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-emerald-700 tabular-nums">
                              Abonó: {formatCurrency(pay.amount, settings.currencySymbol)}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              Saldo: {formatCurrency(pay.newBalance, settings.currencySymbol)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 text-right shrink-0 mt-4">
              <button
                onClick={() => setStatementClient(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PAYMENT MODAL */}
      {paymentClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Cobrar Saldo / Cuota de Deuda</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Cliente: {paymentClient.name}</p>
              </div>
              <button
                onClick={() => setPaymentClient(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="p-3 bg-red-50 text-red-900 rounded-lg flex justify-between text-xs">
                <span>Saldo Pendiente Actual:</span>
                <span className="font-mono font-bold">
                  {formatCurrency(paymentClient.currentDebt || 0, settings.currencySymbol)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Monto a Abonar ($) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={paymentClient.currentDebt || 999999}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Forma de Cobro *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('efectivo')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      payMethod === 'efectivo'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Efectivo (Caja)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('transferencia')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      payMethod === 'transferencia'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Transferencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('tarjeta')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      payMethod === 'tarjeta'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Tarjeta
                  </button>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg flex justify-between text-xs">
                <span className="text-neutral-600">Nuevo Saldo Restante:</span>
                <span className="font-mono font-bold text-neutral-900">
                  {formatCurrency(
                    Math.max(0, (paymentClient.currentDebt || 0) - payAmount),
                    settings.currencySymbol
                  )}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setPaymentClient(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payAmount <= 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg disabled:opacity-50"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
