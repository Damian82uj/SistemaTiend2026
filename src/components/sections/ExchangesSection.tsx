/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Repeat,
  Search,
  Plus,
  ArrowRight,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText,
  Printer,
  X,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Sale, Product, ExchangeReturn, ExchangeItem, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ReceiptModal } from '../common/ReceiptModal';

export const ExchangesSection: React.FC = () => {
  const { sales, products, exchanges, settings, processExchange } = useStore();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Exchange Form Wizard
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [returnedItems, setReturnedItems] = useState<ExchangeItem[]>([]);
  const [replacementItems, setReplacementItems] = useState<ExchangeItem[]>([]);
  const [selectedReplacementProdId, setSelectedReplacementProdId] = useState<string>(products[0]?.id || '');
  const [replacementQuantity, setReplacementQuantity] = useState<number>(1);
  const [resolutionType, setResolutionType] = useState<
    'pago_diferencia' | 'devolucion_dinero' | 'saldo_a_favor' | 'cambio_directo'
  >('cambio_directo');
  const [differencePaymentMethod, setDifferencePaymentMethod] = useState<PaymentMethod>('efectivo');
  const [reason, setReason] = useState<string>('Cambio de talle');
  const [notes, setNotes] = useState<string>('');

  // Receipt Modal
  const [selectedExchangeForReceipt, setSelectedExchangeForReceipt] = useState<ExchangeReturn | null>(null);

  const selectedSale = sales.find((s) => s.id === selectedSaleId);

  // When sale is picked, auto-populate possible returned item options
  const handleSelectSale = (saleId: string) => {
    setSelectedSaleId(saleId);
    setReturnedItems([]);
    setReplacementItems([]);
  };

  const handleToggleReturnedItem = (saleItem: Sale['items'][0]) => {
    const exists = returnedItems.find((r) => r.productId === saleItem.productId);
    if (exists) {
      setReturnedItems(returnedItems.filter((r) => r.productId !== saleItem.productId));
    } else {
      const item: ExchangeItem = {
        productId: saleItem.productId,
        productCode: saleItem.productCode,
        productName: saleItem.productName,
        size: saleItem.size,
        color: saleItem.color,
        unitPrice: saleItem.unitPrice,
        costPrice: saleItem.costPrice,
        quantity: 1,
      };
      setReturnedItems([...returnedItems, item]);
    }
  };

  const handleAddReplacementItem = () => {
    const prod = products.find((p) => p.id === selectedReplacementProdId);
    if (!prod) return;
    if (prod.stock < replacementQuantity && !settings.allowNegativeStock) {
      alert(`Stock insuficiente para la nueva prenda (${prod.stock} u. disponibles)`);
      return;
    }

    const item: ExchangeItem = {
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      size: prod.size,
      color: prod.color,
      unitPrice: prod.salePrice,
      costPrice: prod.costPrice,
      quantity: Number(replacementQuantity),
    };

    setReplacementItems([...replacementItems, item]);
    setReplacementQuantity(1);
  };

  const handleRemoveReplacementItem = (index: number) => {
    setReplacementItems(replacementItems.filter((_, idx) => idx !== index));
  };

  // Difference calculations
  const returnedTotal = returnedItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const replacementTotal = replacementItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const priceDifference = replacementTotal - returnedTotal;

  // Auto-set resolution type depending on difference
  React.useEffect(() => {
    if (priceDifference > 0) {
      setResolutionType('pago_diferencia');
    } else if (priceDifference < 0) {
      setResolutionType('saldo_a_favor');
    } else {
      setResolutionType('cambio_directo');
    }
  }, [priceDifference]);

  const handleSubmitExchange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) {
      alert('Debe seleccionar una venta original.');
      return;
    }
    if (returnedItems.length === 0) {
      alert('Debe marcar al menos una prenda devuelta.');
      return;
    }
    if (replacementItems.length === 0) {
      alert('Debe seleccionar al menos una nueva prenda de cambio.');
      return;
    }

    const res = processExchange({
      originalSaleId: selectedSale.id,
      originalOperationNumber: selectedSale.operationNumber,
      clientId: selectedSale.clientId,
      clientName: selectedSale.clientName,
      returnedItems,
      replacementItems,
      returnedTotal,
      replacementTotal,
      priceDifference,
      resolutionType,
      paymentMethod: priceDifference > 0 ? differencePaymentMethod : undefined,
      reason,
      notes,
    });

    if (res.success && res.exchange) {
      setSelectedExchangeForReceipt(res.exchange);
      setIsModalOpen(false);
      setSelectedSaleId('');
      setReturnedItems([]);
      setReplacementItems([]);
    }
  };

  const filteredExchanges = exchanges.filter(
    (ex) =>
      ex.operationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.originalOperationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.clientName && ex.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header & New Exchange Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#2D241E] font-serif">Gestión de Cambios y Devoluciones</h2>
          <p className="text-xs text-[#8C6D58] mt-0.5">
            Garantía de stock consistente: reintegro automático de prenda devuelta y salida de nueva prenda
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#C87D83] hover:bg-[#B56C72] rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <Repeat className="w-4 h-4" />
          <span>Realizar Nuevo Cambio</span>
        </button>
      </div>

      {/* Exchanges Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#EADFD5] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#EFE7DE] flex items-center justify-between gap-4 bg-[#FFFDF9]/60">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A39589] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nro de cambio (CAM-...), venta original (VTA-...) o cliente..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-[#E3D7CB] rounded-xl outline-hidden focus:border-[#C87D83] bg-white text-[#2D241E] placeholder-[#A39589]"
            />
          </div>
          <div className="text-xs text-[#8C6D58] font-mono hidden sm:block">
            {exchanges.length} cambios registrados
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EFE7DE] text-[#8C6D58] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Nro Cambio</th>
                <th className="px-4 py-3">Venta Original</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Prenda Devuelta</th>
                <th className="px-4 py-3">Prenda Nueva</th>
                <th className="px-4 py-3 text-right">Diferencia</th>
                <th className="px-4 py-3 text-center">Resolución</th>
                <th className="px-4 py-3 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredExchanges.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    No hay cambios registrados en el sistema.
                  </td>
                </tr>
              ) : (
                filteredExchanges.map((ex) => (
                  <tr key={ex.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                      {ex.operationNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-700 whitespace-nowrap">
                      {ex.originalOperationNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{formatDate(ex.date)}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900 whitespace-nowrap">
                      {ex.clientName || 'Cliente Salón'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 max-w-[150px] truncate">
                      {ex.returnedItems.map((it) => `${it.productName} (${it.size})`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-neutral-900 font-medium max-w-[150px] truncate">
                      {ex.replacementItems.map((it) => `${it.productName} (${it.size})`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                      {ex.priceDifference > 0 ? (
                        <span className="text-emerald-700">
                          +{formatCurrency(ex.priceDifference, settings.currencySymbol)}
                        </span>
                      ) : ex.priceDifference < 0 ? (
                        <span className="text-blue-700">
                          -{formatCurrency(Math.abs(ex.priceDifference), settings.currencySymbol)}
                        </span>
                      ) : (
                        <span className="text-neutral-500">$ 0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="text-[10px] font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded capitalize">
                        {ex.resolutionType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedExchangeForReceipt(ex)}
                        className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                      >
                        Ver Ticket
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW EXCHANGE WIZARD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-neutral-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Registrar Cambio de Prenda</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Seleccione la venta original y defina las prendas a intercambiar
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExchange} className="space-y-4">
              {/* STEP 1: Select Original Sale */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  1. Seleccionar Venta Original *
                </label>
                <select
                  value={selectedSaleId}
                  onChange={(e) => handleSelectSale(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden bg-white"
                >
                  <option value="">Seleccione una venta para realizar el cambio...</option>
                  {sales
                    .filter((s) => s.status === 'completada')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.operationNumber} - Fecha: {formatDate(s.date)} - Total: ${s.total} -{' '}
                        {s.clientName || 'Cliente Salón'} ({s.items.length} prendas)
                      </option>
                    ))}
                </select>
              </div>

              {selectedSale && (
                <>
                  {/* STEP 2: Pick returned item from that sale */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <label className="block text-xs font-bold text-neutral-800">
                      2. Marcar Prenda(s) Devuelta(s) por el Cliente (Reingresa al stock):
                    </label>
                    <div className="space-y-2">
                      {selectedSale.items.map((saleItem, idx) => {
                        const isChecked = returnedItems.some((r) => r.productId === saleItem.productId);
                        return (
                          <label
                            key={idx}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'border-neutral-900 bg-white font-semibold'
                                : 'border-neutral-200 bg-white/70 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleReturnedItem(saleItem)}
                                className="rounded text-neutral-900 focus:ring-0"
                              />
                              <span>
                                {saleItem.quantity}x {saleItem.productName} ({saleItem.size} -{' '}
                                {saleItem.color})
                              </span>
                            </div>
                            <span className="font-mono tabular-nums text-neutral-900">
                              {formatCurrency(saleItem.unitPrice, settings.currencySymbol)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 3: Pick Replacement item */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                    <label className="block text-xs font-bold text-neutral-800">
                      3. Seleccionar Nueva Prenda que se Lleva el Cliente (Se descuenta del stock):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                      <div className="sm:col-span-8">
                        <select
                          value={selectedReplacementProdId}
                          onChange={(e) => setSelectedReplacementProdId(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg outline-hidden bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                              {p.code} - {p.name} (Talle {p.size} · Stock: {p.stock}) - ${p.salePrice}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={replacementQuantity}
                          onChange={(e) =>
                            setReplacementQuantity(Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddReplacementItem}
                          className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold"
                        >
                          + Agregar
                        </button>
                      </div>
                    </div>

                    {/* Replacement items list */}
                    {replacementItems.length > 0 && (
                      <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg overflow-hidden bg-white mt-2">
                        {replacementItems.map((item, idx) => (
                          <div key={idx} className="p-2 flex items-center justify-between text-xs">
                            <span>
                              {item.quantity}x {item.productName} ({item.size})
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-mono tabular-nums">
                                {formatCurrency(item.unitPrice * item.quantity, settings.currencySymbol)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveReplacementItem(idx)}
                                className="text-red-600 hover:text-red-800 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* STEP 4: Balance & Price Difference Summary */}
                  <div className="p-4 bg-white rounded-xl border border-neutral-300 space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-600">
                      <span>Valor de prenda(s) devuelta(s):</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(returnedTotal, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Valor de nueva(s) prenda(s):</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(replacementTotal, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-neutral-200 font-bold text-sm">
                      <span>DIFERENCIA A LIQUIDAR:</span>
                      <span className="font-mono tabular-nums text-base">
                        {priceDifference > 0 ? (
                          <span className="text-neutral-900">
                            Cliente debe abonar: {formatCurrency(priceDifference, settings.currencySymbol)}
                          </span>
                        ) : priceDifference < 0 ? (
                          <span className="text-neutral-900">
                            A favor del cliente: {formatCurrency(Math.abs(priceDifference), settings.currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-neutral-500">Sin diferencia ($0)</span>
                        )}
                      </span>
                    </div>

                    {/* Difference Resolution Controls */}
                    {priceDifference > 0 && (
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-neutral-700">Forma de cobro de la diferencia:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDifferencePaymentMethod('efectivo')}
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              differencePaymentMethod === 'efectivo'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            Efectivo (Entra a Caja)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDifferencePaymentMethod('transferencia')}
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              differencePaymentMethod === 'transferencia'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            Transferencia / Tarjeta
                          </button>
                        </div>
                      </div>
                    )}

                    {priceDifference < 0 && (
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-neutral-700">Resolución de saldo a favor:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setResolutionType('saldo_a_favor')}
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              resolutionType === 'saldo_a_favor'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            Dejar saldo a favor
                          </button>
                          <button
                            type="button"
                            onClick={() => setResolutionType('devolucion_dinero')}
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              resolutionType === 'devolucion_dinero'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            Reintegro efectivo (Sale de caja)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Motivo del Cambio</label>
                    <input
                      type="text"
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ej. Cambio por talle más chico, preferencia de color, etc."
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedSale || returnedItems.length === 0 || replacementItems.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg disabled:opacity-50"
                >
                  Confirmar Cambio y Ajustar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {selectedExchangeForReceipt && (
        <ReceiptModal
          isOpen={!!selectedExchangeForReceipt}
          onClose={() => setSelectedExchangeForReceipt(null)}
          data={{ type: 'exchange', exchange: selectedExchangeForReceipt }}
        />
      )}
    </div>
  );
};
