import type { Employee } from '@/lib/supabase';

// Filter-related types
export interface FilterOption {
  value: string;
  count: number;
}

export interface DirectoryFilters {
  searchQuery: string;
  selectedDept: string;
  selectedGrade: string;
  selectedCategory: string;
  selectedGender: string;
  selectedBloodGroup: string;
}

export interface FilterOptions {
  departments: FilterOption[];
  grades: FilterOption[];
  categories: FilterOption[];
  bloodGroups: FilterOption[];
}

// UI state types
export interface DirectoryUIState {
  viewMode: 'grid' | 'list';
  showMobileFilters: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
}

// Pagination types
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

// Combined directory state
export interface DirectoryState {
  employees: Employee[];
  filters: DirectoryFilters;
  filterOptions: FilterOptions;
  ui: DirectoryUIState;
  pagination: PaginationState;
}

// Action types for reducer
export type DirectoryAction =
  | { type: 'SET_EMPLOYEES'; payload: { employees: Employee[]; reset?: boolean } }
  | { type: 'SET_FILTER'; payload: { key: keyof DirectoryFilters; value: string } }
  | { type: 'SET_FILTERS'; payload: Partial<DirectoryFilters> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_FILTER_OPTIONS'; payload: Partial<FilterOptions> }
  | { type: 'SET_UI_STATE'; payload: Partial<DirectoryUIState> }
  | { type: 'SET_PAGINATION'; payload: Partial<PaginationState> }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'TOGGLE_MOBILE_FILTERS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean };
