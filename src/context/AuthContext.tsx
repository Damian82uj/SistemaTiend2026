/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { StorageService } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWorker: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  can: (permission: keyof UserPermissions) => boolean;
  allUsers: User[];
  reloadUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_SESSION_KEY = 'modagestion_current_user_id';

const DEFAULT_OPERATOR: User = {
  id: 'user-operator',
  name: 'Encargada de Tienda',
  email: 'encargada@auraboutique.com',
  role: 'admin',
  active: true,
  createdAt: new Date().toISOString(),
  permissions: {
    canViewCosts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canManagePurchases: true,
    canManageUsers: true,
    canManageSettings: true,
    canCloseCashRegister: true,
    canApplyCustomDiscount: true,
    canExportReports: true,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_OPERATOR);
  const [allUsers, setAllUsers] = useState<User[]>([DEFAULT_OPERATOR]);

  const reloadUsers = () => {
    try {
      const db = StorageService.getDatabase();
      if (db.users && db.users.length > 0) {
        setAllUsers(db.users);
        const savedUserId = localStorage.getItem(CURRENT_USER_SESSION_KEY);
        const activeUser = db.users.find((u) => u.id === savedUserId && u.active) || db.users.find((u) => u.active) || db.users[0];
        if (activeUser) {
          setCurrentUser(activeUser);
          return;
        }
      }
    } catch (e) {
      console.warn('Error loading users:', e);
    }
    setCurrentUser(DEFAULT_OPERATOR);
  };

  useEffect(() => {
    reloadUsers();
  }, []);

  const login = async (_email: string, _pass: string): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  };

  const logout = () => {
    // Keep user active for direct frictionless access
    reloadUsers();
  };

  const switchUser = (userId: string) => {
    const db = StorageService.getDatabase();
    const target = db.users.find((u) => u.id === userId && u.active);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(CURRENT_USER_SESSION_KEY, target.id);
    }
  };

  const can = (_permission: keyof UserPermissions): boolean => {
    // Full store management permissions enabled for all authorized boutique operations
    return true;
  };

  const isAdmin = true;
  const isWorker = false;
  const isAuthenticated = true;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        isWorker,
        login,
        logout,
        switchUser,
        can,
        allUsers,
        reloadUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
