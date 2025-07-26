"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Filter,
  X,
  Users,
  ChevronDown,
  UserPlus,
  Building2,
  MapPin,
  Star,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react"
import { UserPresenceIndicator } from "./user-presence-indicator"
import { useUserPresence } from "../hooks/use-user-presence"
import { MobileMemberSelector } from "./mobile-member-selector"
import { useIsMobile } from "../hooks/use-mobile"
import { supabase, Employee as SupabaseEmployee } from "@/lib/supabase"

// Map Supabase Employee to our internal Employee type
interface Employee {
  id: string
  name: string
  initials: string
  employeeId: string
  designation: string
  department: string
  location: string
  grade: string
  category: string
  gender: string
  isStarred?: boolean
}

interface EnhancedMemberSelectorProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedEmployees: Employee[]) => void
  initialSelected?: Employee[]
  title?: string
  description?: string
  maxSelection?: number
}

// Transform Supabase employee to our format
const transformEmployee = (emp: SupabaseEmployee): Employee => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return {
    id: emp.id.toString(),
    name: emp.name || '',
    initials: getInitials(emp.name || ''),
    employeeId: emp.emp_code || '',
    designation: emp.designation || '',
    department: emp.dept || '',
    location: emp.area_name || '',
    grade: emp.grade || '',
    category: emp.category || '',
    gender: emp.gender || '',
  }
}

export function EnhancedMemberSelector({
  isOpen,
  onClose,
  onConfirm,
  initialSelected = [],
  title = "Select Team Members",
  description = "Choose team members to add to your group",
  maxSelection,
}: EnhancedMemberSelectorProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>(initialSelected)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"all" | "starred" | "recent">("all")
  const [sortBy, setSortBy] = useState<"name" | "department" | "grade">("name")
  const [filters, setFilters] = useState({
    department: "all",
    location: "all",
    grade: "all",
    category: "all",
    gender: "all",
    status: "all",
  })

  // Supabase data
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [departments, setDepartments] = useState<{value: string, count: number}[]>([])
  const [locations, setLocations] = useState<{value: string, count: number}[]>([])
  const [grades, setGrades] = useState<{value: string, count: number}[]>([])
  const [categories, setCategories] = useState<{value: string, count: number}[]>([])

  const PAGE_SIZE = 50

  const { getUserStatus } = useUserPresence()
  const isMobile = useIsMobile()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch employees from Supabase with pagination
  const fetchEmployees = useCallback(async (page = 0, reset = false) => {
    try {
      if (reset) {
        setIsLoading(true)
        setCurrentPage(0)
      } else {
        setIsLoadingMore(true)
      }
      
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      
      let query = supabase
        .from("employees")
        .select("*", { count: 'exact' })
        .order("name", { ascending: true })
        .range(from, to)

      // Apply search filter
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        const searchTerm = debouncedSearchQuery.trim()
        query = query.or(`name.ilike.%${searchTerm}%,emp_code.ilike.%${searchTerm}%,designation.ilike.%${searchTerm}%,dept.ilike.%${searchTerm}%`)
      }

      // Apply filters
      if (filters.department !== 'all') {
        query = query.eq('dept', filters.department)
      }
      if (filters.location !== 'all') {
        query = query.eq('area_name', filters.location)
      }
      if (filters.grade !== 'all') {
        query = query.eq('grade', filters.grade)
      }
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters.gender !== 'all') {
        query = query.eq('gender', filters.gender)
      }

      const { data, error, count } = await query

      if (error) {
        console.error("Error fetching employees:", error)
        return
      }

      const transformedEmployees = (data || []).map(transformEmployee)
      
      if (reset) {
        setEmployees(transformedEmployees)
      } else {
        setEmployees(prev => [...prev, ...transformedEmployees])
      }
      
      setTotalCount(count || 0)
      setHasMore((data?.length || 0) === PAGE_SIZE && (from + PAGE_SIZE) < (count || 0))
      setCurrentPage(page)
      
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [debouncedSearchQuery, filters])

  // Load more function
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchEmployees(currentPage + 1, false)
    }
  }, [currentPage, fetchEmployees, hasMore, isLoadingMore])

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      // Fetch unique values for each filter
      const [deptResult, locationResult, gradeResult, categoryResult] = await Promise.all([
        supabase.from('employees').select('dept').not('dept', 'is', null),
        supabase.from('employees').select('area_name').not('area_name', 'is', null),
        supabase.from('employees').select('grade').not('grade', 'is', null),
        supabase.from('employees').select('category').not('category', 'is', null),
      ])

      // Process departments
      const deptCounts = new Map<string, number>()
      deptResult.data?.forEach(item => {
        if (item.dept) {
          deptCounts.set(item.dept, (deptCounts.get(item.dept) || 0) + 1)
        }
      })
      setDepartments(
        Array.from(deptCounts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => a.value.localeCompare(b.value))
      )

      // Process locations
      const locationCounts = new Map<string, number>()
      locationResult.data?.forEach(item => {
        if (item.area_name) {
          locationCounts.set(item.area_name, (locationCounts.get(item.area_name) || 0) + 1)
        }
      })
      setLocations(
        Array.from(locationCounts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => a.value.localeCompare(b.value))
      )

      // Process grades
      const gradeCounts = new Map<string, number>()
      gradeResult.data?.forEach(item => {
        if (item.grade) {
          gradeCounts.set(item.grade, (gradeCounts.get(item.grade) || 0) + 1)
        }
      })
      setGrades(
        Array.from(gradeCounts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => a.value.localeCompare(b.value))
      )

      // Process categories
      const categoryCounts = new Map<string, number>()
      categoryResult.data?.forEach(item => {
        if (item.category) {
          categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1)
        }
      })
      setCategories(
        Array.from(categoryCounts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => a.value.localeCompare(b.value))
      )
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    if (isOpen) {
      fetchEmployees(0, true)
      fetchFilterOptions()
    }
  }, [isOpen, fetchEmployees, fetchFilterOptions])

  // Refetch when filters change
  useEffect(() => {
    if (isOpen) {
      fetchEmployees(0, true)
    }
  }, [debouncedSearchQuery, filters, fetchEmployees])

  // Enhanced filtering and sorting logic
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = [...employees]

    // Apply view mode filter
    if (viewMode === "starred") {
      filtered = filtered.filter(emp => emp.isStarred)
    } else if (viewMode === "recent") {
      // For now, just show the first 20 as "recent"
      filtered = filtered.slice(0, 20)
    }

    // Sort the filtered results
    filtered.sort((a, b) => {
      // Always show selected items first
      const aSelected = selectedEmployees.some((emp) => emp.id === a.id)
      const bSelected = selectedEmployees.some((emp) => emp.id === b.id)

      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1

      // Then show starred items
      if (a.isStarred && !b.isStarred) return -1
      if (!a.isStarred && b.isStarred) return 1

      // Then sort by selected criteria
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "department":
          return a.department.localeCompare(b.department)
        case "grade":
          return a.grade.localeCompare(b.grade)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [employees, viewMode, sortBy, selectedEmployees])

  const handleEmployeeToggle = (employee: Employee) => {
    setSelectedEmployees((prev) => {
      const isSelected = prev.some((emp) => emp.id === employee.id)
      if (isSelected) {
        return prev.filter((emp) => emp.id !== employee.id)
      } else {
        if (maxSelection && prev.length >= maxSelection) {
          return prev // Don't add if max reached
        }
        return [...prev, employee]
      }
    })
  }

  const handleSelectAll = () => {
    const visibleUnselected = filteredAndSortedEmployees.filter(
      (emp) => !selectedEmployees.some((selected) => selected.id === emp.id),
    )

    if (visibleUnselected.length === 0) {
      // Deselect all visible
      setSelectedEmployees((prev) =>
        prev.filter((emp) => !filteredAndSortedEmployees.some((visible) => visible.id === emp.id)),
      )
    } else {
      // Select all visible (respecting max limit)
      const toAdd = maxSelection
        ? visibleUnselected.slice(0, maxSelection - selectedEmployees.length)
        : visibleUnselected

      setSelectedEmployees((prev) => [...prev, ...toAdd])
    }
  }

  const handleRemoveSelected = (employeeId: string) => {
    setSelectedEmployees((prev) => prev.filter((emp) => emp.id !== employeeId))
  }

  const clearFilters = () => {
    setFilters({
      department: "all",
      location: "all",
      grade: "all",
      category: "all",
      gender: "all",
      status: "all",
    })
    setSearchQuery("")
    setViewMode("all")
  }

  const getFilterCount = () => {
    return Object.values(filters).filter((value) => value !== "all").length + (searchQuery ? 1 : 0)
  }

  // Use mobile component on mobile devices
  if (isMobile) {
    return (
      <MobileMemberSelector
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        initialSelected={initialSelected}
        title={title}
        description={description}
        maxSelection={maxSelection}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[90vw] max-w-[90vw] min-w-[80vw] p-0">
        <div className="flex h-[85vh] overflow-hidden">
          {/* Main Selection Area */}
          <div className={`flex flex-col min-w-0 transition-all duration-200 ${selectedEmployees.length > 0 ? 'flex-[2]' : 'flex-1'}`}>
            <DialogHeader className="p-6 pb-4 flex-shrink-0">
              <DialogTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>{title}</span>
              </DialogTitle>
              <p className="text-muted-foreground">{description}</p>
            </DialogHeader>

            {/* Search and Controls */}
            <div className="px-6 space-y-4 flex-shrink-0">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, designation, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {getFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {getFilterCount()}
                    </Badge>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </Button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Department</label>
                      <Select
                        value={filters.department}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
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

                    <div>
                      <label className="text-sm font-medium mb-1 block">Location</label>
                      <Select
                        value={filters.location}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, location: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {locations.map((loc) => (
                            <SelectItem key={loc.value} value={loc.value}>
                              {loc.value} ({loc.count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Grade</label>
                      <Select
                        value={filters.grade}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, grade: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
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

                    <div>
                      <label className="text-sm font-medium mb-1 block">Category</label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.value} ({cat.count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Gender</label>
                      <Select
                        value={filters.gender}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">Sort by:</label>
                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="department">Department</SelectItem>
                            <SelectItem value="grade">Grade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>
                </div>
              )}

              {/* Results Summary and Bulk Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">
                    {totalCount > 0 ? (
                      <>{employees.length} of {totalCount} employees loaded</>
                    ) : (
                      <>{filteredAndSortedEmployees.length} results</>
                    )}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-sm">
                    {filteredAndSortedEmployees.every((emp) =>
                      selectedEmployees.some((selected) => selected.id === emp.id),
                    )
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedEmployees.length} selected
                </div>
              </div>
            </div>

            <Separator />

            {/* Employee List */}
            <ScrollArea className="flex-1 overflow-auto min-h-0">
              <div className="px-6 py-4 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAndSortedEmployees.map((employee) => {
                  const isSelected = selectedEmployees.some((emp) => emp.id === employee.id)
                  const userStatus = getUserStatus(employee.id)

                  return (
                    <div
                      key={employee.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all hover:bg-accent cursor-pointer ${
                        isSelected ? "bg-primary/5 border-primary/20" : "border-transparent hover:border-border"
                      }`}
                      onClick={() => handleEmployeeToggle(employee)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="relative">
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>

                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-muted text-sm font-medium">
                                {employee.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                              <UserPresenceIndicator status={userStatus} size="sm" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium truncate text-sm">{employee.name}</p>
                              {employee.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span className="truncate">{employee.employeeId}</span>
                              <span className="flex-shrink-0">•</span>
                              <span className="truncate">{employee.designation}</span>
                            </div>
                            <div className="flex items-center space-x-3 mt-1 flex-wrap">
                              <div className="flex items-center space-x-1 min-w-0">
                                <Building2 className="w-3 h-3 flex-shrink-0" />
                                <span className="text-xs truncate">{employee.department}</span>
                              </div>
                              <div className="flex items-center space-x-1 min-w-0">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="text-xs truncate">{employee.location}</span>
                              </div>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {employee.grade}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {!isLoading && filteredAndSortedEmployees.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No employees found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                  </div>
                )}

                {/* Load More Button */}
                {!isLoading && hasMore && filteredAndSortedEmployees.length > 0 && (
                  <div className="flex items-center justify-center py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}

                {/* Loading More Indicator */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-6 pt-4 border-t flex-shrink-0">
              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => onConfirm(selectedEmployees)}
                  disabled={selectedEmployees.length === 0}
                  className="min-w-32"
                >
                  Add {selectedEmployees.length} Member{selectedEmployees.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Members Sidebar */}
          {selectedEmployees.length > 0 && (
            <div className="w-80 border-l bg-muted/20 flex-shrink-0 flex flex-col">
              <div className="p-4 border-b flex-shrink-0">
                <h3 className="font-semibold flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Selected Members</span>
                  <Badge variant="secondary">{selectedEmployees.length}</Badge>
                </h3>
              </div>

              <ScrollArea className="flex-1 overflow-auto">
                <div className="p-4 space-y-2">
                  {selectedEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-3 p-2 bg-background rounded-lg border">
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">{employee.initials}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                          <UserPresenceIndicator status={getUserStatus(employee.id)} size="sm" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{employee.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{employee.designation}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveSelected(employee.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
