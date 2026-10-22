/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'trabajadora';

export interface UserPermissions {
  canViewCosts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canManagePurchases: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canCloseCashRegister: boolean;
  canApplyCustomDiscount: boolean;
  canExportReports: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  permissions: UserPermissions;
}

export type GarmentCategory =
  | 'Pantalones'
  | 'Remeras y Tops'
  | 'Vestidos'
  | 'Abrigos y Camperas'
  | 'Camisas y Blusas'
  | 'Faldas y Shorts'
  | 'Sweaters y Tejidos'
  | 'Calzado'
  | 'Accesorios';

export interface Product {
  id: string;
  code: string; // Barcode or SKU (e.g. PAN-001)
  name: string;
  category: GarmentCategory;
  model: string;
  size: string; // S, M, L, XL, 38, 40, etc.
  color: string;
  supplier: string;
  costPrice: number; // Costo de compra al por mayor
  salePrice: number; // Precio de venta al público
  stock: number; // Stock disponible
  minStock: number; // Stock mínimo de alerta
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  type: 'entrada_compra' | 'salida_venta' | 'reingreso_devolucion' | 'ajuste_manual';
  quantity: number; // Positive or negative
  previousStock: number;
  newStock: number;
  date: string;
  referenceId?: string; // saleId, purchaseId, exchangeId
  reason: string;
  userName: string;
}

export type PaymentMethod =
  | 'efectivo'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'transferencia'
  | 'cuenta_corriente';

export interface SaleItem {
  productId: string;
  productCode: string;
  productName: string;
  size: string;
  color: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  operationNumber: string; // Formatted e.g. VTA-2026-0001
  date: string;
  items: SaleItem[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number; // Monto cobrado en el momento
  pendingBalance: number; // Saldo a cobrar / crédito
  clientId?: string;
  clientName?: string;
  cashierId: string;
  cashierName: string;
  status: 'completada' | 'cambiada' | 'anulada';
  notes?: string;
}

export interface ExchangeItem {
  productId: string;
  productCode: string;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
}

export interface ExchangeReturn {
  id: string;
  operationNumber: string; // Formatted e.g. CAM-2026-0001
  date: string;
  originalSaleId: string;
  originalOperationNumber: string;
  clientId?: string;
  clientName?: string;
  returnedItems: ExchangeItem[];
  replacementItems: ExchangeItem[];
  returnedTotal: number;
  replacementTotal: number;
  priceDifference: number; // >0: customer pays difference; <0: refund or credit note; =0: even swap
  resolutionType: 'pago_diferencia' | 'devolucion_dinero' | 'saldo_a_favor' | 'cambio_directo';
  paymentMethod?: PaymentMethod;
  cashierId: string;
  cashierName: string;
  reason: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  currentDebt: number; // Saldo pendiente acumulado
  creditLimit?: number;
  notes?: string;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  receiptNumber: string; // REC-2026-0001
  clientId: string;
  clientName: string;
  saleId?: string;
  date: string;
  amount: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  previousBalance: number;
  newBalance: number;
  cashierId: string;
  cashierName: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  cuit?: string;
  notes?: string;
}

export interface PurchaseItem {
  productId?: string;
  productCode: string;
  productName: string;
  category: GarmentCategory;
  size: string;
  color: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  invoiceNumber: string; // Nro de comprobante del proveedor
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalCost: number;
  paymentStatus: 'pagado_efectivo' | 'pagado_transferencia' | 'pendiente';
  userName: string;
  received: boolean;
  notes?: string;
}

export interface CashMovement {
  id: string;
  date: string;
  type: 'ingreso' | 'egreso';
  category:
    | 'venta_efectivo'
    | 'pago_deuda_efectivo'
    | 'diferencia_cambio_ingreso'
    | 'devolucion_dinero_egreso'
    | 'pago_proveedor_efectivo'
    | 'gasto_operativo'
    | 'retiro_caja'
    | 'ingreso_manual';
  amount: number;
  concept: string;
  referenceId?: string;
  cashierId: string;
  cashierName: string;
}

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialCash: number; // Fondo de caja inicial
  expectedCash?: number; // Calculado por sistema
  countedCash?: number; // Contado en arqueo
  difference?: number; // counted - expected
  status: 'abierta' | 'cerrada';
  notes?: string;
}

export interface AuditLog {
  id: string;
  date: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'VENTA_REGISTRADA'
    | 'VENTA_ANULADA'
    | 'CAMBIO_REGISTRADO'
    | 'DEVOLUCION_REGISTRADA'
    | 'COMPRA_PROVEEDOR'
    | 'PAGO_DEUDA'
    | 'PRENDA_CREADA'
    | 'PRENDA_EDITADA'
    | 'STOCK_AJUSTADO'
    | 'APERTURA_CAJA'
    | 'CIERRE_CAJA'
    | 'MOVIMIENTO_CAJA'
    | 'CLIENTE_REGISTRADO'
    | 'USUARIO_CREADO'
    | 'CONFIGURACION_ACTUALIZADA';
  description: string;
  details?: Record<string, any>;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  taxId: string; // CUIT o NIF
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
  defaultExchangeDays: number;
  receiptFooterMessage: string;
  allowNegativeStock: boolean;
  lowStockThresholdDefault: number;
}

export interface AppDatabase {
  users: User[];
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
}
