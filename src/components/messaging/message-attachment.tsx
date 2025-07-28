"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { FileIcon, ImageIcon, Download } from "lucide-react"
import { MessageAttachment as AttachmentType } from "@/types/messaging"

interface MessageAttachmentProps {
  attachment: AttachmentType
  onView?: (attachment: AttachmentType) => void
}

export function MessageAttachment({ attachment, onView }: MessageAttachmentProps) {
  const isImage = attachment.fileType.startsWith('image/')
  const isPDF = attachment.fileType === 'application/pdf'
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
    else return Math.round(bytes / 1048576 * 10) / 10 + ' MB'
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(attachment.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  if (isImage) {
    return (
      <div className="mt-2 w-full">
        <div 
          className="relative cursor-pointer group max-w-[200px] sm:max-w-xs"
          onClick={() => onView?.(attachment)}
        >
          <img 
            src={attachment.url} 
            alt={attachment.fileName}
            className="rounded-lg object-cover w-full h-auto max-h-48 sm:max-h-64"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-white text-xs sm:text-sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Download
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px] sm:max-w-xs">
          {attachment.fileName} • {formatFileSize(attachment.fileSize)}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2 p-2 sm:p-3 bg-muted rounded-lg flex items-center justify-between w-full max-w-[250px] sm:max-w-sm">
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 overflow-hidden">
        {isPDF ? (
          <FileIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 shrink-0" />
        ) : (
          <FileIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground shrink-0" />
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-xs sm:text-sm font-medium truncate">{attachment.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        className="shrink-0 ml-2 h-8 w-8 sm:h-9 sm:w-9"
      >
        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    </div>
  )
}
