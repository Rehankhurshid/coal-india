import { supabase } from '@/lib/supabase';
import type { Employee } from '@/lib/supabase';
import type { DirectoryFilters, FilterOption } from '../types';

const PAGE_SIZE = 50;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class DirectoryService {
  private static filterOptionsCache: {
    data: {
      departments: FilterOption[];
      grades: FilterOption[];
      categories: FilterOption[];
      bloodGroups: FilterOption[];
    } | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };

  /**
   * Fetch employees with pagination and filters
   */
  static async fetchEmployees(
    page: number = 0,
    filters?: Partial<DirectoryFilters>
  ) {
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('employees')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true });

      // Apply filters
      if (filters) {
        // Search filter
        if (filters.searchQuery?.trim()) {
          const searchTerm = filters.searchQuery.trim();
          query = query.or(
            `name.ilike.%${searchTerm}%,emp_code.ilike.%${searchTerm}%,designation.ilike.%${searchTerm}%,dept.ilike.%${searchTerm}%`
          );
        }

        // Department filter
        if (filters.selectedDept && filters.selectedDept !== 'all') {
          query = query.eq('dept', filters.selectedDept);
        }

        // Grade filter
        if (filters.selectedGrade && filters.selectedGrade !== 'all') {
          query = query.eq('grade', filters.selectedGrade);
        }

        // Category filter
        if (filters.selectedCategory && filters.selectedCategory !== 'all') {
          query = query.eq('category', filters.selectedCategory);
        }

        // Gender filter
        if (filters.selectedGender && filters.selectedGender !== 'all') {
          query = query.eq('gender', filters.selectedGender);
        }

        // Blood group filter
        if (filters.selectedBloodGroup && filters.selectedBloodGroup !== 'all') {
          query = query.eq('blood_group', filters.selectedBloodGroup);
        }
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        throw error;
      }

      return {
        employees: data || [],
        totalCount: count || 0,
        hasMore: (data?.length || 0) === PAGE_SIZE && from + PAGE_SIZE < (count || 0),
      };
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  /**
   * Fetch filter options with counts based on current filters
   */
  static async fetchFilterOptions(filters?: Partial<DirectoryFilters>) {
    try {
      // Check cache first
      const now = Date.now();
      if (
        this.filterOptionsCache.data &&
        now - this.filterOptionsCache.timestamp < CACHE_DURATION &&
        !filters // Only use cache when no filters are applied
      ) {
        return this.filterOptionsCache.data;
      }

      const fetchFilterCounts = async (
        filterType: string,
        excludeFilter?: string
      ): Promise<FilterOption[]> => {
        let query = supabase
          .from('employees')
          .select(filterType, { count: 'exact' })
          .not(filterType, 'is', null);

        // Apply all filters except the one we're counting
        if (filters?.searchQuery?.trim()) {
          const searchTerm = filters.searchQuery.trim();
          query = query.or(
            `name.ilike.%${searchTerm}%,emp_code.ilike.%${searchTerm}%,designation.ilike.%${searchTerm}%,dept.ilike.%${searchTerm}%`
          );
        }

        if (
          excludeFilter !== 'dept' &&
          filters?.selectedDept &&
          filters.selectedDept !== 'all'
        ) {
          query = query.eq('dept', filters.selectedDept);
        }

        if (
          excludeFilter !== 'grade' &&
          filters?.selectedGrade &&
          filters.selectedGrade !== 'all'
        ) {
          query = query.eq('grade', filters.selectedGrade);
        }

        if (
          excludeFilter !== 'category' &&
          filters?.selectedCategory &&
          filters.selectedCategory !== 'all'
        ) {
          query = query.eq('category', filters.selectedCategory);
        }

        if (
          excludeFilter !== 'gender' &&
          filters?.selectedGender &&
          filters.selectedGender !== 'all'
        ) {
          query = query.eq('gender', filters.selectedGender);
        }

        if (
          excludeFilter !== 'blood_group' &&
          filters?.selectedBloodGroup &&
          filters.selectedBloodGroup !== 'all'
        ) {
          query = query.eq('blood_group', filters.selectedBloodGroup);
        }

        const { data } = await query;

        // Count occurrences
        const counts = new Map<string, number>();
        data?.forEach((item) => {
          const value = (item as any)[filterType];
          if (value) {
            counts.set(value, (counts.get(value) || 0) + 1);
          }
        });

        return Array.from(counts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => a.value.localeCompare(b.value));
      };

      const [departments, grades, categories, bloodGroups] = await Promise.all([
        fetchFilterCounts('dept', 'dept'),
        fetchFilterCounts('grade', 'grade'),
        fetchFilterCounts('category', 'category'),
        fetchFilterCounts('blood_group', 'blood_group'),
      ]);

      const result = {
        departments,
        grades,
        categories,
        bloodGroups,
      };

      // Cache the result if no filters are applied
      if (!filters) {
        this.filterOptionsCache = {
          data: result,
          timestamp: now,
        };
      }

      return result;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }

  /**
   * Clear the filter options cache
   */
  static clearCache() {
    this.filterOptionsCache = { data: null, timestamp: 0 };
  }
}
