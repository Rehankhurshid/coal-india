"use client"

import { toast } from "sonner"
import { useCallback } from "react"

export function useSonnerToast() {
  const success = useCallback((title: string, description?: string) => {
    toast.success(title, { description })
  }, [])

  const error = useCallback((title: string, description?: string) => {
    toast.error(title, { description })
  }, [])

  const info = useCallback((title: string, description?: string) => {
    toast.info(title, { description })
  }, [])

  const warning = useCallback((title: string, description?: string) => {
    toast.warning(title, { description })
  }, [])

  return { success, error, info, warning }
}
