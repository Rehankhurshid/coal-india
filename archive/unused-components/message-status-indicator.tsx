"use client"

import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react"

interface MessageStatusIndicatorProps {
  status: "sending" | "sent" | "delivered" | "read" | "failed"
  className?: string
}

export function MessageStatusIndicator({ status, className = "" }: MessageStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />
      case "sent":
        return <Check className="w-3 h-3 text-muted-foreground" />
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case "failed":
        return <AlertCircle className="w-3 h-3 text-destructive" />
      default:
        return null
    }
  }

  return <div className={`flex items-center ${className}`}>{getStatusIcon()}</div>
}
