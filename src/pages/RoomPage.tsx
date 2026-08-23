import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useRoom } from '../hooks/useRoom'
import { useRoomRealtime } from '../hooks/useRoomRealtime'
import { useFileUpload } from '../hooks/useFileUpload'
import { useCountdown } from '../hooks/useCountdown'
import { useToast } from '../components/ui/ToastProvider'
import { Button } from '../components/ui/Button'
import { MessageItem } from '../components/MessageItem'
import { triggerBackgroundPulse } from '../components/background/LivingBackground'
import { Moon, Sun, Copy, Share2, LogOut, Paperclip, Send, AlertCircle, Zap, MonitorSmartphone, X, Check, Download } from 'lucide-react'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const { getRoomById, loading, sessionId } = useRoom()
  const [room, setRoom] = useState<any>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  
  const { items, devices, sendItem } = useRoomRealtime(room?.id, sessionId)
  const [textInput, setTextInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { uploadFiles, uploading, progress, error: uploadError } = useFileUpload(
    room?.id, 
    sessionId,
    (url, metadata) => {
      sendItem('file', url, metadata)
      triggerBackgroundPulse()
    }
  )

  useEffect(() => {
    if (!roomId) return
    const fetchRoom = async () => {
      const data = await getRoomById(roomId)
      if (!data) {
        navigate('/404')
      } else if (data.status === 'expired' || data.status === 'deleted') {
        navigate('/expired')
      } else {
        setRoom(data)
      }
    }
    fetchRoom()
  }, [roomId, navigate, getRoomById])

  useEffect(() => {
    if (uploadError) {
      toast(uploadError, 'error')
    }
  }, [uploadError, toast])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    // Pulse slightly when receiving new items
    if (items.length > 0) {
      triggerBackgroundPulse()
    }
  }, [items])

  const { isExpired, formattedTime, isWarning, isCritical } = useCountdown(room?.expires_at)

  useEffect(() => {
    if (isExpired && room?.status === 'active') {
      toast('This space has expired.', 'error')
      navigate('/expired')
    }
  }, [isExpired, room?.status, navigate, toast])

  const toggleTheme = () => {
    const root = document.documentElement
    if (isDark) root.classList.remove('dark')
    else root.classList.add('dark')
    setIsDark(!isDark)
  }

  const handleCopyCode = () => {
    if (!room?.join_code) return
    navigator.clipboard.writeText(room.join_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
    toast('Code copied to clipboard', 'success')
  }

  const handleSendText = () => {
    if (!textInput.trim()) return
    const isUrl = /^(https?:\/\/[^\s]+)/.test(textInput.trim())
    sendItem(isUrl ? 'link' : 'text', textInput.trim())
    setTextInput('')
    triggerBackgroundPulse()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      uploadFiles(files)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }, [isDragging])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      uploadFiles(files)
    }
  }, [uploadFiles])

  if (loading || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-surface-border border-t-accent-600 rounded-full animate-spin" />
      </div>
    )
  }

  const shareUrl = window.location.href

  return (
    <div 
      className="min-h-screen flex flex-col bg-bg text-text-primary transition-colors duration-300"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full Screen Drop Zone */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-accent-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6 animate-pulse">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Drop file to share</h2>
          <p className="text-accent-100 mt-2 text-lg">It will instantly upload to this space</p>
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Code */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 font-bold text-lg tracking-tight cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-7 h-7 rounded-lg bg-accent-600 flex items-center justify-center text-white">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              DropShare
            </div>
            <button 
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover hover:bg-surface-border transition-colors group"
            >
              <span className="font-mono font-bold text-lg tracking-widest text-text-primary">
                {room.join_code.slice(0, 3)} {room.join_code.slice(3)}
              </span>
              {codeCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />}
            </button>
          </div>

          {/* Center: Timer & Status */}
          <div className="hidden md:flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors ${
              isCritical ? 'bg-red-50 text-red-600 dark:bg-red-950/40' : 
              isWarning ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' : 
              'bg-surface-hover text-text-secondary'
            }`}>
              <AlertCircle className="w-4 h-4" />
              {formattedTime} remaining
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-hover text-text-secondary text-sm font-medium">
              <span className="relative flex h-2.5 w-2.5 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              {devices.length} {devices.length === 1 ? 'device' : 'devices'}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowShareModal(true)} title="Share Room">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden sm:flex">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} title="Leave Space" className="text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Timer Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 border-t border-surface-border bg-surface-muted text-xs font-medium">
          <div className={`flex items-center gap-1.5 ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-text-secondary'}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            {formattedTime}
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <MonitorSmartphone className="w-3.5 h-3.5" />
            {devices.length} connected
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
        
        {/* Feed Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto mb-6 pr-2 space-y-6"
        >
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center text-text-muted mb-4 shadow-sm">
                <Paperclip className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Nothing here yet</h3>
              <p className="text-text-secondary max-w-sm">
                Drop a file anywhere, paste a link, or type a message below to instantly share it with connected devices.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map(item => (
                <MessageItem key={item.id} item={item} isOwn={item.session_id === sessionId} />
              ))}
            </div>
          )}
        </div>

        {/* Upload Progress (Inline) */}
        {uploading && (
          <div className="mb-4 bg-surface border border-surface-border rounded-xl p-3 flex items-center gap-3 shadow-sm animate-slide-up-fade">
            <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/50 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-accent-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Unified Composer */}
        <div className="relative bg-surface rounded-2xl shadow-sm border border-surface-border p-2 focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:border-accent-500 transition-all">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message, paste a link..."
            className="w-full bg-transparent resize-none outline-none text-text-primary placeholder:text-text-muted p-2 max-h-32 min-h-[44px]"
            rows={1}
            style={{ height: textInput ? 'auto' : '44px' }}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-hover">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={onFileSelect}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-text-muted hover:text-text-primary rounded-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Attach File
            </Button>
            
            <Button 
              size="sm" 
              className="rounded-lg px-4"
              onClick={handleSendText}
              disabled={!textInput.trim() || uploading}
            >
              <Send className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 shadow-2xl border border-surface-border max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-6 mt-2">
              <h3 className="text-xl font-bold text-text-primary mb-1">Scan to Join</h3>
              <p className="text-sm text-text-secondary">
                Open DropShare on another device and scan this code or enter <span className="font-mono font-bold text-text-primary bg-surface-hover px-1 py-0.5 rounded">{room.join_code}</span>
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto border border-zinc-100 shadow-sm mb-6 w-full aspect-square flex items-center justify-center">
              <QRCodeSVG value={shareUrl} size={200} className="w-full h-full max-w-[200px]" />
            </div>
            
            <Button onClick={() => {
              navigator.clipboard.writeText(shareUrl)
              toast('Link copied!', 'success')
            }} variant="primary" className="w-full h-12 text-base rounded-xl">
              Copy Room Link
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
