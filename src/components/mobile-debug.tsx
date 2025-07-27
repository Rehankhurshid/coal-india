'use client'

import { useIsMobile } from "@/hooks/use-is-mobile"
import { useState, useEffect } from "react"

interface MobileDebugProps {
  groups: any[]
  showChat: boolean
  selectedGroupId: number | null
  currentGroup: any
}

export function MobileDebug({ groups, showChat, selectedGroupId, currentGroup }: MobileDebugProps) {
  const isMobile = useIsMobile()
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
      <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
      <div>Width: {windowWidth}px</div>
      <div>Groups: {groups.length}</div>
      <div>ShowChat: {showChat ? 'Yes' : 'No'}</div>
      <div>SelectedGroup: {selectedGroupId}</div>
      <div>CurrentGroup: {currentGroup ? 'Yes' : 'No'}</div>
    </div>
  )
}
