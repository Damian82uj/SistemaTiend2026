/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Building,
  User,
  Percent,
  CheckCircle,
  AlertCircle,
  Printer,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product, PaymentMethod, SaleItem, Sale } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ReceiptModal } from '../common/ReceiptModal';

interface CartItem extends SaleItem {
  availableStock: number;
}

export const POSSalesSection: React.FC = () => {
  const { products, clients, settings, createSale, activeCashSession } = useStore();
  const { currentUser, can } = useAuth();

  // Mode: manual product search / grid vs barcode scanner mode
  const [activeMode, setActiveMode] = useState<'grid' | 'scanner'>('grid');

  // Barcode input state
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [barcodeStatus, setBarcodeStatus] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Search & category filter for catalog picker
  const [searchCatalog, setSearchCatalog] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');

  // Client assignment & partial payment
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(false);
  const [amountPaidCustom, setAmountPaidCustom] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Generated Sale for Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Focus barcode input when scanner mode is active
  useEffect(() => {
    if (activeMode === 'scanner' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeMode]);

  // Categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter catalog
  const filteredCatalog = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchCatalog.toLowerCase()) ||
      p.code.toLowerCase().includes(searchCatalog.toLowerCase()) ||
      p.size.toLowerCase().includes(searchCatalog.toLowerCase()) ||
      p.color.toLowerCase().includes(searchCatalog.toLowerCase());
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0 && !settings.allowNegativeStock) {
      alert(`No hay stock disponible para ${product.name}`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      if (existing) {
        if (!settings.allowNegativeStock && existing.quantity >= product.stock) {
          alert(`Stock máximo alcanzado (${product.stock} u.) para esta prenda`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          category: product.category,
          size: product.size,
          color: product.color,
          quantity: 1,
          unitPrice: product.salePrice,
          costPrice: product.costPrice,
          subtotal: product.salePrice,
          availableStock: product.stock,
        };
        return [...prevCart, newItem];
      }
    });
  };

  // Barcode enter handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeQuery.trim().toLowerCase();
    if (!query) return;

    const matched = products.find(
      (p) => p.code.toLowerCase() === query || p.id.toLowerCase() === query
    );

    if (matched) {
      addToCart(matched);
      setBarcodeStatus(`Agregado con éxito: ${matched.name} (${matched.size})`);
      setBarcodeQuery('');
      setTimeout(() => setBarcodeStatus(null), 3000);
    } else {
      setBarcodeStatus(`No se encontró prenda con el código: ${barcodeQuery.toUpperCase()}`);
      setTimeout(() => setBarcodeStatus(null), 3500);
    }
  };

  // Modify quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (!settings.allowNegativeStock && newQty > item.availableStock) {
              alert(`Stock disponible máximo: ${item.availableStock} u.`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove single line
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  // Clear all
  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setSelectedClientId('');
    setIsPartialPayment(false);
    setSaleNotes('');
  };

  // Totals
  const subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const discountAmount = Math.round((subtotal * (discountPercent || 0)) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  // Sync default amount paid with total when not manual partial payment
  useEffect(() => {
    if (!isPartialPayment) {
      setAmountPaidCustom(total);
    }
  }, [total, isPartialPayment]);

  // Actual amount paid and pending debt calculation
  const effectiveAmountPaid = isPartialPayment
    ? Math.min(amountPaidCustom, total)
    : paymentMethod === 'cuenta_corriente'
    ? 0
    : total;

  const effectivePendingBalance = total - effectiveAmountPaid;

  const handleConfirmSale = () => {
    if (cart.length === 0) {
      alert('El carrito está vacío. Agregue prendas para realizar una venta.');
      return;
    }

    // If partial payment or credit, client is mandatory
    if ((isPartialPayment || paymentMethod === 'cuenta_corriente') && !selectedClientId) {
      alert('Debe seleccionar un Cliente para registrar ventas a cuenta corriente o con saldo pendiente.');
      return;
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId);

    const res = createSale({
      items: cart,
      subtotal,
      discountPercentage: discountPercent,
      discountAmount,
      total,
      paymentMethod: isPartialPayment ? 'cuenta_corriente' : paymentMethod,
      amountPaid: effectiveAmountPaid,
      pendingBalance: effectivePendingBalance,
      clientId: selectedClient?.id,
      clientName: selectedClient?.name,
      notes: saleNotes,
    });

    if (res.success && res.sale) {
      setCompletedSale(res.sale);
      setIsReceiptOpen(true);
      clearCart();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: PRODUCT SELECTION & CATALOG (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Mode Selector Tabs */}
        <div className="bg-[#FFFFFF] p-2 rounded-2xl border border-[#EADFD5] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'grid'
                  ? 'bg-[#C87D83] text-white shadow-2xs'
                  : 'text-[#6E5342] hover:text-[#2D241E] hover:bg-[#F5EFEB]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Catálogo y Búsqueda</span>
            </button>
            <button
              onClick={() => setActiveMode('scanner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'scanner'
                  ? 'bg-[#C87D83] text-white shadow-2xs'
                  : 'text-[#6E5342] hover:text-[#2D241E] hover:bg-[#F5EFEB]'
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Lector de Código de Barras</span>
            </button>
          </div>

          <span className="text-[11px] text-[#8C6D58] font-mono hidden sm:block pr-2">
            {products.length} prendas registradas
          </span>
        </div>

        {/* SCANNER MODE PANEL */}
        {activeMode === 'scanner' && (
          <div className="bg-[#FFFDF9] text-[#2D241E] p-5 rounded-2xl border border-[#EADFD5] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF0F1] text-[#C87D83] flex items-center justify-center">
                  <Barcode className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#2D241E] font-serif">Lector de Códigos de Barras</h3>
              </div>
              <span className="text-[11px] font-medium text-[#4F725B] bg-[#ECF3EE] border border-[#D1E1D5] px-2.5 py-0.5 rounded-full">
                Modo Escáner Activo
              </span>
            </div>

            <p className="text-xs text-[#6E5342] leading-relaxed">
              Pase la pistola lectora o ingrese el código de la prenda (ej. PAN-001, REM-002) y presione Enter para sumarla al ticket.
            </p>

            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                placeholder="Escanee o ingrese código (ej. PAN-001, VES-003)..."
                className="flex-1 px-4 py-2.5 bg-[#FFFFFF] border border-[#E3D7CB] rounded-xl text-xs font-mono text-[#2D241E] placeholder-[#A39589] focus:outline-hidden focus:border-[#C87D83] uppercase"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#C87D83] text-white font-semibold text-xs rounded-xl hover:bg-[#B56C72] transition-colors cursor-pointer shadow-2xs"
              >
                Agregar
              </button>
            </form>

            {barcodeStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  barcodeStatus.startsWith('Agregado')
                    ? 'bg-[#ECF3EE] text-[#4F725B] border border-[#D1E1D5]'
                    : 'bg-[#FAF0F1] text-[#C87D83] border border-[#F3D6D8]'
                }`}
              >
                <Barcode className="w-4 h-4 shrink-0" />
                <span>{barcodeStatus}</span>
              </div>
            )}

            {/* Quick barcode simulation buttons for instant testing */}
            <div className="pt-2 border-t border-[#EFE7DE]">
              <div className="text-[11px] text-[#8C6D58] mb-2 font-medium">Prendas disponibles para agregar rápido:</div>
              <div className="flex flex-wrap gap-2">
                {products.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      addToCart(p);
                      setBarcodeStatus(`Agregado con éxito: ${p.name} (${p.size})`);
                      setTimeout(() => setBarcodeStatus(null), 2500);
                    }}
                    className="px-3 py-1 bg-[#F5EFEB] hover:bg-[#EFE7DE] text-[11px] text-[#2D241E] rounded-lg border border-[#E3D7CB] transition-colors cursor-pointer"
                  >
                    + {p.code} ({p.name.split(' ')[0]} {p.size})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CATALOG GRID MODE */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#EADFD5] shadow-2xs overflow-hidden">
          {/* Search and Category Filter */}
          <div className="p-3.5 border-b border-[#EFE7DE] flex flex-col sm:flex-row gap-2.5 bg-[#FFFDF9]/60">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#A39589] absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchCatalog}
                onChange={(e) => setSearchCatalog(e.target.value)}
                placeholder="Buscar prenda por nombre, modelo, talle, color..."
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-[#E3D7CB] rounded-xl outline-hidden focus:border-[#C87D83] bg-white text-[#2D241E] placeholder-[#A39589]"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-[#E3D7CB] rounded-xl outline-hidden bg-white text-[#2D241E] cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Garments Grid */}
          <div className="p-3.5 max-h-[520px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCatalog.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-xs text-[#8C6D58]">
                No se encontraron prendas disponibles con ese criterio de búsqueda.
              </div>
            ) : (
              filteredCatalog.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const isLow = prod.stock <= prod.minStock;

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && addToCart(prod)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isOutOfStock
                        ? 'opacity-50 border-[#EADFD5] bg-[#FAF7F2] cursor-not-allowed'
                        : 'border-[#EADFD5] hover:border-[#C87D83]/60 hover:shadow-2xs cursor-pointer bg-[#FFFFFF]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[10px] text-[#8C6D58] font-bold uppercase tracking-wider">
                          {prod.code}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-[#FAF0F1] text-[#C87D83] font-bold'
                              : isLow
                              ? 'bg-[#FAF0F1] text-[#C87D83]'
                              : 'bg-[#ECF3EE] text-[#4F725B]'
                          }`}
                        >
                          Stock: {prod.stock} u.
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-[#2D241E] leading-snug line-clamp-2">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-[#8C6D58] mt-1">
                        Talle: <strong className="text-[#2D241E]">{prod.size}</strong> · Color:{' '}
                        <strong className="text-[#2D241E]">{prod.color}</strong>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#EFE7DE] flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-[#2D241E] tabular-nums">
                        {formatCurrency(prod.salePrice, settings.currencySymbol)}
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className="px-3 py-1 text-[11px] font-medium text-white bg-[#C87D83] hover:bg-[#B56C72] rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: POS CART & CHECKOUT (5 Cols) */}
      <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#EADFD5] shadow-xs p-5 space-y-4 sticky top-24">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE7DE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FAF0F1] text-[#C87D83] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D241E] font-serif">Ticket de Venta</h3>
              <p className="text-[11px] text-[#8C6D58]">{cart.length} prenda{cart.length === 1 ? '' : 's'} en mostrador</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-[#8C6D58] hover:text-[#C87D83] transition-colors cursor-pointer"
            >
              Vaciar
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="max-h-56 overflow-y-auto divide-y divide-[#EFE7DE]">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-[#8C6D58] text-xs">
              El ticket está vacío.
              <br />
              Hacé clic en una prenda del catálogo para comenzar la venta.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#2D241E] truncate">{item.productName}</div>
                  <div className="text-[11px] text-[#8C6D58]">
                    Talle {item.size} · {item.color} ·{' '}
                    <span className="font-mono tabular-nums">
                      {formatCurrency(item.unitPrice, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="w-6 h-6 rounded-lg border border-[#E3D7CB] flex items-center justify-center hover:bg-[#F5EFEB] text-[#2D241E] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-[#2D241E]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="w-6 h-6 rounded-lg border border-[#E3D7CB] flex items-center justify-center hover:bg-[#F5EFEB] text-[#2D241E] cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="text-right shrink-0 w-24">
                  <div className="font-mono font-bold text-[#2D241E] tabular-nums">
                    {formatCurrency(item.subtotal, settings.currencySymbol)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-[10px] text-[#C87D83] hover:underline cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Discounts Options */}
        <div className="pt-3 border-t border-[#EFE7DE] space-y-3">
          {/* Client Selection */}
          <div>
            <label className="block text-[11px] font-medium text-[#6E5342] mb-1">
              Cliente Asociado (Opcional o Requerido si es a Crédito/Fiado)
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E3D7CB] rounded-xl outline-hidden bg-white text-[#2D241E] cursor-pointer"
            >
              <option value="">Cliente Ocasional / Salón</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - Tel: {c.phone} {c.currentDebt > 0 ? `(Deuda: $${c.currentDebt})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Discount Presets */}
          {can('canApplyCustomDiscount') && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-[#6E5342]">Descuento Especial:</span>
              <div className="flex items-center gap-1.5">
                {[0, 5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                      discountPercent === pct
                        ? 'bg-[#C87D83] text-white border-[#C87D83] font-bold'
                        : 'bg-[#FAF7F2] text-[#6E5342] border-[#E3D7CB] hover:bg-[#F5EFEB]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#6E5342] mb-1.5">
              Medio de Cobro
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('efectivo');
                  setIsPartialPayment(false);
                }}
                className={`py-2 px-3 text-xs rounded-xl border font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'efectivo' && !isPartialPayment
                    ? 'border-[#C87D83] bg-[#FAF0F1] text-[#C87D83] font-bold'
                    : 'border-[#E3D7CB] text-[#6E5342] hover:bg-[#FAF7F2]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('transferencia');
                  setIsPartialPayment(false);
                }}
                className={`py-2 px-3 text-xs rounded-xl border font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'transferencia' && !isPartialPayment
                    ? 'border-[#C87D83] bg-[#FAF0F1] text-[#C87D83] font-bold'
                    : 'border-[#E3D7CB] text-[#6E5342] hover:bg-[#FAF7F2]'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Transferencia</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('tarjeta_debito');
                  setIsPartialPayment(false);
                }}
                className={`py-2 px-3 text-xs rounded-xl border font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'tarjeta_debito' && !isPartialPayment
                    ? 'border-[#C87D83] bg-[#FAF0F1] text-[#C87D83] font-bold'
                    : 'border-[#E3D7CB] text-[#6E5342] hover:bg-[#FAF7F2]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Tarjeta</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cuenta_corriente');
                  setIsPartialPayment(true);
                }}
                className={`py-2 px-3 text-xs rounded-xl border font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === 'cuenta_corriente' || isPartialPayment
                    ? 'border-[#C87D83] bg-[#FAF0F1] text-[#C87D83] font-bold'
                    : 'border-[#E3D7CB] text-[#6E5342] hover:bg-[#FAF7F2]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Crédito / Cta. Cte.</span>
              </button>
            </div>
          </div>

          {/* Partial Payment Calculator */}
          {(isPartialPayment || paymentMethod === 'cuenta_corriente') && (
            <div className="p-3.5 bg-[#FAF7F2] border border-[#EADFD5] rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-[#2D241E] flex items-center justify-between">
                <span>Pago Parcial / Seña Inicial:</span>
                <span className="text-[10px] text-[#8C6D58]">Ej: entrega inicial de compra</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8C6D58] font-mono">$</span>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={amountPaidCustom}
                  onChange={(e) => setAmountPaidCustom(Number(e.target.value))}
                  placeholder="0"
                  className="flex-1 px-3 py-1.5 text-xs border border-[#E3D7CB] rounded-lg outline-hidden font-mono bg-white text-[#2D241E]"
                />
              </div>
              <div className="flex justify-between text-[#6E5342] text-[11px]">
                <span>Saldo que queda como deuda:</span>
                <span className="font-mono font-bold text-[#C87D83]">
                  {formatCurrency(effectivePendingBalance, settings.currencySymbol)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="pt-3 border-t border-[#EFE7DE] space-y-1.5 text-xs">
          <div className="flex justify-between text-[#6E5342]">
            <span>Subtotal:</span>
            <span className="font-mono tabular-nums">{formatCurrency(subtotal, settings.currencySymbol)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-[#4F725B]">
              <span>Descuento aplicado ({discountPercent}%):</span>
              <span className="font-mono tabular-nums">
                -{formatCurrency(discountAmount, settings.currencySymbol)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-[#2D241E] pt-2 border-t border-[#EFE7DE]">
            <span>TOTAL:</span>
            <span className="font-mono tabular-nums">{formatCurrency(total, settings.currencySymbol)}</span>
          </div>

          {/* Actual Cash Drawer Effect Notice */}
          <div className="text-[11px] pt-1 leading-tight">
            {effectiveAmountPaid > 0 && paymentMethod === 'efectivo' ? (
              <span className="text-[#4F725B] font-medium">
                Se ingresarán {formatCurrency(effectiveAmountPaid, settings.currencySymbol)} al cajón físico de caja.
              </span>
            ) : effectivePendingBalance > 0 ? (
              <span className="text-[#C87D83] font-medium">
                {formatCurrency(effectivePendingBalance, settings.currencySymbol)} quedarán asentados como deuda del cliente.
              </span>
            ) : null}
          </div>
        </div>

        {/* Confirm Sale Button */}
        <button
          onClick={handleConfirmSale}
          disabled={cart.length === 0}
          className="w-full py-3.5 bg-[#C87D83] hover:bg-[#B56C72] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Confirmar Venta y Cobro</span>
        </button>
      </div>

      {/* RECEIPT MODAL */}
      {completedSale && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          data={{ type: 'sale', sale: completedSale }}
        />
      )}
    </div>
  );
};
