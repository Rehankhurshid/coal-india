"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Message } from '@/types/messaging'
import { cn } from '@/lib/utils'
import { Edit, X, Clock } from 'lucide-react'

// Utility function to safely format date
const formatTime = (date: Date | string | number): string => {
  try {
    return new Date(date).toLocaleTimeString()
  } catch (error) {
    console.warn('Invalid date format:', date)
    return 'Invalid time'
  }
}

interface MessageEditDialogProps {
  message: Message | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (messageId: string, newContent: string) => Promise<void>
  className?: string
}

export function MessageEditDialog({
  message,
  open,
  onOpenChange,
  onSave,
  className
}: MessageEditDialogProps) {
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset content when message changes
  useEffect(() => {
    if (message) {
      setContent(message.content)
      setError(null)
    }
  }, [message])

  const handleSave = async () => {
    if (!message || !content.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      await onSave(message.id.toString(), content.trim())
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (message) {
      setContent(message.content)
    }
    setError(null)
    onOpenChange(false)
  }

  const hasChanges = message && content.trim() !== message.content
  const isValid = content.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Message
          </DialogTitle>
        </DialogHeader>

        {message && (
          <div className="space-y-4">
            {/* Original Message Info */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">{message.senderName}</span>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(message.createdAt)}
                </Badge>
                {message.editCount && message.editCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Edited {message.editCount} time{message.editCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Original: {message.content}
              </div>
            </div>

            {/* Edit Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Edit your message:</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[100px] resize-none"
                maxLength={2000}
                autoFocus
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {content.length}/2000 characters
                </span>
                {hasChanges && (
                  <span className="text-orange-600">
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-destructive">
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            )}

            {/* Edit Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Edit Guidelines:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li>Edited messages will show an "edited" badge</li>
                  <li>Edit history is tracked for transparency</li>
                  <li>You can only edit your own messages</li>
                  <li>Others will see the updated message in real-time</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || !hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Delete Confirmation Dialog
interface MessageDeleteDialogProps {
  message: Message | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (messageId: string) => Promise<void>
  className?: string
}

export function MessageDeleteDialog({
  message,
  open,
  onOpenChange,
  onConfirm,
  className
}: MessageDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!message) return

    setIsDeleting(true)
    setError(null)

    try {
      await onConfirm(message.id.toString())
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <X className="h-4 w-4" />
            Delete Message
          </DialogTitle>
        </DialogHeader>

        {message && (
          <div className="space-y-4">
            {/* Warning */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="text-sm text-destructive">
                <strong>Are you sure you want to delete this message?</strong>
                <p className="mt-2 text-destructive/80">
                  This action cannot be undone. The message will be removed for everyone in the conversation.
                </p>
              </div>
            </div>

            {/* Message Preview */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">{message.senderName}</span>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(message.createdAt)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {message.content}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-destructive">
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
