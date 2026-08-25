import { useState } from 'react'
import { FileText, Download, Link2, Copy, Check, Edit2, Trash2, X } from 'lucide-react'
import type { RoomItem } from '../types'
import { formatBytes } from '../lib/utils'
import { useToast } from './ui/ToastProvider'

interface MessageItemProps {
  item: RoomItem
  isOwn: boolean
  onUpdate?: (id: string, content: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function MessageItem({ item, isOwn, onUpdate, onDelete }: MessageItemProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(item.content)
  const [isSaving, setIsSaving] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Copied to clipboard', 'success')
  }

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete(item.id)
        toast('Message deleted', 'success')
      } catch (e) {
        toast('Failed to delete', 'error')
      }
    }
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === item.content) {
      setIsEditing(false)
      return
    }
    if (onUpdate) {
      try {
        setIsSaving(true)
        await onUpdate(item.id, editContent)
        setIsEditing(false)
        toast('Message updated', 'success')
      } catch (e) {
        toast('Failed to update', 'error')
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditContent(item.content)
    setIsEditing(false)
  }

  const timeString = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const actionButtons = isOwn && (
    <div className={`flex gap-1 items-center ml-2 transition-opacity ${isOwn && item.type !== 'text' ? 'mt-2' : ''}`}>
      {item.type === 'text' && (
        <button
          onClick={() => setIsEditing(true)}
          className={`hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-md text-accent-100 hover:text-white hover:bg-accent-500/50`}
          title="Edit message"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={handleDelete}
        className={`hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-md ${
          item.type === 'text'
            ? 'text-accent-100 hover:text-red-300 hover:bg-red-500/30'
            : 'text-text-muted hover:text-red-400 hover:bg-red-500/10'
        }`}
        title="Delete message"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )

  if (item.type === 'file' && item.metadata) {
    return (
      <div className={`flex w-full group ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up-fade`}>
        <div className={`max-w-[85%] sm:max-w-[400px] rounded-2xl p-4 flex flex-col gap-2 border shadow-sm ${
          isOwn ? 'bg-accent-50 border-accent-100 dark:bg-accent-500/10 dark:border-accent-500/20' : 'bg-surface border-surface-border'
        }`}>
          <div className="flex items-center gap-4">
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
              href={`${item.content}?download=`}
              download={item.metadata.name}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover hover:bg-surface-border text-text-secondary transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
          {isOwn && <div className="flex justify-end">{actionButtons}</div>}
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
      <div className={`flex w-full group ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up-fade`}>
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
            {isOwn && <div className="flex items-center ml-1">{actionButtons}</div>}
          </div>
        </div>
      </div>
    )
  }

  // Text
  return (
    <div className={`flex w-full group ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up-fade`}>
      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
        isOwn ? 'bg-accent-600 text-white rounded-br-sm' : 'bg-surface border border-surface-border text-text-primary rounded-bl-sm'
      }`}>
        {isEditing ? (
          <div className="flex flex-col gap-2 min-w-[200px]">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full text-sm bg-white/10 border-white/20 text-white rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none min-h-[60px]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSaveEdit()
                } else if (e.key === 'Escape') {
                  handleCancelEdit()
                }
              }}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-md text-accent-100 hover:bg-accent-500/50 transition-colors flex items-center gap-1"
                disabled={isSaving}
              >
                <X className="w-3 h-3" /> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 rounded-md bg-white text-accent-600 hover:bg-accent-50 font-medium transition-colors flex items-center gap-1"
                disabled={isSaving || !editContent.trim()}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap break-words">{item.content}</p>
            <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1.5 ${isOwn ? 'text-accent-100/70' : 'text-text-muted'}`}>
              <span>{timeString}</span>
              <button
                onClick={() => handleCopy(item.content)}
                className={`hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-md ${
                  isOwn ? 'text-accent-100 hover:text-white hover:bg-accent-500/50' : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                }`}
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
              {actionButtons}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
