/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-neutral-200 bg-white text-neutral-900';
        let Icon = CheckCircle2;
        let iconClass = 'text-neutral-900';

        if (toast.type === 'success') {
          borderClass = 'border-neutral-900 bg-neutral-900 text-white';
          Icon = CheckCircle2;
          iconClass = 'text-white';
        } else if (toast.type === 'error') {
          borderClass = 'border-red-600 bg-red-600 text-white';
          Icon = AlertCircle;
          iconClass = 'text-white';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500 bg-amber-50 text-neutral-900';
          Icon = AlertTriangle;
          iconClass = 'text-amber-600';
        } else if (toast.type === 'info') {
          borderClass = 'border-neutral-300 bg-neutral-100 text-neutral-900';
          Icon = Info;
          iconClass = 'text-neutral-700';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all transform duration-200 animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} />
            <div className="flex-1 text-sm">
              {toast.title && <div className="font-semibold text-xs uppercase tracking-wider mb-0.5">{toast.title}</div>}
              <div className="leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 rounded hover:opacity-75 transition-opacity"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
