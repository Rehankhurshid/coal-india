"use client";

import React, { useState } from 'react';
import { useDirectory } from '../store/directory.context';
import { useDirectorySearch } from '../hooks/use-directory-search';
import { EmployeeList } from '@/components/employee-list';
import { FiltersSidebar } from '@/components/filters-sidebar';
import { Filters } from '@/components/filters';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X, Grid3X3, List, MessageSquare, IdCard } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { EmployeeIDCardViewer } from '@/components/ui/employee-id-card-viewer';

export function DirectoryContent() {
  const { employee } = useAuth();
  const { state, loadMoreEmployees, setFilter, clearFilters, setViewMode, toggleMobileFilters } = useDirectory();
  const { searchInput, onSearchChange } = useDirectorySearch();
  const [showUserIDCard, setShowUserIDCard] = useState(false);
  
  const {
    employees,
    filters,
    filterOptions,
    ui: { viewMode, showMobileFilters, isLoading, isLoadingMore, hasMore },
    pagination: { totalCount },
  } = state;

  return (
    <div id="scrollableDiv" className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              {/* Filters */}
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
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
                  </div>
                </div>
                
                {/* Employee Count */}
                <div className="mb-4 text-center text-sm text-muted-foreground">
                  {totalCount} employees
                </div>
              
                <FiltersSidebar
                  searchQuery={searchInput}
                  onSearchChange={onSearchChange}
                  selectedDept={filters.selectedDept}
                  onDeptChange={(value) => setFilter('selectedDept', value)}
                  selectedGrade={filters.selectedGrade}
                  onGradeChange={(value) => setFilter('selectedGrade', value)}
                  selectedCategory={filters.selectedCategory}
                  onCategoryChange={(value) => setFilter('selectedCategory', value)}
                  selectedGender={filters.selectedGender}
                  onGenderChange={(value) => setFilter('selectedGender', value)}
                  selectedBloodGroup={filters.selectedBloodGroup}
                  onBloodGroupChange={(value) => setFilter('selectedBloodGroup', value)}
                  onClearFilters={clearFilters}
                  totalEmployees={totalCount}
                  filteredEmployees={employees.length}
                  departments={filterOptions.departments}
                  grades={filterOptions.grades}
                  categories={filterOptions.categories}
                  bloodGroups={filterOptions.bloodGroups}
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Welcome Message */}
            {employee && (
              <>
                <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Welcome, {employee.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {employee.designation} • {employee.dept} • {employee.emp_code}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserIDCard(true)}
                    className="ml-4 flex items-center gap-2"
                  >
                    <IdCard className="h-4 w-4" />
                    <span className="hidden sm:inline">View ID</span>
                  </Button>
                </div>
                
                {/* User ID Card Viewer */}
                <EmployeeIDCardViewer
                  employee={{
                    name: employee.name,
                    designation: employee.designation,
                    emp_code: employee.emp_code,
                    grade: employee.grade,
                    profile_image: employee.profile_image,
                    dept: employee.dept,
                    area_name: employee.area_name,
                  }}
                  open={showUserIDCard}
                  onOpenChange={setShowUserIDCard}
                />
              </>
            )}

            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
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
                  onClick={toggleMobileFilters}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
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
              scrollableTarget="scrollableDiv"
            />
          </div>
        </div>
      </div>

      {/* Mobile Floating Buttons */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Messaging Button */}
        <Link href="/messaging">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-12 w-12 p-0 bg-blue-600 hover:bg-blue-700"
            title="Messages"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </Link>
        
        {/* Filter Button */}
        <div className="relative">
          <Button 
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 p-0"
            onClick={toggleMobileFilters}
          >
            <SlidersHorizontal className="h-6 w-6" />
          </Button>
          {/* Active filters badge */}
          {(filters.selectedDept !== "all" || filters.selectedGrade !== "all" || 
            filters.selectedCategory !== "all" || filters.selectedGender !== "all" || filters.selectedBloodGroup !== "all" || 
            searchInput) && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {[filters.selectedDept, filters.selectedGrade, filters.selectedCategory, filters.selectedGender, filters.selectedBloodGroup]
                .filter(val => val !== "all").length + (searchInput ? 1 : 0)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70" onClick={toggleMobileFilters} />
          <div className="relative bg-background border-border rounded-t-xl w-full max-h-[85vh] overflow-hidden shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileFilters}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
              <div className="mb-4 text-center text-sm text-muted-foreground">
                {totalCount} employees
              </div>
              <Filters
                searchQuery={searchInput}
                onSearchChange={onSearchChange}
                selectedDept={filters.selectedDept}
                onDeptChange={(value) => setFilter('selectedDept', value)}
                selectedGrade={filters.selectedGrade}
                onGradeChange={(value) => setFilter('selectedGrade', value)}
                selectedCategory={filters.selectedCategory}
                onCategoryChange={(value) => setFilter('selectedCategory', value)}
                selectedGender={filters.selectedGender}
                onGenderChange={(value) => setFilter('selectedGender', value)}
                selectedBloodGroup={filters.selectedBloodGroup}
                onBloodGroupChange={(value) => setFilter('selectedBloodGroup', value)}
                onClearFilters={clearFilters}
                totalEmployees={totalCount}
                filteredEmployees={employees.length}
                departments={filterOptions.departments}
                grades={filterOptions.grades}
                categories={filterOptions.categories}
                bloodGroups={filterOptions.bloodGroups}
              />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <Button 
                className="w-full"
                onClick={toggleMobileFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
