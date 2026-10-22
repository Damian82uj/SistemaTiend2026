/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  ShoppingBag,
  Repeat,
  Truck,
  CreditCard,
  DollarSign,
  Package,
  FileSpreadsheet,
  Eye,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { AuditLog } from '../../types';
import { formatDate, exportToCSV } from '../../utils/formatters';

export const HistorySection: React.FC = () => {
  const { auditLogs } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Extract distinct users
  const distinctUsers = Array.from(new Set(auditLogs.map((l) => l.userName)));

  // Date threshold helper
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    const matchUser = userFilter === 'all' || log.userName === userFilter;

    let matchDate = true;
    const logDate = new Date(log.date);
    if (dateFilter === 'today') {
      matchDate = log.date.startsWith(todayStr);
    } else if (dateFilter === 'week') {
      matchDate = logDate >= weekAgo;
    } else if (dateFilter === 'month') {
      matchDate = logDate >= monthAgo;
    }

    return matchSearch && matchAction && matchUser && matchDate;
  });

  const handleExportCSV = () => {
    const rows = filteredLogs.map((l) => ({
      Fecha: l.date,
      Usuario: l.userName,
      Rol: l.userRole,
      Accion: l.action,
      Descripcion: l.description,
    }));
    exportToCSV(`auditoria_operaciones_${todayStr}`, rows);
  };

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'VENTA_REGISTRADA':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">VENTA</span>;
      case 'CAMBIO_REGISTRADO':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">CAMBIO</span>;
      case 'COMPRA_PROVEEDOR':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded">COMPRA</span>;
      case 'PAGO_DEUDA':
        return <span className="bg-teal-100 text-teal-800 text-[10px] font-semibold px-2 py-0.5 rounded">COBRANZA</span>;
      case 'APERTURA_CAJA':
      case 'CIERRE_CAJA':
      case 'MOVIMIENTO_CAJA':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded">CAJA</span>;
      case 'STOCK_AJUSTADO':
      case 'PRENDA_CREADA':
      case 'PRENDA_EDITADA':
        return <span className="bg-neutral-100 text-neutral-800 text-[10px] font-semibold px-2 py-0.5 rounded">INVENTARIO</span>;
      default:
        return <span className="bg-neutral-100 text-neutral-600 text-[10px] font-semibold px-2 py-0.5 rounded">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Container */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#EADFD5] shadow-2xs overflow-hidden">
        {/* Search & Actions */}
        <div className="p-4 border-b border-[#EFE7DE] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFDF9]/60">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A39589] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en el historial de operaciones..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-[#E3D7CB] rounded-xl outline-hidden focus:border-[#C87D83] bg-white text-[#2D241E] placeholder-[#A39589]"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#6E5342] bg-[#F5EFEB] hover:bg-[#EFE7DE] rounded-xl border border-[#E3D7CB] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-3 bg-[#FAF7F2] border-b border-[#EFE7DE] flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-[#8C6D58] font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-700 outline-hidden"
          >
            <option value="all">Todas las Operaciones</option>
            <option value="VENTA_REGISTRADA">Ventas</option>
            <option value="CAMBIO_REGISTRADO">Cambios</option>
            <option value="COMPRA_PROVEEDOR">Compras Proveedor</option>
            <option value="PAGO_DEUDA">Cobranzas de Deudas</option>
            <option value="MOVIMIENTO_CAJA">Movimientos de Caja</option>
            <option value="APERTURA_CAJA">Aperturas de Caja</option>
            <option value="CIERRE_CAJA">Cierres de Caja</option>
            <option value="STOCK_AJUSTADO">Ajustes de Stock</option>
          </select>

          {/* User filter */}
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-700 outline-hidden"
          >
            <option value="all">Todos los Usuarios</option>
            {distinctUsers.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-700 outline-hidden"
          >
            <option value="all">Todo el Historial</option>
            <option value="today">Solo Hoy</option>
            <option value="week">Últimos 7 Días</option>
            <option value="month">Último Mes</option>
          </select>

          {(actionFilter !== 'all' || userFilter !== 'all' || dateFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setActionFilter('all');
                setUserFilter('all');
                setDateFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline ml-auto"
            >
              Restablecer
            </button>
          )}
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100/75 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Tipo de Operación</th>
                <th className="px-4 py-3">Descripción de la Acción</th>
                <th className="px-4 py-3">Usuario Responsable</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    No hay registros de auditoría que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-neutral-600 whitespace-nowrap">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900 max-w-md">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      <span className="font-semibold text-neutral-800">{log.userName}</span>{' '}
                      <span className="text-[11px] text-neutral-400 capitalize">({log.userRole})</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded"
                        title="Ver detalle del registro"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full border border-neutral-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Detalle de Operación</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-500">Tipo de Acción:</span>
                <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
              </div>

              <div>
                <span className="text-neutral-500">Fecha y Hora:</span>
                <div className="font-mono text-neutral-900 font-semibold">{formatDate(selectedLog.date)}</div>
              </div>

              <div>
                <span className="text-neutral-500">Usuario Responsable:</span>
                <div className="text-neutral-900 font-medium">
                  {selectedLog.userName} ({selectedLog.userRole})
                </div>
              </div>

              <div>
                <span className="text-neutral-500">Descripción:</span>
                <div className="p-3 bg-neutral-50 rounded-lg text-neutral-900 font-medium mt-1 leading-relaxed border border-neutral-200">
                  {selectedLog.description}
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="text-neutral-500">Metadatos Registrados:</span>
                  <pre className="p-3 bg-neutral-950 text-neutral-200 rounded-lg text-[11px] font-mono overflow-x-auto mt-1">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-200 text-right mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
