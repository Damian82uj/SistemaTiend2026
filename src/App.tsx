/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { Sidebar, SectionKey } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/ToastContainer';

// The 9 core commercial sections of the boutique (Starting with Punto de Venta)
import { POSSalesSection } from './components/sections/POSSalesSection';
import { InventorySection } from './components/sections/InventorySection';
import { HistorySection } from './components/sections/HistorySection';
import { ExchangesSection } from './components/sections/ExchangesSection';
import { ClientsSection } from './components/sections/ClientsSection';
import { DebtsSection } from './components/sections/DebtsSection';
import { PurchasesSection } from './components/sections/PurchasesSection';
import { CashRegisterSection } from './components/sections/CashRegisterSection';
import { ReportsSection } from './components/sections/ReportsSection';

const MainApp: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<SectionKey>('sales');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSidebarSelect = (section: SectionKey) => {
    setCurrentSection(section);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] bg-subtle-grid flex font-sans antialiased text-[#2D241E] selection:bg-[#F9EFF0] selection:text-[#C87D83]">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={handleSidebarSelect}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateSection={setCurrentSection}
        />

        {/* Main Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {currentSection === 'sales' && <POSSalesSection />}
          {currentSection === 'inventory' && <InventorySection />}
          {currentSection === 'history' && <HistorySection />}
          {currentSection === 'exchanges' && <ExchangesSection />}
          {currentSection === 'clients' && <ClientsSection />}
          {currentSection === 'debts' && <DebtsSection />}
          {currentSection === 'purchases' && <PurchasesSection />}
          {currentSection === 'cash' && <CashRegisterSection />}
          {currentSection === 'reports' && <ReportsSection />}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <MainApp />
      </StoreProvider>
    </AuthProvider>
  );
}
