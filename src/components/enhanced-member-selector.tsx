"use client"

import { useState, useMemo } from "react"
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
} from "lucide-react"
import { UserPresenceIndicator } from "./user-presence-indicator"
import { useUserPresence } from "../hooks/use-user-presence"
import { MobileMemberSelector } from "./mobile-member-selector"
import { useIsMobile } from "../hooks/use-mobile"
import { Employee } from "@/types/messaging"

interface EnhancedMemberSelectorProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedEmployees: Employee[]) => void
  initialSelected?: Employee[]
  title?: string
  description?: string
  maxSelection?: number
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "A CHINNA GANGAIYA",
    initials: "AC",
    employeeId: "21497979",
    designation: "EP FITTER",
    department: "EXCAVATION",
    location: "Gevra Area",
    grade: "E1",
    category: "Technical",
    gender: "Male",
    isStarred: true,
  },
  {
    id: "2",
    name: "A K YADAV",
    initials: "AK",
    employeeId: "21468962",
    designation: "EP FITTER",
    department: "EXCAVATION",
    location: "Gevra Area",
    grade: "E1",
    category: "Technical",
    gender: "Male",
  },
  {
    id: "3",
    name: "A P PANDEY",
    initials: "AP",
    employeeId: "22605844",
    designation: "EP FITTER",
    department: "ELECT. & MECH",
    location: "Gevra Area",
    grade: "E2",
    category: "Technical",
    gender: "Male",
    isStarred: true,
  },
  {
    id: "4",
    name: "A S Ramseshaya",
    initials: "AS",
    employeeId: "90082355",
    designation: "General Manager",
    department: "SAFETY & CONSV.",
    location: "Gevra Area",
    grade: "E8",
    category: "Management",
    gender: "Male",
  },
  {
    id: "5",
    name: "A.Chandra Shekhar",
    initials: "AS",
    employeeId: "90263971",
    designation: "Manager",
    department: "EXCAVATION",
    location: "Gevra Area",
    grade: "E7",
    category: "Management",
    gender: "Male",
  },
  {
    id: "6",
    name: "B KUMAR SINGH",
    initials: "BK",
    employeeId: "21497980",
    designation: "TECHNICIAN",
    department: "ELECT. & MECH",
    location: "Gevra Area",
    grade: "E3",
    category: "Technical",
    gender: "Male",
  },
  {
    id: "7",
    name: "C PRIYA SHARMA",
    initials: "CP",
    employeeId: "21497981",
    designation: "HR EXECUTIVE",
    department: "HUMAN RESOURCES",
    location: "Gevra Area",
    grade: "E4",
    category: "Administrative",
    gender: "Female",
    isStarred: true,
  },
  {
    id: "8",
    name: "D RAJESH KUMAR",
    initials: "DR",
    employeeId: "21497982",
    designation: "SAFETY OFFICER",
    department: "SAFETY & CONSV.",
    location: "Gevra Area",
    grade: "E5",
    category: "Safety",
    gender: "Male",
  },
]

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

  const { getUserStatus } = useUserPresence()
  const isMobile = useIsMobile()

  // Enhanced filtering and sorting logic
  const filteredAndSortedEmployees = useMemo(() => {
    const filtered = mockEmployees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.employeeId.includes(searchQuery) ||
        employee.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilters =
        (filters.department === "all" || employee.department === filters.department) &&
        (filters.location === "all" || employee.location === filters.location) &&
        (filters.grade === "all" || employee.grade === filters.grade) &&
        (filters.category === "all" || employee.category === filters.category) &&
        (filters.gender === "all" || employee.gender === filters.gender)

      const userStatus = getUserStatus(employee.id)
      const matchesStatus = filters.status === "all" || userStatus === filters.status

      const matchesView =
        viewMode === "all" ||
        (viewMode === "starred" && employee.isStarred) ||
        (viewMode === "recent" && Math.random() > 0.5) // Mock recent logic

      return matchesSearch && matchesFilters && matchesStatus && matchesView
    })

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
  }, [searchQuery, filters, viewMode, sortBy, selectedEmployees, getUserStatus])

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

  const departments = [...new Set(mockEmployees.map((emp) => emp.department))]
  const locations = [...new Set(mockEmployees.map((emp) => emp.location))]
  const grades = [...new Set(mockEmployees.map((emp) => emp.grade))]
  const categories = [...new Set(mockEmployees.map((emp) => emp.category))]

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
                {maxSelection && (
                  <Badge variant="outline" className="ml-2">
                    {selectedEmployees.length}/{maxSelection}
                  </Badge>
                )}
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
                            <SelectItem key={dept} value={dept}>
                              {dept}
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
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Status</label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="away">Away</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium">View:</label>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant={viewMode === "all" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("all")}
                          >
                            All
                          </Button>
                          <Button
                            variant={viewMode === "starred" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("starred")}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Starred
                          </Button>
                        </div>
                      </div>

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
                  <span className="text-sm font-medium">{filteredAndSortedEmployees.length} results</span>
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
                  {maxSelection && ` of ${maxSelection}`}
                </div>
              </div>
            </div>

            <Separator />

            {/* Employee List */}
            <ScrollArea className="flex-1 overflow-auto min-h-0">
              <div className="px-6 py-4 space-y-2">
                {filteredAndSortedEmployees.map((employee) => {
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

                {filteredAndSortedEmployees.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No employees found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
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
