import React from 'react'
import { FileText, Download, Link2, Copy, Check } from 'lucide-react'
import type { RoomItem } from '../types'
import { formatBytes } from '../lib/utils'
import { useToast } from './ui/ToastProvider'

interface MessageItemProps {
  item: RoomItem
  isOwn: boolean
}

export function MessageItem({ item, isOwn }: MessageItemProps) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Copied to clipboard', 'success')
  }

  const timeString = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (item.type === 'file' && item.metadata) {
    return (
      <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up-fade`}>
        <div className={`max-w-[85%] sm:max-w-[400px] rounded-2xl p-4 flex items-center gap-4 border shadow-sm ${
          isOwn ? 'bg-accent-50 border-accent-100 dark:bg-accent-500/10 dark:border-accent-500/20' : 'bg-surface border-surface-border'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate" title={item.metadata.name}>
              {item.metadata.name}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {formatBytes(item.metadata.size || 0)} • {timeString}
            </p>
          </div>
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover hover:bg-surface-border text-text-secondary transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  if (item.type === 'link') {
    let domain = item.content
    try {
      domain = new URL(item.content).hostname
    } catch (e) {}

    return (
      <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up-fade`}>
        <div className={`max-w-[85%] sm:max-w-[400px] rounded-2xl p-4 flex flex-col gap-3 border shadow-sm ${
          isOwn ? 'bg-accent-50 border-accent-100 dark:bg-accent-500/10 dark:border-accent-500/20' : 'bg-surface border-surface-border'
        }`}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0 text-text-secondary">
              <Link2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline break-all">
                {domain}
              </a>
              <p className="text-xs text-text-muted mt-1">{timeString}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <a 
              href={item.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-8 rounded-lg bg-accent-600 text-white text-xs font-medium flex items-center justify-center hover:bg-accent-700 transition-colors"
            >
              Open Link
            </a>
            <button
              onClick={() => handleCopy(item.content)}
              className="w-8 h-8 rounded-lg bg-surface-hover hover:bg-surface-border text-text-secondary flex items-center justify-center transition-colors"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Text
  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up-fade`}>
      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
        isOwn ? 'bg-accent-600 text-white rounded-br-sm' : 'bg-surface border border-surface-border text-text-primary rounded-bl-sm'
      }`}>
        <p className="text-sm whitespace-pre-wrap break-words">{item.content}</p>
        <div className={`text-[10px] mt-1.5 flex justify-end ${isOwn ? 'text-accent-100/70' : 'text-text-muted'}`}>
          {timeString}
        </div>
      </div>
    </div>
  )
}
