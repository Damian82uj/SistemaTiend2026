/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Package,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  X,
  Building,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { PurchaseOrder, PurchaseItem, Supplier, GarmentCategory } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PurchasesSection: React.FC = () => {
  const { purchases, suppliers, products, settings, createPurchaseOrder, addSupplier } = useStore();
  const { can } = useAuth();

  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [searchTerm, setSearchTerm] = useState('');

  // New Purchase Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pagado_efectivo' | 'pagado_transferencia' | 'pendiente'>(
    'pagado_transferencia'
  );
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Item currently being added in form
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [itemQuantity, setItemQuantity] = useState<number>(10);
  const [itemUnitCost, setItemUnitCost] = useState<number>(0);

  // New Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  // Set default cost when product is selected in purchase item picker
  const handleProductSelectChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemUnitCost(prod.costPrice);
    }
  };

  const handleAddItemToPurchase = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const newItem: PurchaseItem = {
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      category: prod.category,
      size: prod.size,
      color: prod.color,
      quantity: Number(itemQuantity),
      unitCost: Number(itemUnitCost),
      subtotal: Number(itemQuantity) * Number(itemUnitCost),
    };

    setPurchaseItems([...purchaseItems, newItem]);
    setItemQuantity(10);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, idx) => idx !== index));
  };

  const totalPurchaseCost = purchaseItems.reduce((acc, it) => acc + it.subtotal, 0);

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      alert('Debe agregar al menos una prenda a la recepción de mercadería.');
      return;
    }
    if (!selectedSupplierId) {
      alert('Seleccione un proveedor.');
      return;
    }

    const res = createPurchaseOrder({
      invoiceNumber: invoiceNumber.trim() || `REM-${Date.now().toString().slice(-6)}`,
      supplierId: selectedSupplierId,
      items: purchaseItems,
      paymentStatus,
      notes,
    });

    if (res.success) {
      setIsPurchaseModalOpen(false);
      setPurchaseItems([]);
      setInvoiceNumber('');
      setNotes('');
    }
  };

  const handleSubmitSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    addSupplier({
      name: newSupplierName.trim(),
      contactPerson: newSupplierContact.trim(),
      phone: newSupplierPhone.trim(),
      email: newSupplierEmail.trim(),
      address: newSupplierAddress.trim(),
    });

    setIsSupplierModalOpen(false);
    setNewSupplierName('');
    setNewSupplierContact('');
    setNewSupplierPhone('');
    setNewSupplierEmail('');
    setNewSupplierAddress('');
  };

  const filteredPurchases = purchases.filter(
    (p) =>
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation & KPIs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="bg-[#FFFFFF] p-1.5 rounded-2xl border border-[#EADFD5] flex items-center gap-1.5 w-fit shadow-2xs">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'purchases'
                ? 'bg-[#C87D83] text-white shadow-2xs'
                : 'text-[#6E5342] hover:text-[#2D241E] hover:bg-[#FAF7F2]'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Recepción de Mercadería ({purchases.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'suppliers'
                ? 'bg-[#C87D83] text-white shadow-2xs'
                : 'text-[#6E5342] hover:text-[#2D241E] hover:bg-[#FAF7F2]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Directorio de Proveedores ({suppliers.length})</span>
          </button>
        </div>

        {/* Action Button */}
        {activeTab === 'purchases' ? (
          <button
            onClick={() => {
              if (products.length > 0) {
                handleProductSelectChange(products[0].id);
              }
              setIsPurchaseModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#C87D83] hover:bg-[#B56C72] rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Compra / Entrada</span>
          </button>
        ) : (
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#C87D83] hover:bg-[#B56C72] rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proveedor</span>
          </button>
        )}
      </div>

      {/* TAB 1: PURCHASES LIST */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por proveedor o nro de comprobante..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
              />
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              Stock actualizado automáticamente al recibir mercadería
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/75 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Comprobante</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Prendas Recibidas</th>
                  <th className="px-4 py-3 text-right">Costo Total</th>
                  <th className="px-4 py-3 text-center">Estado Pago</th>
                  <th className="px-4 py-3">Registrado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      No hay registros de compras de mercadería.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purch) => {
                    const totalUnitsReceived = purch.items.reduce((acc, it) => acc + it.quantity, 0);

                    return (
                      <tr key={purch.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                          {purch.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">
                          {purch.supplierName}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                          {formatDate(purch.date)}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-neutral-900">
                            {totalUnitsReceived} prendas en total
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            {purch.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 tabular-nums whitespace-nowrap">
                          {formatCurrency(purch.totalCost, settings.currencySymbol)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                              purch.paymentStatus === 'pagado_efectivo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : purch.paymentStatus === 'pagado_transferencia'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {purch.paymentStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{purch.userName}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-neutral-900">{sup.name}</h4>
                  {sup.cuit && <div className="text-[11px] text-neutral-500 font-mono">CUIT: {sup.cuit}</div>}
                </div>
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-600 pt-2 border-t border-neutral-100">
                {sup.contactPerson && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Contacto: {sup.contactPerson}</span>
                  </div>
                )}
                {sup.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{sup.phone}</span>
                  </div>
                )}
                {sup.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{sup.email}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="text-neutral-500 text-[11px] pt-1">Dirección: {sup.address}</div>
                )}
                {sup.notes && (
                  <div className="text-neutral-500 text-[11px] italic bg-neutral-50 p-2 rounded mt-2">
                    {sup.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: REGISTER PURCHASE */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-neutral-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Recepción de Mercadería y Compra a Proveedor
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  El stock de las prendas se incrementará automáticamente al confirmar.
                </p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Proveedor *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Nro de Factura o Remito
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="FAC-0001248"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Add item subform */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="text-xs font-bold text-neutral-900">Agregar Prenda a la Recepción:</div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] text-neutral-600 mb-1">Prenda del Catálogo</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg outline-hidden bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name} (Talle {p.size})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-neutral-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-neutral-600 mb-1">Costo Unit. ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={itemUnitCost}
                      onChange={(e) => setItemUnitCost(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToPurchase}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold"
                    >
                      + Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List in Purchase */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-2">
                  Prendas en este Comprobante ({purchaseItems.length})
                </label>
                {purchaseItems.length === 0 ? (
                  <div className="p-4 border border-dashed border-neutral-300 rounded-lg text-center text-xs text-neutral-400">
                    Aún no ha agregado prendas a la lista de recepción.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg overflow-hidden">
                    {purchaseItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs bg-white">
                        <div>
                          <span className="font-bold text-neutral-900">
                            {item.quantity}x {item.productName}
                          </span>{' '}
                          <span className="text-neutral-500 font-mono text-[11px]">
                            ({item.productCode} · Talle {item.size})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono tabular-nums text-neutral-800">
                            {formatCurrency(item.subtotal, settings.currencySymbol)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
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

              {/* Payment Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Forma de Pago al Proveedor
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden bg-white"
                  >
                    <option value="pagado_transferencia">Transferencia Bancaria</option>
                    <option value="pagado_efectivo">Efectivo (Descontar de Caja Física)</option>
                    <option value="pendiente">Cuenta Corriente Proveedor (Pendiente)</option>
                  </select>
                </div>

                <div className="text-right flex flex-col justify-end">
                  <div className="text-xs text-neutral-500">Costo Total Compra:</div>
                  <div className="text-xl font-bold font-mono text-neutral-900 tabular-nums">
                    {formatCurrency(totalPurchaseCost, settings.currencySymbol)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre entrega o transporte..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg disabled:opacity-50"
                >
                  Confirmar e Incrementar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Registrar Nuevo Proveedor</h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Razón Social / Nombre *</label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Ej. Confecciones San Martín"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  value={newSupplierContact}
                  onChange={(e) => setNewSupplierContact(e.target.value)}
                  placeholder="Ej. Juan Carlos López"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    placeholder="11-4567-8901"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    placeholder="ventas@proveedor.com"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Dirección / Localidad</label>
                <input
                  type="text"
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  placeholder="Calle y número"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
