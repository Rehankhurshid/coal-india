"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  X,
  Users,
  Building2,
  MapPin,
  Star,
  ArrowLeft,
  Settings2,
  Check,
  History,
  Clock,
  UserCheck,
} from "lucide-react"
import { UserPresenceIndicator } from "./user-presence-indicator"
import { useUserPresence } from "../hooks/use-user-presence"
import { useHaptic } from "../hooks/use-haptic"

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

interface RemovalHistoryItem {
  id: string
  employee: Employee
  removedAt: number
  removedBy: string
}

interface MobileMemberSelectorProps {
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

// Generate more mock employees to simulate 2800+ employees
const generateMockEmployees = (): Employee[] => {
  const baseEmployees = [...mockEmployees]
  const departments = ["EXCAVATION", "ELECT. & MECH", "SAFETY & CONSV.", "HUMAN RESOURCES", "FINANCE", "OPERATIONS"]
  const designations = ["FITTER", "TECHNICIAN", "ENGINEER", "MANAGER", "EXECUTIVE", "OFFICER", "SUPERVISOR"]
  const grades = ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8"]
  const categories = ["Technical", "Management", "Administrative", "Safety"]

  for (let i = 9; i <= 100; i++) {
    // Generate 100 employees for demo
    const firstName = String.fromCharCode(65 + (i % 26))
    const lastName = `Employee ${i}`
    baseEmployees.push({
      id: i.toString(),
      name: `${firstName} ${lastName}`,
      initials: `${firstName}${lastName.charAt(0)}`,
      employeeId: `2149${7980 + i}`,
      designation: designations[i % designations.length],
      department: departments[i % departments.length],
      location: "Gevra Area",
      grade: grades[i % grades.length],
      category: categories[i % categories.length],
      gender: i % 3 === 0 ? "Female" : "Male",
      isStarred: i % 10 === 0,
    })
  }

  return baseEmployees
}

const allEmployees = generateMockEmployees()

export function MobileMemberSelector({
  isOpen,
  onClose,
  onConfirm,
  initialSelected = [],
  title = "Select Team Members",
  description = "Choose team members to add to your group",
  maxSelection,
}: MobileMemberSelectorProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>(initialSelected)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "selected" | "history">("all")
  const [viewMode, setViewMode] = useState<"all" | "starred" | "recent">("all")
  const [sortBy, setSortBy] = useState<"name" | "department" | "grade">("name")
  const [quickFilter, setQuickFilter] = useState<string | null>(null)
  const [removalHistory, setRemovalHistory] = useState<RemovalHistoryItem[]>([])
  const [filters, setFilters] = useState({
    department: "all",
    location: "all",
    grade: "all",
    category: "all",
    gender: "all",
    status: "all",
  })

  const { getUserStatus } = useUserPresence()
  const { triggerHaptic } = useHaptic()

  // Quick filter options
  const quickFilters = [
    { id: "online", label: "Online Only", icon: UserCheck, count: 45 },
    { id: "starred", label: "Starred", icon: Star, count: 12 },
    { id: "my-dept", label: "My Department", icon: Building2, count: 23 },
    { id: "recent", label: "Recently Added", icon: Clock, count: 8 },
    { id: "management", label: "Management", icon: Users, count: 15 },
  ]

  // Enhanced filtering and sorting logic
  const filteredAndSortedEmployees = useMemo(() => {
    const filtered = allEmployees.filter((employee) => {
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
        (viewMode === "recent" && Math.random() > 0.7) // Mock recent logic

      // Quick filter logic
      let matchesQuickFilter = true
      if (quickFilter) {
        switch (quickFilter) {
          case "online":
            matchesQuickFilter = getUserStatus(employee.id) === "online"
            break
          case "starred":
            matchesQuickFilter = employee.isStarred === true
            break
          case "my-dept":
            matchesQuickFilter = employee.department === "EXCAVATION" // Mock user's department
            break
          case "recent":
            matchesQuickFilter = Math.random() > 0.8
            break
          case "management":
            matchesQuickFilter = employee.category === "Management"
            break
        }
      }

      return matchesSearch && matchesFilters && matchesStatus && matchesView && matchesQuickFilter
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
  }, [searchQuery, filters, viewMode, sortBy, selectedEmployees, getUserStatus, quickFilter])

  const handleEmployeeToggle = (employee: Employee) => {
    triggerHaptic("selection")

    setSelectedEmployees((prev) => {
      const isSelected = prev.some((emp) => emp.id === employee.id)
      if (isSelected) {
        // Add to removal history
        setRemovalHistory((prevHistory) => [
          {
            id: Date.now().toString(),
            employee,
            removedAt: Date.now(),
            removedBy: "current-user",
          },
          ...prevHistory.slice(0, 49), // Keep last 50 removals
        ])
        return prev.filter((emp) => emp.id !== employee.id)
      } else {
        if (maxSelection && prev.length >= maxSelection) {
          triggerHaptic("heavy") // Error feedback
          return prev // Don't add if max reached
        }
        triggerHaptic("light") // Success feedback
        return [...prev, employee]
      }
    })
  }

  const handleSelectAll = () => {
    triggerHaptic("medium")

    const visibleUnselected = filteredAndSortedEmployees.filter(
      (emp) => !selectedEmployees.some((selected) => selected.id === emp.id),
    )

    if (visibleUnselected.length === 0) {
      // Deselect all visible
      const toRemove = selectedEmployees.filter((emp) =>
        filteredAndSortedEmployees.some((visible) => visible.id === emp.id),
      )

      // Add to removal history
      toRemove.forEach((employee) => {
        setRemovalHistory((prevHistory) => [
          {
            id: `${Date.now()}-${employee.id}`,
            employee,
            removedAt: Date.now(),
            removedBy: "current-user",
          },
          ...prevHistory,
        ])
      })

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
    triggerHaptic("light")

    const employee = selectedEmployees.find((emp) => emp.id === employeeId)
    if (employee) {
      setRemovalHistory((prevHistory) => [
        {
          id: Date.now().toString(),
          employee,
          removedAt: Date.now(),
          removedBy: "current-user",
        },
        ...prevHistory.slice(0, 49),
      ])
    }

    setSelectedEmployees((prev) => prev.filter((emp) => emp.id !== employeeId))
  }

  const handleRestoreFromHistory = (historyItem: RemovalHistoryItem) => {
    triggerHaptic("medium")

    if (maxSelection && selectedEmployees.length >= maxSelection) {
      triggerHaptic("heavy")
      return
    }

    setSelectedEmployees((prev) => [...prev, historyItem.employee])
    setRemovalHistory((prev) => prev.filter((item) => item.id !== historyItem.id))
  }

  const clearFilters = () => {
    triggerHaptic("light")
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
    setQuickFilter(null)
  }

  const getFilterCount = () => {
    return (
      Object.values(filters).filter((value) => value !== "all").length + (searchQuery ? 1 : 0) + (quickFilter ? 1 : 0)
    )
  }

  const departments = [...new Set(allEmployees.map((emp) => emp.department))]
  const grades = [...new Set(allEmployees.map((emp) => emp.grade))]

  // Mobile Filter Sheet Component
  const MobileFilterSheet = () => (
    <Sheet open={showFilters} onOpenChange={setShowFilters}>
      <SheetContent side="bottom" className="h-[85dvh] max-h-[85dvh]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filters & Sort</span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <ScrollArea className="flex-1 mt-4">
            <div className="space-y-6 pb-4">
              {/* Quick Filters */}
              <div>
                <h3 className="font-medium mb-3">Quick Filters</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={quickFilter === filter.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        triggerHaptic("light")
                        setQuickFilter(quickFilter === filter.id ? null : filter.id)
                      }}
                      className="h-16 flex flex-col items-center justify-center space-y-1"
                    >
                      <filter.icon className="w-4 h-4" />
                      <span className="text-xs">{filter.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {filter.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* View Mode */}
              <div>
                <h3 className="font-medium mb-3">View</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={viewMode === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setViewMode("all")
                    }}
                    className="h-12"
                  >
                    All
                  </Button>
                  <Button
                    variant={viewMode === "starred" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setViewMode("starred")
                    }}
                    className="h-12"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Starred
                  </Button>
                  <Button
                    variant={viewMode === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setViewMode("recent")
                    }}
                    className="h-12"
                  >
                    Recent
                  </Button>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="font-medium mb-3">Sort By</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={sortBy === "name" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setSortBy("name")
                    }}
                    className="h-12"
                  >
                    Name
                  </Button>
                  <Button
                    variant={sortBy === "department" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setSortBy("department")
                    }}
                    className="h-12"
                  >
                    Department
                  </Button>
                  <Button
                    variant={sortBy === "grade" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setSortBy("grade")
                    }}
                    className="h-12"
                  >
                    Grade
                  </Button>
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <h3 className="font-medium mb-3">Department</h3>
                <div className="space-y-2">
                  <Button
                    variant={filters.department === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setFilters((prev) => ({ ...prev, department: "all" }))
                    }}
                    className="w-full justify-start h-12"
                  >
                    All Departments
                  </Button>
                  {departments.map((dept) => (
                    <Button
                      key={dept}
                      variant={filters.department === dept ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        triggerHaptic("light")
                        setFilters((prev) => ({ ...prev, department: dept }))
                      }}
                      className="w-full justify-start h-12 text-left"
                    >
                      {dept}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Grade Filter */}
              {/* <div>
              <h3 className="font-medium mb-3">Grade</h3>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={filters.grade === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, grade: "all" }))}
                  className="h-12"
                >
                  All
                </Button>
                {grades.map((grade) => (
                  <Button
                    key={grade}
                    variant={filters.grade === grade ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters((prev) => ({ ...prev, grade: grade }))}
                    className="h-12"
                  >
                    {grade}
                  </Button>
                ))}
              </div>
            </div> */}

              {/* Status Filter */}
              <div>
                <h3 className="font-medium mb-3">Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={filters.status === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setFilters((prev) => ({ ...prev, status: "all" }))
                    }}
                    className="h-12"
                  >
                    All Status
                  </Button>
                  <Button
                    variant={filters.status === "online" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setFilters((prev) => ({ ...prev, status: "online" }))
                    }}
                    className="h-12"
                  >
                    <UserPresenceIndicator status="online" size="sm" className="mr-2" />
                    Online
                  </Button>
                  <Button
                    variant={filters.status === "away" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setFilters((prev) => ({ ...prev, status: "away" }))
                    }}
                    className="h-12"
                  >
                    <UserPresenceIndicator status="away" size="sm" className="mr-2" />
                    Away
                  </Button>
                  <Button
                    variant={filters.status === "offline" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      triggerHaptic("light")
                      setFilters((prev) => ({ ...prev, status: "offline" }))
                    }}
                    className="h-12"
                  >
                    <UserPresenceIndicator status="offline" size="sm" className="mr-2" />
                    Offline
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 bg-background border-t flex-shrink-0">
            <Button
              onClick={() => {
                triggerHaptic("medium")
                setShowFilters(false)
              }}
              className="w-full h-12"
            >
              Apply Filters
              {getFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getFilterCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 w-full h-[100dvh] max-w-none max-h-[100dvh] rounded-none border-0 m-0 inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0">
          <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    triggerHaptic("light")
                    onClose()
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployees.length} selected
                    {maxSelection && ` of ${maxSelection}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    triggerHaptic("light")
                    setShowFilters(true)
                  }}
                  className="relative"
                >
                  <div className="flex items-center space-x-1">
                    <Settings2 className="w-5 h-5" />
                    <span className="text-xs font-medium">Filter</span>
                  </div>
                  {getFilterCount() > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
                      {getFilterCount()}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b bg-background flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="px-4 py-2 border-b bg-muted/30 flex-shrink-0">
              <ScrollArea className="w-full">
                <div className="flex space-x-2 pb-2">
                  {quickFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={quickFilter === filter.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        triggerHaptic("light")
                        setQuickFilter(quickFilter === filter.id ? null : filter.id)
                      }}
                      className="flex-shrink-0 h-8"
                    >
                      <filter.icon className="w-3 h-3 mr-1" />
                      {filter.label}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {filter.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(value: any) => setActiveTab(value)}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-4 py-2 border-b flex-shrink-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>All ({filteredAndSortedEmployees.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="selected" className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Selected ({selectedEmployees.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>History ({removalHistory.length})</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* All Employees Tab */}
              <TabsContent value="all" className="flex-1 flex flex-col m-0 min-h-0">
                {/* Quick Actions */}
                <div className="flex items-center justify-between p-4 bg-muted/30 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{filteredAndSortedEmployees.length} results</span>
                    {viewMode === "starred" && <Star className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-sm">
                    {filteredAndSortedEmployees.every((emp) =>
                      selectedEmployees.some((selected) => selected.id === emp.id),
                    )
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>

                {/* Employee List */}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-3 space-y-2 pb-20">
                    {filteredAndSortedEmployees.map((employee) => {
                      const isSelected = selectedEmployees.some((emp) => emp.id === employee.id)
                      const userStatus = getUserStatus(employee.id)

                      return (
                        <div
                          key={employee.id}
                          className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all touch-manipulation ${
                            isSelected ? "bg-primary/5 border-primary/30" : "border-transparent bg-card hover:bg-accent"
                          }`}
                          onClick={() => handleEmployeeToggle(employee)}
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="relative">
                              {isSelected ? (
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-primary-foreground" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 border-2 border-muted-foreground rounded-full" />
                              )}
                            </div>

                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="text-sm font-medium">{employee.initials}</AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                                <UserPresenceIndicator status={userStatus} size="sm" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium truncate">{employee.name}</p>
                                {employee.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{employee.designation}</p>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Building2 className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate max-w-24">
                                    {employee.department}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{employee.location}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {employee.grade}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {filteredAndSortedEmployees.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No employees found</p>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Selected Employees Tab */}
              <TabsContent value="selected" className="flex-1 flex flex-col m-0 min-h-0">
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {selectedEmployees.length === 0 ? (
                      <div className="text-center py-12">
                        <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No members selected</p>
                        <p className="text-sm text-muted-foreground mt-1">Go to "All" tab to select members</p>
                      </div>
                    ) : (
                      selectedEmployees.map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-4 p-4 bg-card rounded-xl border">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="text-sm font-medium">{employee.initials}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                              <UserPresenceIndicator status={getUserStatus(employee.id)} size="sm" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{employee.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{employee.designation}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {employee.department}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => handleRemoveSelected(employee.id)}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="flex-1 flex flex-col m-0 min-h-0">
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {removalHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No removal history</p>
                        <p className="text-sm text-muted-foreground mt-1">Removed members will appear here</p>
                      </div>
                    ) : (
                      removalHistory.map((historyItem) => (
                        <div key={historyItem.id} className="flex items-center space-x-4 p-4 bg-card rounded-xl border">
                          <div className="relative">
                            <Avatar className="w-12 h-12 opacity-60">
                              <AvatarFallback className="text-sm font-medium">
                                {historyItem.employee.initials}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{historyItem.employee.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{historyItem.employee.designation}</p>
                            <p className="text-xs text-muted-foreground">
                              Removed {new Date(historyItem.removedAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreFromHistory(historyItem)}
                            disabled={maxSelection ? selectedEmployees.length >= maxSelection : false}
                          >
                            Restore
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Bottom Action Bar */}
            <div className="p-4 border-t bg-background flex-shrink-0">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    triggerHaptic("light")
                    onClose()
                  }}
                  className="flex-1 h-12 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    triggerHaptic("medium")
                    onConfirm(selectedEmployees)
                  }}
                  disabled={selectedEmployees.length === 0}
                  className="flex-1 h-12"
                >
                  Add {selectedEmployees.length} Member{selectedEmployees.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MobileFilterSheet />
    </>
  )
}
