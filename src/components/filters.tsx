"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

interface FilterOption {
  value: string;
  count: number;
}

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDept: string;
  onDeptChange: (dept: string) => void;
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedGender: string;
  onGenderChange: (gender: string) => void;
  selectedBloodGroup: string;
  onBloodGroupChange: (bloodGroup: string) => void;
  onClearFilters: () => void;
  totalEmployees: number;
  filteredEmployees: number;
  departments: FilterOption[];
  grades: FilterOption[];
  categories: FilterOption[];
  bloodGroups: FilterOption[];
}

export function Filters({
  searchQuery,
  onSearchChange,
  selectedDept,
  onDeptChange,
  selectedGrade,
  onGradeChange,
  selectedCategory,
  onCategoryChange,
  selectedGender,
  onGenderChange,
  selectedBloodGroup,
  onBloodGroupChange,
  onClearFilters,
  totalEmployees,
  filteredEmployees,
  departments,
  grades,
  categories,
  bloodGroups,
}: FiltersProps) {
  const hasActiveFilters = 
    selectedDept !== "all" ||
    selectedGrade !== "all" ||
    selectedCategory !== "all" ||
    selectedGender !== "all" ||
    selectedBloodGroup !== "all" ||
    searchQuery !== "";

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Department Filter */}
      <div className="space-y-2">
        <Label>Department</Label>
        <Select value={selectedDept} onValueChange={onDeptChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.value} value={dept.value}>
                {dept.value} ({dept.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grade Filter */}
      <div className="space-y-2">
        <Label>Grade</Label>
        <Select value={selectedGrade} onValueChange={onGradeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((grade) => (
              <SelectItem key={grade.value} value={grade.value}>
                {grade.value} ({grade.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.value} ({category.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gender and Blood Group - In One Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={selectedGender} onValueChange={onGenderChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Blood Group</Label>
          <Select value={selectedBloodGroup} onValueChange={onBloodGroupChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {bloodGroups.map((bloodGroup) => (
                <SelectItem key={bloodGroup.value} value={bloodGroup.value}>
                  {bloodGroup.value} ({bloodGroup.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full flex items-center justify-center gap-2"
        >
          <X className="h-4 w-4" />
          <span>Clear All Filters</span>
        </Button>
      )}

      {/* Employee Count */}
      <div className="text-center text-sm text-gray-500 pt-2">
        <Badge variant="secondary" className="text-xs">
          {filteredEmployees} of {totalEmployees} employees
        </Badge>
      </div>
    </div>
  );
}
