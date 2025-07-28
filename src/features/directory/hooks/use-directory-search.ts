import { useState, useEffect, useCallback } from 'react';
import { useDirectory } from '../store/directory.context';

export function useDirectorySearch() {
  const { state, setFilter } = useDirectory();
  const [searchInput, setSearchInput] = useState(state.filters.searchQuery);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilter('searchQuery', searchInput);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, setFilter]);

  // Update local state when context changes (e.g., filters cleared)
  useEffect(() => {
    setSearchInput(state.filters.searchQuery);
  }, [state.filters.searchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  return {
    searchInput,
    searchQuery: state.filters.searchQuery,
    onSearchChange: handleSearchChange,
  };
}
