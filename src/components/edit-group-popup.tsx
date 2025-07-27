"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Camera,
  Edit3,
  Users,
  UserPlus,
  Crown,
  MoreVertical,
  Bell,
  BellOff,
  Star,
  Trash2,
  LogOut,
  Settings,
} from "lucide-react"
import { UserPresenceIndicator } from "./user-presence-indicator"
import { useUserPresence } from "../hooks/use-user-presence"
import { useHaptic } from "../hooks/use-haptic"
import { EnhancedMemberSelector } from "./enhanced-member-selector"

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
  role?: "admin" | "member"
  joinedAt?: number
}

interface EditGroupPopupProps {
  isOpen: boolean
  onClose: () => void
  group: {
    id: string
    name: string
    description: string
    avatar?: string
    members: Employee[]
    createdAt: number
    isAdmin: boolean
  }
  onUpdateGroup: (updatedGroup: any) => void
}

export function EditGroupPopup({ isOpen, onClose, group, onUpdateGroup }: EditGroupPopupProps) {
  const [currentView, setCurrentView] = useState<"main" | "edit-info" | "members" | "add-members">("main")
  const [groupName, setGroupName] = useState(group.name)
  const [groupDescription, setGroupDescription] = useState(group.description)
  const [members, setMembers] = useState<Employee[]>(group.members)
  const [showMemberSelector, setShowMemberSelector] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [isStarred, setIsStarred] = useState(false)

  const { getUserStatus } = useUserPresence()
  const { triggerHaptic } = useHaptic()

  useEffect(() => {
    if (isOpen) {
      setGroupName(group.name)
      setGroupDescription(group.description)
      setMembers(group.members)
      setCurrentView("main")
    }
  }, [isOpen, group])

  const handleSaveInfo = () => {
    triggerHaptic("medium")
    onUpdateGroup({
      ...group,
      name: groupName,
      description: groupDescription,
    })
    setCurrentView("main")
  }

  const handleRemoveMember = (memberId: string) => {
    triggerHaptic("light")
    setMembers((prev) => prev.filter((member) => member.id !== memberId))
  }

  const handleAddMembers = (newMembers: Employee[]) => {
    triggerHaptic("medium")
    setMembers((prev) => [...prev, ...newMembers.filter((nm) => !prev.some((pm) => pm.id === nm.id))])
    setShowMemberSelector(false)
  }

  const handleMakeAdmin = (memberId: string) => {
    triggerHaptic("medium")
    setMembers((prev) => prev.map((member) => (member.id === memberId ? { ...member, role: "admin" } : member)))
  }

  const renderHeader = () => {
    const titles = {
      main: "Group Info",
      "edit-info": "Edit Group Info",
      members: `${members.length} Members`,
      "add-members": "Add Members",
    }

    return (
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              triggerHaptic("light")
              if (currentView === "main") {
                onClose()
              } else {
                setCurrentView("main")
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-lg">{titles[currentView]}</h2>
        </div>
        {currentView === "edit-info" && (
          <Button onClick={handleSaveInfo} className="px-6">
            Save
          </Button>
        )}
      </div>
    )
  }

  const renderMainView = () => (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        {/* Group Avatar and Info */}
        <div className="flex flex-col items-center space-y-4 py-6">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-primary" />
            </div>
            {group.isAdmin && (
              <Button
                size="icon"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
                onClick={() => triggerHaptic("light")}
              >
                <Camera className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold">{groupName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Group • {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
            {groupDescription && <p className="text-sm text-muted-foreground mt-2">{groupDescription}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-16 bg-transparent"
            onClick={() => {
              triggerHaptic("light")
              setNotifications(!notifications)
            }}
          >
            {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            <span className="text-xs">{notifications ? "Mute" : "Unmute"}</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-16 bg-transparent"
            onClick={() => {
              triggerHaptic("light")
              setIsStarred(!isStarred)
            }}
          >
            <Star className={`w-5 h-5 ${isStarred ? "fill-yellow-500 text-yellow-500" : ""}`} />
            <span className="text-xs">{isStarred ? "Starred" : "Star"}</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-16 bg-transparent"
            onClick={() => triggerHaptic("light")}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>

        {/* Group Options */}
        <div className="space-y-1">
          {group.isAdmin && (
            <Button
              variant="ghost"
              className="w-full justify-start h-14 px-4"
              onClick={() => {
                triggerHaptic("light")
                setCurrentView("edit-info")
              }}
            >
              <Edit3 className="w-5 h-5 mr-3" />
              <span>Edit group info</span>
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start h-14 px-4"
            onClick={() => {
              triggerHaptic("light")
              setCurrentView("members")
            }}
          >
            <Users className="w-5 h-5 mr-3" />
            <div className="flex-1 text-left">
              <div>Members</div>
              <div className="text-sm text-muted-foreground">{members.length} members</div>
            </div>
          </Button>
          {group.isAdmin && (
            <Button
              variant="ghost"
              className="w-full justify-start h-14 px-4"
              onClick={() => {
                triggerHaptic("light")
                setShowMemberSelector(true)
              }}
            >
              <UserPlus className="w-5 h-5 mr-3" />
              <span>Add members</span>
            </Button>
          )}
        </div>

        {/* Danger Zone */}
        <div className="space-y-1 pt-4 border-t">
          <Button variant="ghost" className="w-full justify-start h-14 px-4 text-destructive hover:text-destructive">
            <LogOut className="w-5 h-5 mr-3" />
            <span>Exit group</span>
          </Button>
          {group.isAdmin && (
            <Button variant="ghost" className="w-full justify-start h-14 px-4 text-destructive hover:text-destructive">
              <Trash2 className="w-5 h-5 mr-3" />
              <span>Delete group</span>
            </Button>
          )}
        </div>
      </div>
    </ScrollArea>
  )

  const renderEditInfoView = () => (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        {/* Group Avatar */}
        <div className="flex flex-col items-center space-y-4 py-6">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <Button
              size="icon"
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
              onClick={() => triggerHaptic("light")}
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Tap to change group photo</p>
        </div>

        {/* Group Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Group Name</label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">{groupName.length}/25</p>
        </div>

        {/* Group Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Description (Optional)</label>
          <Textarea
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="Add a group description"
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">{groupDescription.length}/512</p>
        </div>
      </div>
    </ScrollArea>
  )

  const renderMembersView = () => (
    <ScrollArea className="flex-1">
      <div className="space-y-1">
        {group.isAdmin && (
          <Button
            variant="ghost"
            className="w-full justify-start h-16 px-4 border-b"
            onClick={() => {
              triggerHaptic("light")
              setShowMemberSelector(true)
            }}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-3">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <span className="font-medium text-primary">Add members</span>
          </Button>
        )}

        {members.map((member) => (
          <div key={member.id} className="flex items-center space-x-3 p-4 hover:bg-accent">
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                <UserPresenceIndicator status={getUserStatus(member.id)} size="sm" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="font-medium truncate">{member.name}</p>
                {member.role === "admin" && <Crown className="w-4 h-4 text-yellow-500" />}
                {member.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
              </div>
              <p className="text-sm text-muted-foreground truncate">{member.designation}</p>
              <div className="flex items-center space-x-2 mt-1">
                <UserPresenceIndicator status={getUserStatus(member.id)} size="sm" showText />
                {member.role === "admin" && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
            {group.isAdmin && member.id !== "current-user" && (
              <Button variant="ghost" size="icon" onClick={() => triggerHaptic("light")}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )

  const renderCurrentView = () => {
    switch (currentView) {
      case "edit-info":
        return renderEditInfoView()
      case "members":
        return renderMembersView()
      default:
        return renderMainView()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 w-full h-[100dvh] max-w-none max-h-[100dvh] rounded-none border-0 m-0 inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0">
          <VisuallyHidden>
            <DialogTitle>Group Settings</DialogTitle>
          </VisuallyHidden>
          <div className="flex flex-col h-full w-full overflow-hidden bg-background">
            {renderHeader()}
            {renderCurrentView()}
          </div>
        </DialogContent>
      </Dialog>

      <EnhancedMemberSelector
        isOpen={showMemberSelector}
        onClose={() => setShowMemberSelector(false)}
        onConfirm={handleAddMembers}
        initialSelected={[]}
        title="Add Members"
        description="Select members to add to the group"
      />
    </>
  )
}
