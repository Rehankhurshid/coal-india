import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-react'

interface RealtimeStatusProps {
  isConnected: boolean
  className?: string
}

export function RealtimeStatus({ isConnected, className }: RealtimeStatusProps) {
  return (
    <Badge 
      variant={isConnected ? 'default' : 'destructive'} 
      className={`text-xs ${className}`}
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3 mr-1" />
          Real-time
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </>
      )}
    </Badge>
  )
}
