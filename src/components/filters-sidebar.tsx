"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Building2,
  MapPin,
  User,
  Briefcase,
  Users,
  Heart,
  X,
  Grid3X3,
  List,
} from "lucide-react";

interface FilterOption {
  value: string;
  count: number;
}

interface FiltersSidebarProps {
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

export function FiltersSidebar(props: FiltersSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, ID, designation..."
            value={props.searchQuery}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Department Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Department
        </label>
        <Select value={props.selectedDept} onValueChange={props.onDeptChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {props.departments.map((dept) => (
              <SelectItem key={dept.value} value={dept.value}>
                {dept.value} ({dept.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grade Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <User className="h-4 w-4" />
          Grade
        </label>
        <Select value={props.selectedGrade} onValueChange={props.onGradeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {props.grades.map((grade) => (
              <SelectItem key={grade.value} value={grade.value}>
                {grade.value} ({grade.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Category
        </label>
        <Select value={props.selectedCategory} onValueChange={props.onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {props.categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.value} ({category.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gender and Blood Group Filters - In One Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gender
          </label>
          <Select value={props.selectedGender} onValueChange={props.onGenderChange}>
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
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Blood Group
          </label>
          <Select value={props.selectedBloodGroup} onValueChange={props.onBloodGroupChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {props.bloodGroups.map((bloodGroup) => (
                <SelectItem key={bloodGroup.value} value={bloodGroup.value}>
                  {bloodGroup.value} ({bloodGroup.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="pt-4 border-t">
        <Button
          variant="outline"
          onClick={props.onClearFilters}
          className="w-full flex items-center justify-center gap-2"
        >
          <X className="h-4 w-4" />
          <span>Clear All</span>
        </Button>
      </div>
    </div>
  );
}
