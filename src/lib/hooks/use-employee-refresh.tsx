"use client";

import React from 'react';

interface EmployeeRefreshContextType {
  refreshEmployees: () => void;
  registerRefreshHandler: (handler: () => void) => void;
}

const EmployeeRefreshContext = React.createContext<EmployeeRefreshContextType | null>(null);

export function EmployeeRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshHandler, setRefreshHandler] = React.useState<(() => void) | null>(null);

  const registerRefreshHandler = React.useCallback((handler: () => void) => {
    setRefreshHandler(() => handler);
  }, []);

  const refreshEmployees = React.useCallback(() => {
    if (refreshHandler) {
      refreshHandler();
    }
  }, [refreshHandler]);

  const value = React.useMemo(() => ({
    refreshEmployees,
    registerRefreshHandler
  }), [refreshEmployees, registerRefreshHandler]);

  return (
    <EmployeeRefreshContext.Provider value={value}>
      {children}
    </EmployeeRefreshContext.Provider>
  );
}

export function useEmployeeRefresh() {
  const context = React.useContext(EmployeeRefreshContext);
  if (!context) {
    throw new Error('useEmployeeRefresh must be used within an EmployeeRefreshProvider');
  }
  return context;
}
