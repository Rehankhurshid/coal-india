"use client";

import * as React from "react";
import { supabase, Employee } from "@/lib/supabase";
import { Filters } from "@/components/filters";
import { FiltersSidebar } from "@/components/filters-sidebar";
import { EmployeeList } from "@/components/employee-list";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X, LogOut, Grid3X3, List } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

export default function Home() {
  const { employee, logout } = useAuth();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Prevent body scroll when mobile filters are open
  React.useEffect(() => {
    if (showMobileFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileFilters]);

  const PAGE_SIZE = 50; // Load 50 employees at a time

  // Filter states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDept, setSelectedDept] = React.useState('all');
  const [selectedGrade, setSelectedGrade] = React.useState('all');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedGender, setSelectedGender] = React.useState('all');
  const [selectedBloodGroup, setSelectedBloodGroup] = React.useState('all');

  // Debug environment variables
  React.useEffect(() => {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, []);

  // Fetch employees from Supabase with pagination and filtering
  const fetchEmployees = React.useCallback(async (
    page: number = 0, 
    reset: boolean = false,
    filters?: {
      searchQuery?: string;
      selectedDept?: string;
      selectedGrade?: string;
      selectedCategory?: string;
      selectedGender?: string;
      selectedBloodGroup?: string;
    }
  ) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      console.log(`Fetching employees page ${page} with filters:`, filters);
      
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      let query = supabase
        .from("employees")
        .select("*", { count: 'exact' })
        .order("name", { ascending: true });

      // Apply filters
      if (filters) {
        // Search filter
        if (filters.searchQuery && filters.searchQuery.trim()) {
          const searchTerm = filters.searchQuery.trim();
          query = query.or(`name.ilike.%${searchTerm}%,emp_code.ilike.%${searchTerm}%,designation.ilike.%${searchTerm}%,dept.ilike.%${searchTerm}%`);
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

      console.log(`Query result - page ${page}, count:`, count, 'data length:', data?.length, 'error:', error);

      if (error) {
        console.error("Error fetching employees:", error);
        return;
      }

      if (reset) {
        setEmployees(data || []);
        setCurrentPage(0);
      } else {
        setEmployees(prev => {
          const newEmployees = [...prev, ...(data || [])];
          console.log(`Page ${page} loaded. Total employees: ${newEmployees.length}/${count}`);
          return newEmployees;
        });
        setCurrentPage(page);
      }
      
      setTotalCount(count || 0);
      setHasMore((data?.length || 0) === PAGE_SIZE && (from + PAGE_SIZE) < (count || 0));
      
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []); // Remove the dependency on employees.length

  // Load more employees with current filters
  const loadMoreEmployees = React.useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      const currentFilters = {
        searchQuery,
        selectedDept,
        selectedGrade,
        selectedCategory,
        selectedGender,
        selectedBloodGroup
      };
      await fetchEmployees(currentPage + 1, false, currentFilters);
    }
  }, [fetchEmployees, currentPage, isLoadingMore, hasMore, searchQuery, selectedDept, selectedGrade, selectedCategory, selectedGender, selectedBloodGroup]);

  // Fetch fresh data when filters change (server-side filtering)
  React.useEffect(() => {
    const currentFilters = {
      searchQuery,
      selectedDept,
      selectedGrade,
      selectedCategory,
      selectedGender,
      selectedBloodGroup
    };
    
    // Reset pagination and fetch fresh data with filters
    fetchEmployees(0, true, currentFilters);
  }, [
    fetchEmployees,
    searchQuery,
    selectedDept,
    selectedGrade,
    selectedCategory,
    selectedGender,
    selectedBloodGroup,
  ]);

  // Clear all filters
  const clearFilters = React.useCallback(() => {
    setSearchQuery("");
    setSelectedDept("all");
    setSelectedGrade("all");
    setSelectedCategory("all");
    setSelectedGender("all");
    setSelectedBloodGroup("all");
  }, []);

  // Filter options state with counts
  const [departments, setDepartments] = React.useState<{value: string, count: number}[]>([]);
  const [grades, setGrades] = React.useState<{value: string, count: number}[]>([]);
  const [categories, setCategories] = React.useState<{value: string, count: number}[]>([]);
  const [bloodGroups, setBloodGroups] = React.useState<{value: string, count: number}[]>([]);

  // Fetch filter options from database with dynamic counts
  const fetchFilterOptions = React.useCallback(async (currentFilters?: {
    searchQuery?: string;
    selectedDept?: string;
    selectedGrade?: string;
    selectedCategory?: string;
    selectedGender?: string;
    selectedBloodGroup?: string;
  }) => {
    try {
      console.log('Fetching filter options with counts...');
      
      // Use current filters if not provided
      const filters = currentFilters || {
        searchQuery,
        selectedDept,
        selectedGrade,
        selectedCategory,
        selectedGender,
        selectedBloodGroup
      };

      // Fetch counts for each filter option based on current selection
      const fetchFilterCounts = async (filterType: string, excludeFilter?: string) => {
        let query = supabase
          .from('employees')
          .select(filterType, { count: 'exact' })
          .not(filterType, 'is', null);

        // Apply all filters except the one we're counting
        if (filters.searchQuery && filters.searchQuery.trim()) {
          const searchTerm = filters.searchQuery.trim();
          query = query.or(`name.ilike.%${searchTerm}%,emp_code.ilike.%${searchTerm}%,designation.ilike.%${searchTerm}%,dept.ilike.%${searchTerm}%`);
        }

        if (excludeFilter !== 'dept' && filters.selectedDept && filters.selectedDept !== 'all') {
          query = query.eq('dept', filters.selectedDept);
        }

        if (excludeFilter !== 'grade' && filters.selectedGrade && filters.selectedGrade !== 'all') {
          query = query.eq('grade', filters.selectedGrade);
        }

        if (excludeFilter !== 'category' && filters.selectedCategory && filters.selectedCategory !== 'all') {
          query = query.eq('category', filters.selectedCategory);
        }

        if (excludeFilter !== 'gender' && filters.selectedGender && filters.selectedGender !== 'all') {
          query = query.eq('gender', filters.selectedGender);
        }

        if (excludeFilter !== 'blood_group' && filters.selectedBloodGroup && filters.selectedBloodGroup !== 'all') {
          query = query.eq('blood_group', filters.selectedBloodGroup);
        }

        const { data } = await query;
        
        // Count occurrences
        const counts = new Map<string, number>();
        data?.forEach(item => {
          const value = (item as any)[filterType];
          if (value) {
            counts.set(value, (counts.get(value) || 0) + 1);
          }
        });

        return Array.from(counts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => a.value.localeCompare(b.value));
      };

      const [deptCounts, gradeCounts, categoryCounts, bloodGroupCounts] = await Promise.all([
        fetchFilterCounts('dept', 'dept'),
        fetchFilterCounts('grade', 'grade'),
        fetchFilterCounts('category', 'category'),
        fetchFilterCounts('blood_group', 'blood_group'),
      ]);

      setDepartments(deptCounts);
      setGrades(gradeCounts);
      setCategories(categoryCounts);
      setBloodGroups(bloodGroupCounts);
      
      console.log('Filter options with counts loaded', {
        departments: deptCounts.length,
        grades: gradeCounts.length,
        categories: categoryCounts.length,
        bloodGroups: bloodGroupCounts.length
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, [searchQuery, selectedDept, selectedGrade, selectedCategory, selectedGender, selectedBloodGroup]);

  // Initialize filter options
  React.useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Update filter counts when any filter changes
  React.useEffect(() => {
    const currentFilters = {
      searchQuery,
      selectedDept,
      selectedGrade,
      selectedCategory,
      selectedGender,
      selectedBloodGroup
    };
    
    fetchFilterOptions(currentFilters);
  }, [searchQuery, selectedDept, selectedGrade, selectedCategory, selectedGender, selectedBloodGroup, fetchFilterOptions]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Main Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Filters
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex border rounded-md">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-r-none px-2"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-l-none px-2"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-gray-500">
                      {totalCount} employees
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              
              <FiltersSidebar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedDept={selectedDept}
                onDeptChange={setSelectedDept}
                selectedGrade={selectedGrade}
                onGradeChange={setSelectedGrade}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedGender={selectedGender}
                onGenderChange={setSelectedGender}
                selectedBloodGroup={selectedBloodGroup}
                onBloodGroupChange={setSelectedBloodGroup}
                onClearFilters={clearFilters}
                totalEmployees={totalCount}
                filteredEmployees={employees.length}
                departments={departments}
                grades={grades}
                categories={categories}
                bloodGroups={bloodGroups}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Welcome Message */}
            {employee && (
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Welcome, {employee.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {employee.designation} • {employee.dept} • {employee.emp_code}
                </p>
              </div>
            )}

            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {totalCount} employees
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none px-3"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Employee List */}
            <EmployeeList
              employees={employees}
              viewMode={viewMode}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={loadMoreEmployees}
              totalCount={totalCount}
            />
          </div>
        </div>
      </div>

      {/* Mobile Floating Filter Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <div className="relative">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
            onClick={() => setShowMobileFilters(true)}
          >
            <SlidersHorizontal className="h-6 w-6" />
          </Button>
          {/* Active filters badge */}
          {(selectedDept !== "all" || selectedGrade !== "all" || 
            selectedCategory !== "all" || selectedGender !== "all" || selectedBloodGroup !== "all" || 
            searchQuery) && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {[selectedDept, selectedGrade, selectedCategory, selectedGender, selectedBloodGroup]
                .filter(val => val !== "all").length + (searchQuery ? 1 : 0)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)} />
          <div className="relative bg-white rounded-t-xl w-full max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
              <div className="mb-4 text-center text-sm text-gray-500">
                {totalCount} employees
              </div>
              <Filters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedDept={selectedDept}
                onDeptChange={setSelectedDept}
                selectedGrade={selectedGrade}
                onGradeChange={setSelectedGrade}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedGender={selectedGender}
                onGenderChange={setSelectedGender}
                selectedBloodGroup={selectedBloodGroup}
                onBloodGroupChange={setSelectedBloodGroup}
                onClearFilters={clearFilters}
                totalEmployees={totalCount}
                filteredEmployees={employees.length}
                departments={departments}
                grades={grades}
                categories={categories}
                bloodGroups={bloodGroups}
              />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <Button 
                className="w-full"
                onClick={() => setShowMobileFilters(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
