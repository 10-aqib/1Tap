import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export const useFileUpload = (roomId: string | undefined, _sessionId: string, onComplete: (content: string, metadata: any) => void) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

  const uploadFile = async (file: File) => {
    if (!roomId) {
      setError('Room not found.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('This file exceeds the 100 MB limit.')
      return
    }

    // Reject dangerous types
    const badExts = ['.exe', '.bat', '.cmd', '.msi', '.sh', '.js', '.vbs']
    if (badExts.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setError('This file type is not supported.')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(10) // start progress

    try {
      const fileId = uuidv4()
      const storagePath = `${roomId}/${fileId}_${file.name}`

      // Simulate progress since standard SDK upload doesn't expose it
      const progressInterval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 10 : p))
      }, 300)

      const { error: uploadError } = await supabase
        .storage
        .from('room_files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)

      if (uploadError) {
        throw uploadError
      }
      
      setProgress(100)

      const { data: { publicUrl } } = supabase
        .storage
        .from('room_files')
        .getPublicUrl(storagePath)

      // Notify completion to save to DB
      onComplete(publicUrl, {
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
        url: publicUrl
      })

    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
      }, 1000)
    }
  }

  return {
    uploadFile,
    uploading,
    progress,
    error
  }
}