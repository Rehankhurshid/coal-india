"use client"

import { useEffect, useState } from "react"

interface TypingIndicatorProps {
  users: Array<{ userName: string; userId: string }>
  className?: string
}

export function TypingIndicator({ users, className = "" }: TypingIndicatorProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (users.length === 0) return

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [users.length])

  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing`
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing`
    } else {
      return `${users[0].userName} and ${users.length - 1} others are typing`
    }
  }

  return (
    <div className={`flex items-center space-x-2 text-sm text-muted-foreground animate-pulse ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>
        {getTypingText()}
        {dots}
      </span>
    </div>
  )
}
