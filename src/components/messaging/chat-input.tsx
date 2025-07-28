"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Send, 
  X,
  Paperclip,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  Music,
  Video,
  Archive,
  Loader2
} from 'lucide-react'
import { Message, MessageAttachment } from '@/types/messaging'

interface ChatInputProps {
  onSendMessage: (content: string, replyTo?: Message, attachments?: File[]) => void
  onTyping?: (isTyping: boolean) => void
  replyToMessage?: Message | null
  onClearReply?: () => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  className?: string
  groupId: number
}

interface FilePreview {
  file: File
  preview?: string
}

export function ChatInput({
  onSendMessage,
  onTyping,
  replyToMessage,
  onClearReply,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 2000,
  className,
  groupId
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  // Handle typing indicator
  useEffect(() => {
    console.log(`🎯 ChatInput typing effect: message="${message}", isTyping=${isTyping}`)
    
    if (message.trim() && !isTyping) {
      console.log('🟢 Starting typing indicator')
      setIsTyping(true)
      onTyping?.(true)
    } else if (!message.trim() && isTyping) {
      console.log('🔴 Stopping typing indicator (empty message)')
      setIsTyping(false)
      onTyping?.(false)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    if (message.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        console.log('⏱️ Timeout reached - stopping typing indicator')
        setIsTyping(false)
        onTyping?.(false)
      }, 10000) // Match the timeout in the hook
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, isTyping, onTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        onTyping?.(false)
      }
    }
  }, [isTyping, onTyping])

  const handleSend = async () => {
    const trimmedMessage = message.trim()
    const hasAttachments = selectedFiles.length > 0
    
    if (!trimmedMessage && !hasAttachments) return
    if (disabled || isUploading) return

    const files = selectedFiles.map(fp => fp.file)
    
    onSendMessage(trimmedMessage || "(Attachment)", replyToMessage || undefined, files)
    setMessage('')
    setSelectedFiles([])
    setIsTyping(false)
    onTyping?.(false)
    setUploadError(null)
    
    // Clear reply
    if (replyToMessage && onClearReply) {
      onClearReply()
    }

    // Focus back on textarea
    textareaRef.current?.focus()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: FilePreview[] = []
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File "${file.name}" exceeds 15MB limit`)
        continue
      }
      
      const filePreview: FilePreview = { file }
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setSelectedFiles(prev => 
            prev.map(fp => 
              fp.file === file 
                ? { ...fp, preview: reader.result as string }
                : fp
            )
          )
        }
        reader.readAsDataURL(file)
      }
      
      validFiles.push(filePreview)
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setUploadError(null)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon
    if (fileType.startsWith('video/')) return Video
    if (fileType.startsWith('audio/')) return Music
    if (fileType.includes('pdf')) return FileTextIcon
    if (fileType.includes('zip') || fileType.includes('rar')) return Archive
    return FileIcon
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return
      } else {
        // Send message with Enter
        e.preventDefault()
        handleSend()
      }
    }

    if (e.key === 'Escape' && replyToMessage) {
      onClearReply?.()
    }
  }

  return (
    <div className={cn("border-t bg-background", className)}>
      {/* Reply Banner */}
      {replyToMessage && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Replying to {replyToMessage.senderName || 'Unknown User'}
              </span>
              <Badge variant="secondary" className="text-xs">
                Reply
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground truncate mt-1">
              {replyToMessage.content}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClearReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setSelectedFiles([])
                setUploadError(null)
              }}
            >
              Clear all
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((filePreview, index) => {
              const { file, preview } = filePreview
              const Icon = getFileIcon(file.type)
              
              return (
                <div
                  key={index}
                  className="relative group bg-muted rounded-lg p-2 flex items-center gap-2 max-w-[200px]"
                >
                  {/* File Preview/Icon */}
                  {preview ? (
                    <img
                      src={preview}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-background rounded flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
          
          {/* Upload Error */}
          {uploadError && (
            <div className="text-xs text-destructive">{uploadError}</div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-4">
        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isUploading}
            maxLength={maxLength}
            className={cn(
              "min-h-[40px] max-h-32 resize-none border-0 shadow-none focus-visible:ring-0",
              "bg-muted rounded-lg px-3 py-2",
              (disabled || isUploading) && "opacity-50 cursor-not-allowed"
            )}
            rows={1}
          />
          
          {/* Character Count */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* File Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Attach files"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && selectedFiles.length === 0) || disabled || isUploading}
            size="sm"
            className="h-8 w-8 p-0"
            title="Send message (Enter)"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 pb-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {isTyping && (
            <span className="flex items-center gap-1">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              Typing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Press Shift+Enter for new line</span>
          {replyToMessage && (
            <span>• Press Escape to cancel reply</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Typing indicator component for showing other users typing
interface TypingIndicatorProps {
  typingUsers: string[]
  className?: string
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`
    } else {
      return `${typingUsers.length} people are typing...`
    }
  }

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground", className)}>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
      </div>
      <span>{getTypingText()}</span>
    </div>
  )
}
