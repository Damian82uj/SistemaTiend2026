/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X, CheckCircle, Tag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Sale, ExchangeReturn, DebtPayment } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data:
    | { type: 'sale'; sale: Sale }
    | { type: 'exchange'; exchange: ExchangeReturn }
    | { type: 'debtPayment'; receipt: DebtPayment }
    | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const { settings } = useStore();

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-neutral-900" />
            <h3 className="text-base font-semibold text-neutral-900">Comprobante de Operación</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body (Printable Area) */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-neutral-800" id="printable-receipt">
          {/* Store Brand */}
          <div className="text-center pb-4 border-b border-dashed border-neutral-300">
            <div className="font-sans font-bold text-base tracking-widest text-neutral-900 uppercase">
              {settings.storeName}
            </div>
            {settings.tagline && <div className="font-sans text-neutral-500 text-[11px]">{settings.tagline}</div>}
            <div className="mt-1 text-neutral-600">CUIT: {settings.taxId}</div>
            <div className="text-neutral-600">{settings.address}</div>
            <div className="text-neutral-600">Tel: {settings.phone}</div>
          </div>

          {/* Operation Details */}
          {data.type === 'sale' && (
            <>
              <div className="py-3 border-b border-dashed border-neutral-300 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold">COMPROBANTE:</span>
                  <span className="font-bold">{data.sale.operationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>FECHA:</span>
                  <span>{formatDate(data.sale.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ATENDIÓ:</span>
                  <span>{data.sale.cashierName}</span>
                </div>
                {data.sale.clientName && (
                  <div className="flex justify-between">
                    <span>CLIENTE:</span>
                    <span>{data.sale.clientName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>FORMA DE PAGO:</span>
                  <span className="uppercase">{data.sale.paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-neutral-300">
                <div className="grid grid-cols-12 font-bold mb-2 pb-1 border-b border-neutral-200">
                  <span className="col-span-6">DESCRIPCIÓN</span>
                  <span className="col-span-2 text-center">CANT</span>
                  <span className="col-span-4 text-right">TOTAL</span>
                </div>
                <div className="space-y-2">
                  {data.sale.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px] leading-tight">
                      <div className="col-span-6">
                        <div className="font-semibold truncate">{item.productName}</div>
                        <div className="text-neutral-500 text-[10px]">
                          Talle: {item.size} · Color: {item.color}
                        </div>
                      </div>
                      <div className="col-span-2 text-center">{item.quantity}</div>
                      <div className="col-span-4 text-right tabular-nums">
                        {formatCurrency(item.subtotal, settings.currencySymbol)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="py-3 border-b border-dashed border-neutral-300 space-y-1 text-right">
                <div className="flex justify-between text-neutral-600">
                  <span>SUBTOTAL:</span>
                  <span className="tabular-nums">{formatCurrency(data.sale.subtotal, settings.currencySymbol)}</span>
                </div>
                {data.sale.discountAmount > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>DESCUENTO ({data.sale.discountPercentage}%):</span>
                    <span className="tabular-nums">
                      -{formatCurrency(data.sale.discountAmount, settings.currencySymbol)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1 border-t border-neutral-200">
                  <span>TOTAL A PAGAR:</span>
                  <span className="tabular-nums">{formatCurrency(data.sale.total, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-neutral-800">
                  <span>ABONADO EN CAJA:</span>
                  <span className="tabular-nums">{formatCurrency(data.sale.amountPaid, settings.currencySymbol)}</span>
                </div>
                {data.sale.pendingBalance > 0 && (
                  <div className="flex justify-between text-red-700 font-bold">
                    <span>SALDO PENDIENTE (DEUDA):</span>
                    <span className="tabular-nums">
                      {formatCurrency(data.sale.pendingBalance, settings.currencySymbol)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {data.type === 'exchange' && (
            <>
              <div className="py-3 border-b border-dashed border-neutral-300 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold">COMPROBANTE DE CAMBIO:</span>
                  <span className="font-bold">{data.exchange.operationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>VENTA ORIGINAL:</span>
                  <span>{data.exchange.originalOperationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>FECHA:</span>
                  <span>{formatDate(data.exchange.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ATENDIÓ:</span>
                  <span>{data.exchange.cashierName}</span>
                </div>
                {data.exchange.clientName && (
                  <div className="flex justify-between">
                    <span>CLIENTE:</span>
                    <span>{data.exchange.clientName}</span>
                  </div>
                )}
              </div>

              {/* Returned Items */}
              <div className="py-2 border-b border-neutral-200">
                <div className="font-bold text-[11px] mb-1 text-neutral-700">PRENDA(S) DEVUELTA(S):</div>
                {data.exchange.returnedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>
                      {item.quantity}x {item.productName} ({item.size})
                    </span>
                    <span className="tabular-nums">
                      +{formatCurrency(item.unitPrice * item.quantity, settings.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Replacement Items */}
              <div className="py-2 border-b border-neutral-200">
                <div className="font-bold text-[11px] mb-1 text-neutral-700">NUEVA(S) PRENDA(S):</div>
                {data.exchange.replacementItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>
                      {item.quantity}x {item.productName} ({item.size})
                    </span>
                    <span className="tabular-nums">
                      -{formatCurrency(item.unitPrice * item.quantity, settings.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Settlement */}
              <div className="py-3 border-b border-dashed border-neutral-300 space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>DIFERENCIA:</span>
                  <span className="tabular-nums">
                    {data.exchange.priceDifference > 0
                      ? `Cliente abona: ${formatCurrency(data.exchange.priceDifference, settings.currencySymbol)}`
                      : data.exchange.priceDifference < 0
                      ? `A favor cliente: ${formatCurrency(Math.abs(data.exchange.priceDifference), settings.currencySymbol)}`
                      : 'Cambio sin diferencia ($0)'}
                  </span>
                </div>
                <div className="text-neutral-500 text-[10px]">
                  Resolución: {data.exchange.resolutionType.replace(/_/g, ' ')}
                </div>
                {data.exchange.reason && (
                  <div className="text-neutral-600 text-[11px] mt-1">Motivo: {data.exchange.reason}</div>
                )}
              </div>
            </>
          )}

          {data.type === 'debtPayment' && (
            <>
              <div className="py-3 border-b border-dashed border-neutral-300 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold">RECIBO DE PAGO DE CUENTA:</span>
                  <span className="font-bold">{data.receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>FECHA:</span>
                  <span>{formatDate(data.receipt.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="font-bold">{data.receipt.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>COBRADO POR:</span>
                  <span>{data.receipt.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>MÉTODO:</span>
                  <span className="uppercase">{data.receipt.paymentMethod}</span>
                </div>
              </div>

              <div className="py-3 border-b border-dashed border-neutral-300 space-y-1">
                <div className="flex justify-between text-neutral-600">
                  <span>SALDO ANTERIOR:</span>
                  <span className="tabular-nums">
                    {formatCurrency(data.receipt.previousBalance, settings.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm text-neutral-900">
                  <span>MONTO ABONADO:</span>
                  <span className="tabular-nums text-neutral-900">
                    {formatCurrency(data.receipt.amount, settings.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                  <span>SALDO RESTANTE:</span>
                  <span className="tabular-nums">
                    {formatCurrency(data.receipt.newBalance, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Footer Policy */}
          <div className="pt-4 text-center text-neutral-500 text-[10px] leading-relaxed">
            <div>{settings.receiptFooterMessage}</div>
            <div className="mt-2 text-neutral-400 font-sans">Sistema ModaGestión v1.0</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Comprobante</span>
          </button>
        </div>
      </div>
    </div>
  );
};
