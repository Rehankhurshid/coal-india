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
      <div className="mt-2">
        <div 
          className="relative max-w-sm cursor-pointer group"
          onClick={() => onView?.(attachment)}
        >
          <img 
            src={attachment.url} 
            alt={attachment.fileName}
            className="rounded-lg object-cover w-full max-h-64"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-white"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {attachment.fileName} • {formatFileSize(attachment.fileSize)}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-between max-w-sm">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {isPDF ? (
          <FileIcon className="h-8 w-8 text-red-500 shrink-0" />
        ) : (
          <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{attachment.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        className="shrink-0 ml-2"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  )
}
