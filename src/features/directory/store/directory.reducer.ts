import type { DirectoryState, DirectoryAction } from '../types';

export const initialDirectoryState: DirectoryState = {
  employees: [],
  filters: {
    searchQuery: '',
    selectedDept: 'all',
    selectedGrade: 'all',
    selectedCategory: 'all',
    selectedGender: 'all',
    selectedBloodGroup: 'all',
  },
  filterOptions: {
    departments: [],
    grades: [],
    categories: [],
    bloodGroups: [],
  },
  ui: {
    viewMode: 'grid',
    showMobileFilters: false,
    isLoading: true,
    isLoadingMore: false,
    hasMore: true,
  },
  pagination: {
    currentPage: 0,
    pageSize: 50,
    totalCount: 0,
  },
};

export function directoryReducer(
  state: DirectoryState,
  action: DirectoryAction
): DirectoryState {
  switch (action.type) {
    case 'SET_EMPLOYEES':
      return {
        ...state,
        employees: action.payload.reset
          ? action.payload.employees
          : [...state.employees, ...action.payload.employees],
      };

    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialDirectoryState.filters,
      };

    case 'SET_FILTER_OPTIONS':
      return {
        ...state,
        filterOptions: {
          ...state.filterOptions,
          ...action.payload,
        },
      };

    case 'SET_UI_STATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload,
        },
      };

    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload,
        },
      };

    case 'SET_VIEW_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          viewMode: action.payload,
        },
      };

    case 'TOGGLE_MOBILE_FILTERS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showMobileFilters: !state.ui.showMobileFilters,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload,
        },
      };

    case 'SET_LOADING_MORE':
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoadingMore: action.payload,
        },
      };

    default:
      return state;
  }
}
