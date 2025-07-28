"use client";

import React, { useReducer, useContext, useCallback, useEffect } from 'react';
import { DirectoryService } from '../services/directory.service';
import { directoryReducer, initialDirectoryState } from './directory.reducer';
import { useAuth } from '@/hooks/use-auth';
import { useEmployeeRefresh } from '@/lib/hooks/use-employee-refresh';
import type { DirectoryState, DirectoryAction, DirectoryFilters } from '../types';

interface DirectoryContextValue {
  state: DirectoryState;
  dispatch: React.Dispatch<DirectoryAction>;
  // Actions
  loadEmployees: (page?: number, reset?: boolean) => Promise<void>;
  loadMoreEmployees: () => Promise<void>;
  setFilter: (key: keyof DirectoryFilters, value: string) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  toggleMobileFilters: () => void;
}

const DirectoryContext = React.createContext<DirectoryContextValue | null>(null);

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  const { employee } = useAuth();
  const { registerRefreshHandler } = useEmployeeRefresh();
  const [state, dispatch] = useReducer(directoryReducer, initialDirectoryState);

  // Load employees with current filters
  const loadEmployees = useCallback(
    async (page: number = 0, reset: boolean = false) => {
      try {
        dispatch({ type: reset ? 'SET_LOADING' : 'SET_LOADING_MORE', payload: true });

        const result = await DirectoryService.fetchEmployees(page, state.filters);

        dispatch({
          type: 'SET_EMPLOYEES',
          payload: { employees: result.employees, reset },
        });

        dispatch({
          type: 'SET_PAGINATION',
          payload: {
            currentPage: reset ? 0 : page,
            totalCount: result.totalCount,
          },
        });

        dispatch({
          type: 'SET_UI_STATE',
          payload: { hasMore: result.hasMore },
        });
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_LOADING_MORE', payload: false });
      }
    },
    [state.filters]
  );

  // Load more employees (pagination)
  const loadMoreEmployees = useCallback(async () => {
    if (!state.ui.isLoadingMore && state.ui.hasMore) {
      await loadEmployees(state.pagination.currentPage + 1, false);
    }
  }, [loadEmployees, state.pagination.currentPage, state.ui.isLoadingMore, state.ui.hasMore]);

  // Set a single filter
  const setFilter = useCallback((key: keyof DirectoryFilters, value: string) => {
    dispatch({ type: 'SET_FILTER', payload: { key, value } });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  // Set view mode
  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  // Toggle mobile filters
  const toggleMobileFilters = useCallback(() => {
    dispatch({ type: 'TOGGLE_MOBILE_FILTERS' });
  }, []);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const options = await DirectoryService.fetchFilterOptions(state.filters);
      dispatch({ type: 'SET_FILTER_OPTIONS', payload: options });
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }, [state.filters]);

  // Initial load
  useEffect(() => {
    loadEmployees(0, true);
    loadFilterOptions();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadEmployees(0, true);
    loadFilterOptions();
  }, [state.filters]);

  // Register refresh handler
  useEffect(() => {
    const refreshHandler = () => {
      loadEmployees(0, true);
    };
    registerRefreshHandler(refreshHandler);
  }, [registerRefreshHandler, loadEmployees]);

  // Prevent body scroll when mobile filters are open
  useEffect(() => {
    if (state.ui.showMobileFilters) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [state.ui.showMobileFilters]);

  const value: DirectoryContextValue = {
    state,
    dispatch,
    loadEmployees,
    loadMoreEmployees,
    setFilter,
    clearFilters,
    setViewMode,
    toggleMobileFilters,
  };

  return (
    <DirectoryContext.Provider value={value}>
      {children}
    </DirectoryContext.Provider>
  );
}

export function useDirectory() {
  const context = useContext(DirectoryContext);
  if (!context) {
    throw new Error('useDirectory must be used within DirectoryProvider');
  }
  return context;
}
