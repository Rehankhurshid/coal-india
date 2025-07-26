"use client"

import { useCallback } from "react"

export function useHaptic() {
  const triggerHaptic = useCallback((type: "light" | "medium" | "heavy" | "selection" | "impact" = "light") => {
    // Check if device supports haptic feedback
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        switch (type) {
          case "light":
            navigator.vibrate(10)
            break
          case "medium":
            navigator.vibrate(20)
            break
          case "heavy":
            navigator.vibrate(50)
            break
          case "selection":
            navigator.vibrate([10, 10, 10])
            break
          case "impact":
            navigator.vibrate([20, 10, 20])
            break
          default:
            navigator.vibrate(10)
        }
      } catch (error) {
        console.log("Haptic feedback not supported")
      }
    }

    // For iOS devices with haptic feedback API
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      try {
        // @ts-ignore - iOS specific API
        if (window.DeviceMotionEvent?.requestPermission) {
          // @ts-ignore
          if (navigator.vibrate) {
            switch (type) {
              case "light":
                navigator.vibrate(10)
                break
              case "medium":
                navigator.vibrate(20)
                break
              case "heavy":
                navigator.vibrate(50)
                break
              case "selection":
                navigator.vibrate([5, 5, 5])
                break
              case "impact":
                navigator.vibrate([15, 5, 15])
                break
            }
          }
        }
      } catch (error) {
        console.log("iOS haptic feedback not available")
      }
    }
  }, [])

  return { triggerHaptic }
}
