import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Layout } from '../components/common/Layout'
import { Button } from '../components/ui/Button'
import { useRoom } from '../hooks/useRoom'
import { useRoomRealtime } from '../hooks/useRoomRealtime'
import { useCountdown } from '../hooks/useCountdown'
import { useFileUpload } from '../hooks/useFileUpload'
import { useToast } from '../components/ui/ToastProvider'
import { formatBytes } from '../lib/utils'
import { 
  Copy, Link as LinkIcon, FileText, Download, 
  Send, Upload, Users, LogOut, Share2
} from 'lucide-react'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const { getRoomById, loading, sessionId } = useRoom()
  const [room, setRoom] = useState<any>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  
  const { items, devices, sendItem } = useRoomRealtime(room?.id, sessionId)
  const [textInput, setTextInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const { isExpired, formattedTime, isWarning } = useCountdown(room?.expires_at)

  useEffect(() => {
    if (isExpired) {
      navigate('/expired')
    }
  }, [isExpired, navigate])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [items])

  const { uploadFile, uploading, progress, error: uploadError } = useFileUpload(
    room?.id, 
    sessionId,
    (_url, metadata) => {
      sendItem('file', 'File uploaded', metadata)
      toast('File uploaded successfully', 'success')
    }
  )

  useEffect(() => {
    if (uploadError) {
      toast(uploadError, 'error')
    }
  }, [uploadError, toast])

  const handleSendText = () => {
    if (!textInput.trim()) return
    
    // Check if it's a link
    const isLink = /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.+)?$/.test(textInput.trim())
    
    sendItem(isLink ? 'link' : 'text', textInput.trim(), isLink ? { url: textInput.trim() } : null)
    setTextInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('Copied!', 'success')
  }

  if (loading || !room) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    )
  }

  const shareUrl = `${window.location.origin}/room/${room.id}`

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] gap-4 md:gap-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Room Code</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                  {room.join_code}
                </span>
                <button 
                  onClick={() => copyToClipboard(room.join_code)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex flex-col items-end">
              <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Active
              </div>
              <div className={`font-mono font-bold ${isWarning ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                {formattedTime}
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end">
              <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Connected ({devices.length})
              </div>
              <div className="flex -space-x-2">
                {devices.slice(0, 3).map((d, i) => (
                  <div key={d.id} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-indigo-600" title={d.label}>
                    {d.isYou ? 'Y' : i+1}
                  </div>
                ))}
                {devices.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    +{devices.length - 3}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setShowShareModal(true)} title="Share Room">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="danger" size="icon" onClick={() => navigate('/')} title="Leave Room">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 text-center max-w-sm w-full">
              <h3 className="font-semibold mb-4 text-slate-700 dark:text-slate-300">Share Room</h3>
              <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-slate-100 shadow-sm mb-4">
                <QRCodeSVG value={shareUrl} size={200} />
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Scan this QR code to instantly join this room.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => copyToClipboard(shareUrl)} variant="secondary" className="w-full">
                  Copy Room Link
                </Button>
                <Button onClick={() => setShowShareModal(false)} variant="ghost" className="w-full">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 gap-4 md:gap-6 min-h-0 overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Share2 className="w-12 h-12 mb-4 opacity-20" />
                  <p>Nothing shared yet.</p>
                  <p className="text-sm">Send a message, link, or file to get started.</p>
                </div>
              ) : (
                items.map((item) => {
                  const isMine = item.session_id === sessionId
                  const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  
                  return (
                    <div key={item.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 ${
                        isMine 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                      }`}>
                        
                        {item.type === 'text' && (
                          <div className="whitespace-pre-wrap break-words">{item.content}</div>
                        )}

                        {item.type === 'link' && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-black/10 rounded-lg">
                              <LinkIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 truncate">
                              <a 
                                href={item.content.startsWith('http') ? item.content : `https://${item.content}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline decoration-white/30 hover:decoration-white transition-all break-all"
                              >
                                {item.content}
                              </a>
                            </div>
                          </div>
                        )}

                        {item.type === 'file' && item.metadata && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-black/10 rounded-lg">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.metadata.file_name}</div>
                              <div className="text-xs opacity-70">{formatBytes(item.metadata.file_size || 0)}</div>
                            </div>
                            <a 
                              href={item.metadata.url} 
                              download={item.metadata.file_name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 p-2 bg-black/10 rounded-full hover:bg-black/20 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}

                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span>{time}</span>
                        {!isMine && <span>• Device</span>}
                        {item.type !== 'file' && (
                           <button onClick={() => copyToClipboard(item.content)} className="hover:text-slate-600">Copy</button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              
              {uploading && (
                <div className="mb-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="animate-spin text-indigo-600"><Upload className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Uploading file...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1 flex items-end shadow-sm">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message or paste a link..."
                    className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-4 text-sm"
                    rows={1}
                  />
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        uploadFile(e.target.files[0])
                        e.target.value = ''
                      }
                    }} 
                  />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-3 text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
                
                <Button 
                  onClick={handleSendText}
                  disabled={!textInput.trim() || uploading}
                  className="h-[52px] w-[52px] shrink-0 rounded-2xl"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <div className="text-center mt-2 text-[10px] text-slate-400">
                Press <kbd className="px-1 border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">Enter</kbd> to send, <kbd className="px-1 border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">Shift</kbd> + <kbd className="px-1 border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">Enter</kbd> for new line
              </div>
            </div>
          </div>

          {/* Sidebar / QR Code */}
          <div className="hidden lg:flex flex-col w-80 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
              <h3 className="font-semibold mb-4 text-slate-700 dark:text-slate-300">Scan to Join</h3>
              <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-slate-100 shadow-sm mb-4">
                <QRCodeSVG value={shareUrl} size={160} />
              </div>
              <p className="text-xs text-slate-500">
                Point your phone's camera at this QR code to instantly join this room.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold mb-4 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Connected Devices
              </h3>
              <ul className="space-y-3">
                {devices.map(device => (
                  <li key={device.id} className="flex items-center gap-3 text-sm">
                    <span className={`w-2 h-2 rounded-full ${device.isYou ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
                    <span className={device.isYou ? 'font-semibold' : ''}>{device.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
