"use client"

import { Wifi, WifiOff, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ConnectionStatusProps {
  isOnline: boolean
  isConnected: boolean
  queuedMessagesCount: number
}

export function ConnectionStatus({ isOnline, isConnected, queuedMessagesCount }: ConnectionStatusProps) {
  if (isOnline && isConnected) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <Wifi className="w-3 h-3 mr-1" />
        Online
      </Badge>
    )
  }

  if (!isOnline) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="destructive">
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </Badge>
        {queuedMessagesCount > 0 && (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {queuedMessagesCount} queued
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
      <WifiOff className="w-3 h-3 mr-1" />
      Connecting...
    </Badge>
  )
}
