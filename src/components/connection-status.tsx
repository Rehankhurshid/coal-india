"use client"

import { Wifi, WifiOff, Clock, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ConnectionStatus as ConnectionStatusType } from "@/hooks/use-connection-status"

interface ConnectionStatusProps {
  isOnline: boolean
  connectionStatus: ConnectionStatusType
  queuedMessagesCount?: number
  reconnectAttempts?: number
  className?: string
  showLabel?: boolean
}

export function ConnectionStatus({ 
  isOnline, 
  connectionStatus, 
  queuedMessagesCount = 0,
  reconnectAttempts = 0,
  className,
  showLabel = true
}: ConnectionStatusProps) {
  // If we're offline (no internet), show offline status
  if (!isOnline) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Badge 
          variant="destructive" 
          className="bg-red-500/90 text-white border-red-600 hover:bg-red-600 transition-colors"
        >
          <WifiOff className="w-3 h-3 mr-1" />
          {showLabel && "Offline"}
        </Badge>
        {queuedMessagesCount > 0 && (
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {queuedMessagesCount} queued
          </Badge>
        )}
      </div>
    )
  }

  // Handle different connection states
  switch (connectionStatus) {
    case 'connecting':
      return (
        <Badge 
          variant="outline" 
          className={cn(
            "bg-yellow-500/90 text-white border-yellow-600 hover:bg-yellow-600 transition-all",
            className
          )}
        >
          <Clock className="w-3 h-3 mr-1 animate-pulse" />
          {showLabel && "Connecting..."}
        </Badge>
      )
    
    case 'reconnecting':
      return (
        <Badge 
          variant="outline" 
          className={cn(
            "bg-orange-500/90 text-white border-orange-600 hover:bg-orange-600 transition-all",
            className
          )}
        >
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          {showLabel && (
            <span>
              Reconnecting{reconnectAttempts > 2 ? ` (${reconnectAttempts})` : '...'}
            </span>
          )}
        </Badge>
      )
    
    case 'connected':
      return (
        <Badge 
          variant="secondary" 
          className={cn(
            "bg-green-500/90 text-white border-green-600 hover:bg-green-600 transition-colors",
            className
          )}
        >
          <Wifi className="w-3 h-3 mr-1" />
          {showLabel && "Connected"}
        </Badge>
      )
    
    case 'disconnected':
    default:
      return (
        <Badge 
          variant="destructive" 
          className={cn(
            "bg-gray-500/90 text-white border-gray-600 hover:bg-gray-600 transition-colors",
            className
          )}
        >
          <WifiOff className="w-3 h-3 mr-1" />
          {showLabel && "Disconnected"}
        </Badge>
      )
  }
}
