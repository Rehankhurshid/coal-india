"use client"

import { Circle } from "lucide-react"
import type { UserPresence } from "../hooks/use-user-presence"

interface UserPresenceIndicatorProps {
  status: UserPresence["status"]
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function UserPresenceIndicator({
  status,
  size = "md",
  showText = false,
  className = "",
}: UserPresenceIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "text-green-500 fill-green-500"
      case "away":
        return "text-yellow-500 fill-yellow-500"
      case "busy":
        return "text-red-500 fill-red-500"
      case "offline":
        return "text-gray-400 fill-gray-400"
      default:
        return "text-gray-400 fill-gray-400"
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "w-2 h-2"
      case "md":
        return "w-3 h-3"
      case "lg":
        return "w-4 h-4"
      default:
        return "w-3 h-3"
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "Online"
      case "away":
        return "Away"
      case "busy":
        return "Busy"
      case "offline":
        return "Offline"
      default:
        return "Offline"
    }
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <Circle className={`${getSizeClass()} ${getStatusColor()}`} />
      {showText && <span className={`text-xs ${getStatusColor().split(" ")[0]} font-medium`}>{getStatusText()}</span>}
    </div>
  )
}
