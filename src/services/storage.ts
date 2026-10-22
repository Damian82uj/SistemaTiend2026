/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDatabase } from '../types';
import { INITIAL_DATABASE } from '../data/initialData';

const STORAGE_KEY = 'modagestion_db_v1';

export class StorageService {
  private static memoryDb: AppDatabase | null = null;

  public static getDatabase(): AppDatabase {
    if (this.memoryDb) {
      return this.memoryDb;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppDatabase;
        // Merge with defaults to ensure all arrays exist
        this.memoryDb = {
          users: parsed.users || INITIAL_DATABASE.users,
          products: parsed.products || INITIAL_DATABASE.products,
          stockMovements: parsed.stockMovements || [],
          sales: parsed.sales || INITIAL_DATABASE.sales,
          exchanges: parsed.exchanges || [],
          clients: parsed.clients || INITIAL_DATABASE.clients,
          debtPayments: parsed.debtPayments || [],
          suppliers: parsed.suppliers || INITIAL_DATABASE.suppliers,
          purchases: parsed.purchases || [],
          cashMovements: parsed.cashMovements || INITIAL_DATABASE.cashMovements,
          cashSessions: parsed.cashSessions || INITIAL_DATABASE.cashSessions,
          auditLogs: parsed.auditLogs || INITIAL_DATABASE.auditLogs,
          settings: { ...INITIAL_DATABASE.settings, ...parsed.settings },
        };
        return this.memoryDb;
      }
    } catch (e) {
      console.warn('Error reading from localStorage, using initial database:', e);
    }

    this.memoryDb = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.saveDatabase(this.memoryDb!);
    return this.memoryDb!;
  }

  public static saveDatabase(db: AppDatabase): void {
    this.memoryDb = db;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }

    // Try optional background sync to backend server if running
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db),
      }).catch(() => {
        // Silent fail if standalone client / GitHub Pages
      });
    }
  }

  public static resetToInitial(): AppDatabase {
    const clone = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    this.saveDatabase(clone);
    return clone;
  }

  public static exportJSON(): string {
    const db = this.getDatabase();
    return JSON.stringify(db, null, 2);
  }

  public static importJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr) as AppDatabase;
      if (!parsed.products || !parsed.sales || !parsed.users) {
        throw new Error('Estructura de respaldo no válida');
      }
      this.saveDatabase(parsed);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }
}
