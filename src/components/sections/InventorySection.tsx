/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Package,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowUpDown,
  History,
  FileSpreadsheet,
  X,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product, GarmentCategory, StockMovement } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';

const CATEGORIES: GarmentCategory[] = [
  'Pantalones',
  'Remeras y Tops',
  'Vestidos',
  'Abrigos y Camperas',
  'Camisas y Blusas',
  'Faldas y Shorts',
  'Sweaters y Tejidos',
  'Calzado',
  'Accesorios',
];

export const InventorySection: React.FC = () => {
  const { products, stockMovements, suppliers, settings, addProduct, updateProduct, deleteProduct, quickStockEntry } =
    useStore();
  const { can, isAdmin } = useAuth();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [quickEntryProduct, setQuickEntryProduct] = useState<Product | null>(null);
  const [quickQuantity, setQuickQuantity] = useState<number>(5);
  const [quickReason, setQuickReason] = useState<string>('Recepción de mercadería');
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Pantalones' as GarmentCategory,
    model: '',
    size: 'M',
    color: 'Negro',
    supplier: suppliers[0]?.name || 'Proveedor General',
    costPrice: 15000,
    salePrice: 32000,
    stock: 10,
    minStock: 3,
    notes: '',
  });

  // Extract distinct sizes & colors for filter dropdowns
  const availableSizes = useMemo(() => {
    const set = new Set(products.map((p) => p.size));
    return Array.from(set).sort();
  }, [products]);

  const availableColors = useMemo(() => {
    const set = new Set(products.map((p) => p.color));
    return Array.from(set).sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchSize = sizeFilter === 'all' || p.size === sizeFilter;
      const matchColor = colorFilter === 'all' || p.color === colorFilter;

      let matchStock = true;
      if (stockStatusFilter === 'low') {
        matchStock = p.stock <= p.minStock && p.stock > 0;
      } else if (stockStatusFilter === 'out') {
        matchStock = p.stock === 0;
      }

      return matchSearch && matchCat && matchSize && matchColor && matchStock;
    });
  }, [products, searchTerm, categoryFilter, sizeFilter, colorFilter, stockStatusFilter]);

  // Inventory KPI calculations
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalCostValue = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const totalSaleValue = products.reduce((acc, p) => acc + p.salePrice * p.stock, 0);
  const estimatedGrossProfit = totalSaleValue - totalCostValue;
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: `PRE-${String(products.length + 1).padStart(3, '0')}`,
      category: 'Pantalones',
      model: '',
      size: 'M',
      color: 'Negro',
      supplier: suppliers[0]?.name || 'Proveedor General',
      costPrice: 15000,
      salePrice: 32000,
      stock: 10,
      minStock: 3,
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      code: prod.code,
      category: prod.category,
      model: prod.model,
      size: prod.size,
      color: prod.color,
      supplier: prod.supplier,
      costPrice: prod.costPrice,
      salePrice: prod.salePrice,
      stock: prod.stock,
      minStock: prod.minStock,
      notes: prod.notes || '',
    });
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addProduct({
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      category: formData.category,
      model: formData.model.trim(),
      size: formData.size.trim(),
      color: formData.color.trim(),
      supplier: formData.supplier.trim(),
      costPrice: Number(formData.costPrice),
      salePrice: Number(formData.salePrice),
      stock: Number(formData.stock),
      minStock: Number(formData.minStock),
      notes: formData.notes.trim(),
    });
    if (res.success) {
      setIsAddModalOpen(false);
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const res = updateProduct(editingProduct.id, {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      category: formData.category,
      model: formData.model.trim(),
      size: formData.size.trim(),
      color: formData.color.trim(),
      supplier: formData.supplier.trim(),
      costPrice: Number(formData.costPrice),
      salePrice: Number(formData.salePrice),
      stock: Number(formData.stock),
      minStock: Number(formData.minStock),
      notes: formData.notes.trim(),
    });
    if (res.success) {
      setEditingProduct(null);
    }
  };

  const handleQuickEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEntryProduct) return;
    quickStockEntry(quickEntryProduct.id, Number(quickQuantity), quickReason);
    setQuickEntryProduct(null);
  };

  const handleExportCSV = () => {
    const rows = filteredProducts.map((p) => ({
      Codigo: p.code,
      Nombre: p.name,
      Categoria: p.category,
      Modelo: p.model,
      Talle: p.size,
      Color: p.color,
      Proveedor: p.supplier,
      Costo_Compra: p.costPrice,
      Precio_Venta: p.salePrice,
      Stock_Disponible: p.stock,
      Stock_Minimo: p.minStock,
      Fecha_Registro: p.createdAt,
    }));
    exportToCSV(`inventario_prendas_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Value Cards (Calculated Costs & Profit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Total Unidades en Stock</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#2D241E] mt-1 tabular-nums">
            {totalUnits} <span className="text-xs font-normal text-[#8C6D58]">prendas</span>
          </div>
          <div className="text-[11px] text-[#8C6D58] mt-0.5">En {products.length} modelos de ropa</div>
        </div>

        {can('canViewCosts') && (
          <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
            <div className="text-xs font-medium text-[#8C6D58]">Costo Total del Stock (Mayorista)</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#2D241E] mt-1 tabular-nums">
              {formatCurrency(totalCostValue, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-[#8C6D58] mt-0.5">Capital invertido en prendas</div>
          </div>
        )}

        {can('canViewCosts') && (
          <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
            <div className="text-xs font-medium text-[#8C6D58]">Ganancia Potencial Estimada</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#2D241E] mt-1 tabular-nums">
              {formatCurrency(estimatedGrossProfit, settings.currencySymbol)}
            </div>
            <div className="text-[11px] text-[#8C6D58] mt-0.5">
              Margen promedio: {Math.round((estimatedGrossProfit / (totalCostValue || 1)) * 100)}%
            </div>
          </div>
        )}

        <div className="bg-[#FFFFFF] p-4.5 rounded-2xl border border-[#EADFD5] shadow-2xs">
          <div className="text-xs font-medium text-[#8C6D58]">Prendas con Stock Bajo</div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#C87D83] mt-1 tabular-nums">
            {lowStockCount} <span className="text-xs font-normal text-[#8C6D58]">por reponer</span>
          </div>
          <div className="text-[11px] text-[#8C6D58] mt-0.5">Stock igual o menor al mínimo</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#EADFD5] shadow-2xs overflow-hidden">
        {/* Actions Bar */}
        <div className="p-4 border-b border-[#EFE7DE] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#FFFDF9]/60">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A39589] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, código (SKU), modelo o proveedor..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-[#E3D7CB] rounded-xl focus:border-[#C87D83] outline-hidden bg-white text-[#2D241E] placeholder-[#A39589]"
            />
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#6E5342] bg-[#F5EFEB] hover:bg-[#EFE7DE] rounded-xl border border-[#E3D7CB] transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#C87D83] hover:bg-[#B56C72] rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Prenda</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-neutral-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-700 outline-hidden"
          >
            <option value="all">Todas las Categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Size Filter */}
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-700 outline-hidden"
          >
            <option value="all">Todos los Talles</option>
            {availableSizes.map((sz) => (
              <option key={sz} value={sz}>
                Talle {sz}
              </option>
            ))}
          </select>

          {/* Color Filter */}
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-700 outline-hidden"
          >
            <option value="all">Todos los Colores</option>
            {availableColors.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>

          {/* Stock Alert Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-700 outline-hidden"
          >
            <option value="all">Todos los Estados</option>
            <option value="low">Solo Stock Bajo</option>
            <option value="out">Sin Stock (Agotadas)</option>
          </select>

          {(categoryFilter !== 'all' || sizeFilter !== 'all' || colorFilter !== 'all' || stockStatusFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setSizeFilter('all');
                setColorFilter('all');
                setStockStatusFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100/75 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Prenda / Modelo</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Talle</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Proveedor</th>
                {can('canViewCosts') && <th className="px-4 py-3 text-right">Costo</th>}
                <th className="px-4 py-3 text-right">Precio Venta</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-normal">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-400">
                    No se encontraron prendas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLow = prod.stock <= prod.minStock && prod.stock > 0;
                  const isOut = prod.stock === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-neutral-900 whitespace-nowrap">
                        {prod.code}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-semibold text-neutral-900 truncate">{prod.name}</div>
                        <div className="text-[11px] text-neutral-500 truncate">{prod.model}</div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{prod.category}</td>
                      <td className="px-4 py-3 font-mono font-medium text-neutral-900 whitespace-nowrap">
                        {prod.size}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{prod.color}</td>
                      <td className="px-4 py-3 text-neutral-500 text-[11px] max-w-[140px] truncate">
                        {prod.supplier}
                      </td>
                      {can('canViewCosts') && (
                        <td className="px-4 py-3 text-right font-mono text-neutral-600 tabular-nums whitespace-nowrap">
                          {formatCurrency(prod.costPrice, settings.currencySymbol)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 tabular-nums whitespace-nowrap">
                        {formatCurrency(prod.salePrice, settings.currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={`text-sm ${
                            isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-neutral-900'
                          }`}
                        >
                          {prod.stock}
                        </span>
                        <span className="text-[10px] text-neutral-400 ml-1">/ mín {prod.minStock}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="text-[10px] font-mono font-bold text-neutral-900 bg-neutral-200 border border-neutral-300 px-2 py-0.5 rounded-md">
                            Agotado
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-mono font-semibold text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">
                            Stock Bajo
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-600 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-md">
                            Disponible
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick stock entry */}
                          <button
                            onClick={() => {
                              setQuickEntryProduct(prod);
                              setQuickQuantity(5);
                            }}
                            title="Entrada rápida de stock"
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* Product movements */}
                          <button
                            onClick={() => setHistoryProduct(prod)}
                            title="Ver movimientos de stock"
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            title="Editar prenda"
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => setProductToDelete(prod)}
                              title="Eliminar prenda"
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* MODAL: ADD PRODUCT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-xl w-full border border-neutral-200 shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Registrar Nueva Prenda</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Código de Prenda / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="PAN-005"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nombre de la Prenda *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Jean Mom Fit Tiro Alto"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Modelo / Corte</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Mom Fit Retro"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Talle *</label>
                  <input
                    type="text"
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="S, M, 38, etc."
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Color *</label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Azul Nevado"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Proveedor *</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Costo de Compra ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Precio de Venta ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Stock Inicial *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Notas u Observaciones</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles sobre tela, lavado, etc."
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
                  Guardar Prenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-xl w-full border border-neutral-200 shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold text-neutral-900">
                Editar Prenda ({editingProduct.code})
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Código / SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Talle</label>
                  <input
                    type="text"
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Color</label>
                  <input
                    type="text"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Proveedor</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Costo ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
                >
                  Actualizar Prenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK STOCK ENTRY */}
      {quickEntryProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Entrada Rápida de Mercadería</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {quickEntryProduct.name} ({quickEntryProduct.code})
                </p>
              </div>
              <button
                onClick={() => setQuickEntryProduct(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickEntrySubmit} className="space-y-4">
              <div className="p-3 bg-neutral-50 rounded-lg flex justify-between text-xs">
                <span className="text-neutral-600">Stock Actual en Sistema:</span>
                <span className="font-mono font-bold text-neutral-900">{quickEntryProduct.stock} unidades</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Cantidad a Ingresar *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quickQuantity}
                  onChange={(e) => setQuickQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Motivo o Comprobante
                </label>
                <input
                  type="text"
                  required
                  value={quickReason}
                  onChange={(e) => setQuickReason(e.target.value)}
                  placeholder="Ej. Ingreso de pedido semanal / Reposición"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg flex justify-between text-xs">
                <span>Nuevo Stock Resultante:</span>
                <span className="font-mono font-bold">
                  {quickEntryProduct.stock + Number(quickQuantity)} unidades
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setQuickEntryProduct(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRODUCT MOVEMENTS HISTORY */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-neutral-200 shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Historial de Movimientos de Stock
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {historyProduct.name} ({historyProduct.code}) · Talle: {historyProduct.size} · Color:{' '}
                  {historyProduct.color}
                </p>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {stockMovements.filter((m) => m.productId === historyProduct.id).length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-xs">
                  Aún no hay registros de movimientos específicos para esta prenda.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 text-xs">
                  {stockMovements
                    .filter((m) => m.productId === historyProduct.id)
                    .map((mov) => {
                      const isPositive = mov.quantity > 0;
                      return (
                        <div key={mov.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900 flex items-center gap-2">
                              <span>{mov.reason}</span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                                  isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {mov.type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {formatDate(mov.date)} · Por: {mov.userName}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-mono font-bold ${
                                isPositive ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {isPositive ? `+${mov.quantity}` : mov.quantity} u.
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              {mov.previousStock} → {mov.newStock} u.
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-200 text-right shrink-0">
              <button
                onClick={() => setHistoryProduct(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-neutral-900 mb-2">¿Eliminar Prenda del Catálogo?</h3>
            <p className="text-xs text-neutral-600 leading-relaxed mb-6">
              Esta acción eliminará <strong>{productToDelete.name}</strong> ({productToDelete.code}) del catálogo.
              El historial de ventas pasadas no se verá afectado.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Eliminar Prenda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
