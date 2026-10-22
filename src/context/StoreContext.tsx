/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppDatabase,
  Product,
  Sale,
  SaleItem,
  PaymentMethod,
  ExchangeReturn,
  ExchangeItem,
  Client,
  Supplier,
  PurchaseOrder,
  PurchaseItem,
  CashMovement,
  CashSession,
  AuditLog,
  StoreSettings,
  StockMovement,
  DebtPayment,
} from '../types';
import { StorageService } from '../services/storage';
import { useAuth } from './AuthContext';
import { generateOperationNumber } from '../utils/formatters';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface StoreContextType {
  db: AppDatabase;
  products: Product[];
  stockMovements: StockMovement[];
  sales: Sale[];
  exchanges: ExchangeReturn[];
  clients: Client[];
  debtPayments: DebtPayment[];
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  cashMovements: CashMovement[];
  cashSessions: CashSession[];
  auditLogs: AuditLog[];
  settings: StoreSettings;
  activeCashSession: CashSession | null;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  notify: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;

  // Products
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string };
  updateProduct: (id: string, updates: Partial<Product>) => { success: boolean; error?: string };
  deleteProduct: (id: string) => { success: boolean; error?: string };
  adjustStock: (productId: string, newStock: number, reason: string) => { success: boolean; error?: string };
  quickStockEntry: (productId: string, quantityToAdd: number, reason: string) => { success: boolean; error?: string };

  // Sales
  createSale: (saleData: {
    items: SaleItem[];
    subtotal: number;
    discountPercentage: number;
    discountAmount: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    pendingBalance: number;
    clientId?: string;
    clientName?: string;
    notes?: string;
  }) => { success: boolean; sale?: Sale; error?: string };
  voidSale: (saleId: string, reason: string) => { success: boolean; error?: string };

  // Exchanges & Returns
  processExchange: (data: {
    originalSaleId: string;
    originalOperationNumber: string;
    clientId?: string;
    clientName?: string;
    returnedItems: ExchangeItem[];
    replacementItems: ExchangeItem[];
    returnedTotal: number;
    replacementTotal: number;
    priceDifference: number;
    resolutionType: 'pago_diferencia' | 'devolucion_dinero' | 'saldo_a_favor' | 'cambio_directo';
    paymentMethod?: PaymentMethod;
    reason: string;
    notes?: string;
  }) => { success: boolean; exchange?: ExchangeReturn; error?: string };

  // Purchases
  createPurchaseOrder: (data: {
    invoiceNumber: string;
    supplierId: string;
    items: PurchaseItem[];
    paymentStatus: 'pagado_efectivo' | 'pagado_transferencia' | 'pendiente';
    notes?: string;
  }) => { success: boolean; purchase?: PurchaseOrder; error?: string };

  // Clients & Debt
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'currentDebt'>) => { success: boolean; client?: Client; error?: string };
  updateClient: (id: string, updates: Partial<Client>) => { success: boolean; error?: string };
  recordDebtPayment: (data: {
    clientId: string;
    amount: number;
    paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
    saleId?: string;
    notes?: string;
  }) => { success: boolean; receipt?: DebtPayment; error?: string };

  // Suppliers
  addSupplier: (supplier: Omit<Supplier, 'id'>) => { success: boolean; error?: string };
  updateSupplier: (id: string, updates: Partial<Supplier>) => { success: boolean; error?: string };

  // Cash Register
  openCashRegister: (initialCash: number, notes?: string) => { success: boolean; error?: string };
  closeCashRegister: (countedCash: number, notes?: string) => { success: boolean; error?: string };
  addCashMovement: (type: 'ingreso' | 'egreso', category: CashMovement['category'], amount: number, concept: string) => { success: boolean; error?: string };
  getCurrentCashBalance: () => { cashInRegister: number; digitalTotal: number; expectedCashTotal: number };

  // Settings & DB Management
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetDatabase: () => void;
  restoreDatabaseFromJSON: (jsonStr: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [db, setDb] = useState<AppDatabase>(() => StorageService.getDatabase());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep max 5

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }, [dismissToast]);

  const saveState = useCallback((newDb: AppDatabase) => {
    setDb(newDb);
    StorageService.saveDatabase(newDb);
  }, []);

  // Helper for audit logs
  const logAudit = useCallback(
    (action: AuditLog['action'], description: string, details?: Record<string, any>) => {
      if (!currentUser) return;
      const log: AuditLog = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        date: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        description,
        details,
      };
      return log;
    },
    [currentUser]
  );

  // Active Cash Session
  const activeCashSession = db.cashSessions.find((s) => s.status === 'abierta') || null;

  // --- PRODUCTS ---
  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const existingCode = db.products.find((p) => p.code.trim().toUpperCase() === data.code.trim().toUpperCase());
    if (existingCode) {
      notify('error', `Ya existe una prenda con el código ${data.code}`);
      return { success: false, error: 'Código duplicado' };
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      code: data.code.trim().toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };

    const newDb = { ...db, products: [newProduct, ...db.products] };

    // Stock Movement Log
    if (newProduct.stock > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        productCode: newProduct.code,
        type: 'ajuste_manual',
        quantity: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        date: now,
        reason: 'Stock inicial al registrar prenda',
        userName: currentUser?.name || 'Sistema',
      };
      newDb.stockMovements = [movement, ...newDb.stockMovements];
    }

    const audit = logAudit('PRENDA_CREADA', `Prenda registrada: ${newProduct.name} (${newProduct.code}) - Stock: ${newProduct.stock}`);
    if (audit) newDb.auditLogs = [audit, ...newDb.auditLogs];

    saveState(newDb);
    notify('success', `Prenda "${newProduct.name}" registrada con éxito`);
    return { success: true };
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return { success: false, error: 'Prenda no encontrada' };

    const old = db.products[index];
    const updated: Product = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newProducts = [...db.products];
    newProducts[index] = updated;

    const newDb = { ...db, products: newProducts };
    const audit = logAudit('PRENDA_EDITADA', `Prenda actualizada: ${updated.name} (${updated.code})`);
    if (audit) newDb.auditLogs = [audit, ...newDb.auditLogs];

    saveState(newDb);
    notify('success', `Prenda "${updated.name}" actualizada.`);
    return { success: true };
  };

  const deleteProduct = (id: string) => {
    const product = db.products.find((p) => p.id === id);
    if (!product) return { success: false, error: 'Prenda no encontrada' };

    const newDb = {
      ...db,
      products: db.products.filter((p) => p.id !== id),
    };

    const audit = logAudit('PRENDA_EDITADA', `Prenda eliminada: ${product.name} (${product.code})`);
    if (audit) newDb.auditLogs = [audit, ...newDb.auditLogs];

    saveState(newDb);
    notify('info', `Prenda eliminada del catálogo.`);
    return { success: true };
  };

  const adjustStock = (productId: string, newStock: number, reason: string) => {
    const product = db.products.find((p) => p.id === productId);
    if (!product) return { success: false, error: 'Prenda no encontrada' };

    const diff = newStock - product.stock;
    const now = new Date().toISOString();

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      type: 'ajuste_manual',
      quantity: diff,
      previousStock: product.stock,
      newStock,
      date: now,
      reason,
      userName: currentUser?.name || 'Sistema',
    };

    const newProducts = db.products.map((p) => (p.id === productId ? { ...p, stock: newStock, updatedAt: now } : p));
    const newDb = {
      ...db,
      products: newProducts,
      stockMovements: [movement, ...db.stockMovements],
    };

    const audit = logAudit('STOCK_AJUSTADO', `Stock ajustado para ${product.name}: de ${product.stock} a ${newStock} (${reason})`);
    if (audit) newDb.auditLogs = [audit, ...newDb.auditLogs];

    saveState(newDb);
    notify('success', `Stock de "${product.name}" ajustado a ${newStock} u.`);
    return { success: true };
  };

  const quickStockEntry = (productId: string, quantityToAdd: number, reason: string) => {
    const product = db.products.find((p) => p.id === productId);
    if (!product) return { success: false, error: 'Prenda no encontrada' };
    return adjustStock(productId, product.stock + quantityToAdd, reason || 'Entrada rápida de mercadería');
  };

  // --- SALES ---
  const createSale = (saleData: {
    items: SaleItem[];
    subtotal: number;
    discountPercentage: number;
    discountAmount: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    pendingBalance: number;
    clientId?: string;
    clientName?: string;
    notes?: string;
  }) => {
    // 1. Validate stock availability for each item
    for (const item of saleData.items) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (!prod) {
        notify('error', `Prenda no encontrada: ${item.productName}`);
        return { success: false, error: `Prenda no encontrada: ${item.productName}` };
      }
      if (!db.settings.allowNegativeStock && prod.stock < item.quantity) {
        notify(
          'error',
          `Stock insuficiente para ${item.productName}. Disponible: ${prod.stock}, Solicitado: ${item.quantity}`
        );
        return {
          success: false,
          error: `Stock insuficiente para ${item.productName}. Disponible: ${prod.stock}`,
        };
      }
    }

    const now = new Date().toISOString();
    const opNumber = generateOperationNumber('VTA', db.sales.length);

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      operationNumber: opNumber,
      date: now,
      items: saleData.items,
      subtotal: saleData.subtotal,
      discountPercentage: saleData.discountPercentage,
      discountAmount: saleData.discountAmount,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod,
      amountPaid: saleData.amountPaid,
      pendingBalance: saleData.pendingBalance,
      clientId: saleData.clientId,
      clientName: saleData.clientName,
      cashierId: currentUser?.id || 'unknown',
      cashierName: currentUser?.name || 'Vendedora',
      status: 'completada',
      notes: saleData.notes,
    };

    // 2. Decrement stock atomically and record stock movements
    const newStockMovements: StockMovement[] = [];
    const updatedProducts = db.products.map((p) => {
      const soldItem = saleData.items.find((item) => item.productId === p.id);
      if (soldItem) {
        const prev = p.stock;
        const next = prev - soldItem.quantity;
        newStockMovements.push({
          id: `mov-${Date.now()}-${p.id}`,
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          type: 'salida_venta',
          quantity: -soldItem.quantity,
          previousStock: prev,
          newStock: next,
          date: now,
          referenceId: newSale.id,
          reason: `Venta ${opNumber}`,
          userName: currentUser?.name || 'Vendedora',
        });
        return { ...p, stock: next, updatedAt: now };
      }
      return p;
    });

    // 3. Cash movement if paid in cash
    const newCashMovements: CashMovement[] = [];
    if (saleData.paymentMethod === 'efectivo' && saleData.amountPaid > 0) {
      newCashMovements.push({
        id: `cash-${Date.now()}`,
        date: now,
        type: 'ingreso',
        category: 'venta_efectivo',
        amount: saleData.amountPaid,
        concept: `Venta ${opNumber} en efectivo`,
        referenceId: newSale.id,
        cashierId: currentUser?.id || 'unknown',
        cashierName: currentUser?.name || 'Vendedora',
      });
    } else if (saleData.paymentMethod === 'cuenta_corriente' && saleData.amountPaid > 0) {
      // Partial payment paid in cash
      newCashMovements.push({
        id: `cash-${Date.now()}`,
        date: now,
        type: 'ingreso',
        category: 'venta_efectivo',
        amount: saleData.amountPaid,
        concept: `Anticipo/Entrega inicial Venta ${opNumber} (Ctas. Ctes.)`,
        referenceId: newSale.id,
        cashierId: currentUser?.id || 'unknown',
        cashierName: currentUser?.name || 'Vendedora',
      });
    }

    // 4. Update Client Debt if credit / partial payment
    let updatedClients = db.clients;
    if (saleData.clientId && saleData.pendingBalance > 0) {
      updatedClients = db.clients.map((c) => {
        if (c.id === saleData.clientId) {
          return {
            ...c,
            currentDebt: (c.currentDebt || 0) + saleData.pendingBalance,
          };
        }
        return c;
      });
    }

    const audit = logAudit(
      'VENTA_REGISTRADA',
      `Venta ${opNumber} registrada por un total de $${saleData.total.toLocaleString()} (${saleData.paymentMethod})`,
      { total: saleData.total, itemsCount: saleData.items.length }
    );

    const newDb: AppDatabase = {
      ...db,
      sales: [newSale, ...db.sales],
      products: updatedProducts,
      stockMovements: [...newStockMovements, ...db.stockMovements],
      cashMovements: [...newCashMovements, ...db.cashMovements],
      clients: updatedClients,
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };

    saveState(newDb);
    notify('success', `Venta ${opNumber} confirmada con éxito.`);
    return { success: true, sale: newSale };
  };

  const voidSale = (saleId: string, reason: string) => {
    const sale = db.sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, error: 'Venta no encontrada' };
    if (sale.status === 'anulada') return { success: false, error: 'La venta ya fue anulada' };

    const now = new Date().toISOString();

    // Restore stock
    const newMovements: StockMovement[] = [];
    const restoredProducts = db.products.map((p) => {
      const soldItem = sale.items.find((item) => item.productId === p.id);
      if (soldItem) {
        const prev = p.stock;
        const next = prev + soldItem.quantity;
        newMovements.push({
          id: `mov-${Date.now()}-${p.id}`,
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          type: 'reingreso_devolucion',
          quantity: soldItem.quantity,
          previousStock: prev,
          newStock: next,
          date: now,
          referenceId: sale.id,
          reason: `Anulación de venta ${sale.operationNumber}: ${reason}`,
          userName: currentUser?.name || 'Administrador',
        });
        return { ...p, stock: next, updatedAt: now };
      }
      return p;
    });

    // Reverse cash if cash was received
    const newCashMovements: CashMovement[] = [];
    if (sale.amountPaid > 0 && (sale.paymentMethod === 'efectivo' || sale.paymentMethod === 'cuenta_corriente')) {
      newCashMovements.push({
        id: `cash-${Date.now()}`,
        date: now,
        type: 'egreso',
        category: 'devolucion_dinero_egreso',
        amount: sale.amountPaid,
        concept: `Reintegro por anulación de ${sale.operationNumber}`,
        referenceId: sale.id,
        cashierId: currentUser?.id || 'unknown',
        cashierName: currentUser?.name || 'Administrador',
      });
    }

    // Revert client debt if applicable
    let updatedClients = db.clients;
    if (sale.clientId && sale.pendingBalance > 0) {
      updatedClients = db.clients.map((c) => {
        if (c.id === sale.clientId) {
          return {
            ...c,
            currentDebt: Math.max(0, (c.currentDebt || 0) - sale.pendingBalance),
          };
        }
        return c;
      });
    }

    const updatedSales = db.sales.map((s) => (s.id === saleId ? { ...s, status: 'anulada' as const, notes: `${s.notes ? s.notes + ' | ' : ''}Anulada: ${reason}` } : s));

    const audit = logAudit('VENTA_ANULADA', `Venta ${sale.operationNumber} anulada. Motivo: ${reason}`);

    const newDb: AppDatabase = {
      ...db,
      sales: updatedSales,
      products: restoredProducts,
      stockMovements: [...newMovements, ...db.stockMovements],
      cashMovements: [...newCashMovements, ...db.cashMovements],
      clients: updatedClients,
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };

    saveState(newDb);
    notify('warning', `Venta ${sale.operationNumber} anulada y stock restituido.`);
    return { success: true };
  };

  // --- EXCHANGES & RETURNS ---
  const processExchange = (data: {
    originalSaleId: string;
    originalOperationNumber: string;
    clientId?: string;
    clientName?: string;
    returnedItems: ExchangeItem[];
    replacementItems: ExchangeItem[];
    returnedTotal: number;
    replacementTotal: number;
    priceDifference: number;
    resolutionType: 'pago_diferencia' | 'devolucion_dinero' | 'saldo_a_favor' | 'cambio_directo';
    paymentMethod?: PaymentMethod;
    reason: string;
    notes?: string;
  }) => {
    const now = new Date().toISOString();
    const opNumber = generateOperationNumber('CAM', db.exchanges.length);

    // 1. Restore returned items stock
    const newMovements: StockMovement[] = [];
    let updatedProducts = [...db.products];

    for (const ret of data.returnedItems) {
      updatedProducts = updatedProducts.map((p) => {
        if (p.id === ret.productId) {
          const prev = p.stock;
          const next = prev + ret.quantity;
          newMovements.push({
            id: `mov-${Date.now()}-ret-${p.id}`,
            productId: p.id,
            productName: p.name,
            productCode: p.code,
            type: 'reingreso_devolucion',
            quantity: ret.quantity,
            previousStock: prev,
            newStock: next,
            date: now,
            referenceId: opNumber,
            reason: `Reingreso por cambio (${opNumber})`,
            userName: currentUser?.name || 'Vendedora',
          });
          return { ...p, stock: next, updatedAt: now };
        }
        return p;
      });
    }

    // 2. Deduct replacement items stock
    for (const rep of data.replacementItems) {
      const prod = updatedProducts.find((p) => p.id === rep.productId);
      if (!prod) {
        return { success: false, error: `Prenda de cambio no encontrada: ${rep.productName}` };
      }
      if (!db.settings.allowNegativeStock && prod.stock < rep.quantity) {
        return { success: false, error: `Stock insuficiente para la nueva prenda: ${rep.productName}` };
      }

      updatedProducts = updatedProducts.map((p) => {
        if (p.id === rep.productId) {
          const prev = p.stock;
          const next = prev - rep.quantity;
          newMovements.push({
            id: `mov-${Date.now()}-rep-${p.id}`,
            productId: p.id,
            productName: p.name,
            productCode: p.code,
            type: 'salida_venta',
            quantity: -rep.quantity,
            previousStock: prev,
            newStock: next,
            date: now,
            referenceId: opNumber,
            reason: `Salida por cambio (${opNumber})`,
            userName: currentUser?.name || 'Vendedora',
          });
          return { ...p, stock: next, updatedAt: now };
        }
        return p;
      });
    }

    // 3. Cash movement if customer paid surcharge or store refunded
    const newCashMovements: CashMovement[] = [];
    if (data.priceDifference > 0 && data.paymentMethod === 'efectivo') {
      newCashMovements.push({
        id: `cash-${Date.now()}`,
        date: now,
        type: 'ingreso',
        category: 'diferencia_cambio_ingreso',
        amount: data.priceDifference,
        concept: `Cobro diferencia de cambio ${opNumber}`,
        referenceId: opNumber,
        cashierId: currentUser?.id || 'unknown',
        cashierName: currentUser?.name || 'Vendedora',
      });
    } else if (data.priceDifference < 0 && data.resolutionType === 'devolucion_dinero') {
      newCashMovements.push({
        id: `cash-${Date.now()}`,
        date: now,
        type: 'egreso',
        category: 'devolucion_dinero_egreso',
        amount: Math.abs(data.priceDifference),
        concept: `Reintegro por diferencia a favor cliente en cambio ${opNumber}`,
        referenceId: opNumber,
        cashierId: currentUser?.id || 'unknown',
        cashierName: currentUser?.name || 'Vendedora',
      });
    }

    // 4. Update Client credit if saldo a favor
    let updatedClients = db.clients;
    if (data.clientId && data.priceDifference < 0 && data.resolutionType === 'saldo_a_favor') {
      const creditAmount = Math.abs(data.priceDifference);
      updatedClients = db.clients.map((c) => {
        if (c.id === data.clientId) {
          return {
            ...c,
            currentDebt: (c.currentDebt || 0) - creditAmount,
          };
        }
        return c;
      });
    }

    const newExchange: ExchangeReturn = {
      id: `exch-${Date.now()}`,
      operationNumber: opNumber,
      date: now,
      originalSaleId: data.originalSaleId,
      originalOperationNumber: data.originalOperationNumber,
      clientId: data.clientId,
      clientName: data.clientName,
      returnedItems: data.returnedItems,
      replacementItems: data.replacementItems,
      returnedTotal: data.returnedTotal,
      replacementTotal: data.replacementTotal,
      priceDifference: data.priceDifference,
      resolutionType: data.resolutionType,
      paymentMethod: data.paymentMethod,
      cashierId: currentUser?.id || 'unknown',
      cashierName: currentUser?.name || 'Vendedora',
      reason: data.reason,
      notes: data.notes,
    };

    const audit = logAudit(
      'CAMBIO_REGISTRADO',
      `Cambio ${opNumber} procesado sobre venta original ${data.originalOperationNumber}. Diferencia: $${data.priceDifference}`
    );

    const newDb: AppDatabase = {
      ...db,
      exchanges: [newExchange, ...db.exchanges],
      products: updatedProducts,
      stockMovements: [...newMovements, ...db.stockMovements],
      cashMovements: [...newCashMovements, ...db.cashMovements],
      clients: updatedClients,
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };

    saveState(newDb);
    notify('success', `Cambio ${opNumber} registrado correctamente.`);
    return { success: true, exchange: newExchange };
  };

  // --- PURCHASES & MERCHANDISE RECEPTION ---
  const createPurchaseOrder = (data: {
    invoiceNumber: string;
    supplierId: string;
    items: PurchaseItem[];
    paymentStatus: 'pagado_efectivo' | 'pagado_transferencia' | 'pendiente';
    notes?: string;
  }) => {
    const supplier = db.suppliers.find((s) => s.id === data.supplierId);
    if (!supplier) return { success: false, error: 'Proveedor no encontrado' };

    const now = new Date().toISOString();
    const totalCost = data.items.reduce((acc, it) => acc + it.subtotal, 0);

    const newPurchase: PurchaseOrder = {
      id: `purch-${Date.now()}`,
      invoiceNumber: data.invoiceNumber || `FAC-${Date.now().toString().slice(-6)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: now,
      items: data.items,
      totalCost,
      paymentStatus: data.paymentStatus,
      userName: currentUser?.name || 'Administrador',
      received: true,
      notes: data.notes,
    };

    // 1. Increment stock of received items
    const newMovements: StockMovement[] = [];
    const updatedProducts = db.products.map((p) => {
      const match = data.items.find((item) => (item.productId && item.productId === p.id) || item.productCode === p.code);
      if (match) {
        const prev = p.stock;
        const next = prev + match.quantity;
        newMovements.push({
          id: `mov-${Date.now()}-${p.id}`,
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          type: 'entrada_compra',
          quantity: match.quantity,
          previousStock: prev,
          newStock: next,
          date: now,
          referenceId: newPurchase.id,
          reason: `Recepción de mercadería Factura ${newPurchase.invoiceNumber}`,
          userName: currentUser?.name || 'Administrador',
        });
        return {
          ...p,
          stock: next,
          costPrice: match.unitCost > 0 ? match.unitCost : p.costPrice,
          updatedAt: now,
        };
      }
      return p;
    });

    // 2. Cash movement if paid in cash
    const newCashMovements: CashMovement[] = [];
    if (data.paymentStatus === 'pagado_efectivo') {
      newCashMovements.push({
        id: `cash-${Date.now()}`,
        date: now,
        type: 'egreso',
        category: 'pago_proveedor_efectivo',
        amount: totalCost,
        concept: `Pago a proveedor ${supplier.name} - Comprobante ${newPurchase.invoiceNumber}`,
        referenceId: newPurchase.id,
        cashierId: currentUser?.id || 'unknown',
        cashierName: currentUser?.name || 'Administrador',
      });
    }

    const audit = logAudit(
      'COMPRA_PROVEEDOR',
      `Recepción de mercadería de ${supplier.name}. Total: $${totalCost.toLocaleString()}`
    );

    const newDb: AppDatabase = {
      ...db,
      purchases: [newPurchase, ...db.purchases],
      products: updatedProducts,
      stockMovements: [...newMovements, ...db.stockMovements],
      cashMovements: [...newCashMovements, ...db.cashMovements],
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };

    saveState(newDb);
    notify('success', `Compra a ${supplier.name} registrada y stock actualizado.`);
    return { success: true, purchase: newPurchase };
  };

  // --- CLIENTS & DEBT ---
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'currentDebt'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      currentDebt: 0,
      createdAt: new Date().toISOString(),
    };

    const audit = logAudit('CLIENTE_REGISTRADO', `Nuevo cliente registrado: ${newClient.name} (${newClient.phone})`);
    const newDb = {
      ...db,
      clients: [newClient, ...db.clients],
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };

    saveState(newDb);
    notify('success', `Cliente ${newClient.name} agregado.`);
    return { success: true, client: newClient };
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    const newClients = db.clients.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveState({ ...db, clients: newClients });
    notify('success', 'Datos del cliente actualizados.');
    return { success: true };
  };

  const recordDebtPayment = (data: {
    clientId: string;
    amount: number;
    paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
    saleId?: string;
    notes?: string;
  }) => {
    const client = db.clients.find((c) => c.id === data.clientId);
    if (!client) return { success: false, error: 'Cliente no encontrado' };
    if (data.amount <= 0) return { success: false, error: 'El monto a pagar debe ser mayor a 0' };

    const now = new Date().toISOString();
    const prevBal = client.currentDebt || 0;
    const nextBal = Math.max(0, prevBal - data.amount);
    const receiptNum = generateOperationNumber('REC', db.debtPayments.length);

    const paymentRecord: DebtPayment = {
      id: `debt-pay-${Date.now()}`,
      receiptNumber: receiptNum,
      clientId: client.id,
      clientName: client.name,
      saleId: data.saleId,
      date: now,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      previousBalance: prevBal,
      newBalance: nextBal,
      cashierId: currentUser?.id || 'unknown',
      cashierName: currentUser?.name || 'Vendedora',
      notes: data.notes,
    };

    // Cash movement if cash
    const newCashMovements: CashMovement[] = [];
    if (data.paymentMethod === 'efectivo') {
      newCashMovements.push({
        id: `cash-${Date.now()}`,
        date: now,
        type: 'ingreso',
        category: 'pago_deuda_efectivo',
        amount: data.amount,
        concept: `Cobro cuota/saldo pendiente ${client.name} (Recibo ${receiptNum})`,
        referenceId: paymentRecord.id,
        cashierId: currentUser?.id || 'unknown',
        cashierName: currentUser?.name || 'Vendedora',
      });
    }

    const updatedClients = db.clients.map((c) => (c.id === client.id ? { ...c, currentDebt: nextBal } : c));

    const audit = logAudit(
      'PAGO_DEUDA',
      `Pago de deuda recibido de ${client.name}: $${data.amount.toLocaleString()} (${data.paymentMethod}). Nuevo saldo: $${nextBal.toLocaleString()}`
    );

    const newDb: AppDatabase = {
      ...db,
      clients: updatedClients,
      debtPayments: [paymentRecord, ...db.debtPayments],
      cashMovements: [...newCashMovements, ...db.cashMovements],
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };

    saveState(newDb);
    notify('success', `Pago registrado: Recibo ${receiptNum}. Nuevo saldo: $${nextBal.toLocaleString()}`);
    return { success: true, receipt: paymentRecord };
  };

  // --- SUPPLIERS ---
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
    };
    saveState({ ...db, suppliers: [newSup, ...db.suppliers] });
    notify('success', `Proveedor "${newSup.name}" agregado.`);
    return { success: true };
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    const newSups = db.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s));
    saveState({ ...db, suppliers: newSups });
    notify('success', 'Proveedor actualizado.');
    return { success: true };
  };

  // --- CASH REGISTER ---
  const openCashRegister = (initialCash: number, notes?: string) => {
    if (activeCashSession) {
      return { success: false, error: 'Ya existe una sesión de caja abierta actualmente.' };
    }

    const now = new Date().toISOString();
    const newSession: CashSession = {
      id: `cs-${Date.now()}`,
      openedAt: now,
      openedBy: currentUser?.name || 'Vendedora',
      initialCash,
      status: 'abierta',
      notes,
    };

    // Add initial cash movement
    const initMovement: CashMovement = {
      id: `cash-${Date.now()}`,
      date: now,
      type: 'ingreso',
      category: 'ingreso_manual',
      amount: initialCash,
      concept: 'Fondo de apertura de caja',
      referenceId: newSession.id,
      cashierId: currentUser?.id || 'unknown',
      cashierName: currentUser?.name || 'Vendedora',
    };

    const audit = logAudit('APERTURA_CAJA', `Apertura de caja con fondo inicial de $${initialCash.toLocaleString()}`);

    const newDb: AppDatabase = {
      ...db,
      cashSessions: [newSession, ...db.cashSessions],
      cashMovements: [initMovement, ...db.cashMovements],
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };

    saveState(newDb);
    notify('success', `Caja abierta con fondo de $${initialCash.toLocaleString()}`);
    return { success: true };
  };

  const closeCashRegister = (countedCash: number, notes?: string) => {
    if (!activeCashSession) {
      return { success: false, error: 'No hay ninguna caja abierta para cerrar.' };
    }

    const { cashInRegister } = getCurrentCashBalance();
    const difference = countedCash - cashInRegister;
    const now = new Date().toISOString();

    const updatedSessions = db.cashSessions.map((s) => {
      if (s.id === activeCashSession.id) {
        return {
          ...s,
          closedAt: now,
          closedBy: currentUser?.name || 'Administrador',
          expectedCash: cashInRegister,
          countedCash,
          difference,
          status: 'cerrada' as const,
          notes: notes || s.notes,
        };
      }
      return s;
    });

    const audit = logAudit(
      'CIERRE_CAJA',
      `Cierre de caja. Efectivo esperado: $${cashInRegister.toLocaleString()}, Contado: $${countedCash.toLocaleString()}, Diferencia: $${difference.toLocaleString()}`
    );

    const newDb: AppDatabase = {
      ...db,
      cashSessions: updatedSessions,
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };

    saveState(newDb);
    notify('info', `Caja cerrada. Arqueo final: $${countedCash.toLocaleString()} (Diferencia: $${difference.toLocaleString()})`);
    return { success: true };
  };

  const addCashMovement = (type: 'ingreso' | 'egreso', category: CashMovement['category'], amount: number, concept: string) => {
    if (amount <= 0) return { success: false, error: 'El monto debe ser positivo' };

    const now = new Date().toISOString();
    const mov: CashMovement = {
      id: `cash-${Date.now()}`,
      date: now,
      type,
      category,
      amount,
      concept,
      cashierId: currentUser?.id || 'unknown',
      cashierName: currentUser?.name || 'Usuario',
    };

    const audit = logAudit('MOVIMIENTO_CAJA', `${type === 'ingreso' ? 'Ingreso' : 'Egreso'} de caja: $${amount.toLocaleString()} - ${concept}`);

    const newDb: AppDatabase = {
      ...db,
      cashMovements: [mov, ...db.cashMovements],
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };

    saveState(newDb);
    notify('success', `Movimiento de caja registrado: ${type === 'ingreso' ? '+' : '-'}$${amount.toLocaleString()}`);
    return { success: true };
  };

  const getCurrentCashBalance = () => {
    let cashInRegister = 0;
    let digitalTotal = 0;

    for (const mov of db.cashMovements) {
      if (mov.type === 'ingreso') {
        cashInRegister += mov.amount;
      } else {
        cashInRegister -= mov.amount;
      }
    }

    // Digital sales total (transfer, card)
    for (const sale of db.sales) {
      if (sale.status === 'completada' && (sale.paymentMethod === 'tarjeta_debito' || sale.paymentMethod === 'tarjeta_credito' || sale.paymentMethod === 'transferencia')) {
        digitalTotal += sale.amountPaid;
      }
    }

    return {
      cashInRegister: Math.max(0, cashInRegister),
      digitalTotal,
      expectedCashTotal: Math.max(0, cashInRegister),
    };
  };

  // --- SETTINGS & BACKUP ---
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    const updated = { ...db.settings, ...newSettings };
    const audit = logAudit('CONFIGURACION_ACTUALIZADA', 'Configuración del comercio modificada.');
    const newDb = {
      ...db,
      settings: updated,
      auditLogs: audit ? [audit, ...db.auditLogs] : db.auditLogs,
    };
    saveState(newDb);
    notify('success', 'Configuración guardada.');
  };

  const resetDatabase = () => {
    const reset = StorageService.resetToInitial();
    setDb(reset);
    notify('warning', 'La base de datos se ha restablecido a los valores iniciales de demostración.');
  };

  const restoreDatabaseFromJSON = (jsonStr: string) => {
    const ok = StorageService.importJSON(jsonStr);
    if (ok) {
      setDb(StorageService.getDatabase());
      notify('success', 'Copia de seguridad restaurada correctamente.');
      return true;
    } else {
      notify('error', 'Error al procesar el archivo de copia de seguridad.');
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        db,
        products: db.products,
        stockMovements: db.stockMovements,
        sales: db.sales,
        exchanges: db.exchanges,
        clients: db.clients,
        debtPayments: db.debtPayments,
        suppliers: db.suppliers,
        purchases: db.purchases,
        cashMovements: db.cashMovements,
        cashSessions: db.cashSessions,
        auditLogs: db.auditLogs,
        settings: db.settings,
        activeCashSession,
        toasts,
        dismissToast,
        notify,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        quickStockEntry,
        createSale,
        voidSale,
        processExchange,
        createPurchaseOrder,
        addClient,
        updateClient,
        recordDebtPayment,
        addSupplier,
        updateSupplier,
        openCashRegister,
        closeCashRegister,
        addCashMovement,
        getCurrentCashBalance,
        updateSettings,
        resetDatabase,
        restoreDatabaseFromJSON,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
