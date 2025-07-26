"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { X, Users, Edit } from "lucide-react"
import { LoadingSpinner } from "./loading-spinner"
import { useSonnerToast } from "../hooks/use-sonner-toast"
import { EnhancedMemberSelector } from "@/components/enhanced-member-selector" // Import EnhancedMemberSelector

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
}

interface GroupManagementProps {
  isOpen: boolean
  onClose: () => void
  mode: "create" | "edit"
  existingGroup?: {
    name: string
    description: string
    members: Employee[]
  }
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
]

export function GroupManagement({ isOpen, onClose, mode, existingGroup }: GroupManagementProps) {
  const [step, setStep] = useState<"select-members" | "group-details">(
    mode === "edit" ? "group-details" : "select-members",
  )
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>(existingGroup?.members || [])
  const [groupName, setGroupName] = useState(existingGroup?.name || "")
  const [groupDescription, setGroupDescription] = useState(existingGroup?.description || "")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    department: "all",
    location: "all",
    grade: "all",
    category: "all",
    gender: "all",
  })

  const [isLoading, setIsLoading] = useState(false)
  const { success, error } = useSonnerToast()

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(mode === "edit" ? "group-details" : "select-members")
      setSearchQuery("")
      setShowFilters(false)
      if (mode === "create") {
        setSelectedEmployees([])
        setGroupName("")
        setGroupDescription("")
      }
    }
  }, [isOpen, mode])

  const filteredEmployees = mockEmployees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeId.includes(searchQuery) ||
      employee.designation.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilters =
      (filters.department === "all" || employee.department === filters.department) &&
      (filters.location === "all" || employee.location === filters.location) &&
      (filters.grade === "all" || employee.grade === filters.grade) &&
      (filters.category === "all" || employee.category === filters.category) &&
      (filters.gender === "all" || employee.gender === filters.gender)

    return matchesSearch && matchesFilters
  })

  const handleEmployeeToggle = (employee: Employee) => {
    setSelectedEmployees((prev) => {
      const isSelected = prev.some((emp) => emp.id === employee.id)
      if (isSelected) {
        return prev.filter((emp) => emp.id !== employee.id)
      } else {
        return [...prev, employee]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(filteredEmployees)
    }
  }

  const handleRemoveMember = (employeeId: string) => {
    setSelectedEmployees((prev) => prev.filter((emp) => emp.id !== employeeId))
  }

  const clearFilters = () => {
    setFilters({
      department: "all",
      location: "all",
      grade: "all",
      category: "all",
      gender: "all",
    })
  }

  const handleCreateGroup = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      console.log("Creating group:", { groupName, groupDescription, members: selectedEmployees })

      success("Group Created", `"${groupName}" has been created successfully with ${selectedEmployees.length} members.`)
      onClose()
    } catch (err) {
      error("Failed to Create Group", "Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateGroup = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log("Updating group:", { groupName, groupDescription, members: selectedEmployees })

      success("Group Updated", `"${groupName}" has been updated successfully.`)
      onClose()
    } catch (err) {
      error("Failed to Update Group", "Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderMemberSelection = () => (
    <EnhancedMemberSelector
      isOpen={isOpen && step === "select-members"}
      onClose={() => {
        if (step === "select-members") {
          onClose() // Close the entire modal if we're on the first step
        } else {
          setStep("group-details")
        }
      }}
      onConfirm={(selected) => {
        setSelectedEmployees(selected)
        setStep("group-details")
      }}
      initialSelected={selectedEmployees}
      title="Select Team Members"
      description="Choose team members to add to your group"
      maxSelection={50}
    />
  )

  const renderGroupDetails = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          {mode === "edit" ? <Edit className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          <span>{mode === "edit" ? "Edit Group" : "Create a New Group"}</span>
        </DialogTitle>
        <p className="text-muted-foreground">
          {mode === "edit"
            ? "Update your group details and manage members."
            : "Give your group a name and add members to start collaborating."}
        </p>
      </DialogHeader>

      <div className="space-y-4">
        {/* Group Name */}
        <div>
          <label className="text-sm font-medium mb-2 block">Group Name</label>
          <Input placeholder="e.g., Q3 Project Team" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
          <Textarea
            placeholder="What is this group for?"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Members */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Members</label>
            <Button variant="outline" size="sm" onClick={() => setStep("select-members")}>
              {mode === "edit" ? "Manage Members" : "Select Members"}
            </Button>
          </div>

          {selectedEmployees.length > 0 ? (
            <div className="border rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{selectedEmployees.length} members selected</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">{employee.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.designation}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveMember(employee.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No members selected</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={mode === "edit" ? handleUpdateGroup : handleCreateGroup}
            disabled={!groupName.trim() || selectedEmployees.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {mode === "edit" ? "Updating..." : "Creating..."}
              </>
            ) : mode === "edit" ? (
              "Update Group"
            ) : (
              "Create Group"
            )}
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {isOpen && (
        step === "select-members" ? (
          renderMemberSelection()
        ) : (
          <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">{renderGroupDetails()}</DialogContent>
          </Dialog>
        )
      )}

      {/* Keep the existing filter modal as fallback */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Employees</DialogTitle>
            <p className="text-muted-foreground">Narrow down your search with filters</p>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select
                value={filters.department}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="EXCAVATION">EXCAVATION</SelectItem>
                  <SelectItem value="ELECT. & MECH">ELECT. & MECH</SelectItem>
                  <SelectItem value="SAFETY & CONSV.">SAFETY & CONSV.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select
                value={filters.location}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Gevra Area">Gevra Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Grade</label>
              <Select
                value={filters.grade}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, grade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="E1">E1</SelectItem>
                  <SelectItem value="E2">E2</SelectItem>
                  <SelectItem value="E7">E7</SelectItem>
                  <SelectItem value="E8">E8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Gender</label>
              <Select
                value={filters.gender}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
