import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export const useFileUpload = (roomId: string | undefined, _sessionId: string, onComplete: (url: string, metadata: any) => void) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const MAX_FILES = 10

  const uploadFiles = async (files: File[]) => {
    if (!roomId) {
      setError('Room not found.')
      return
    }

    if (files.length > MAX_FILES) {
      setError(`You can only upload up to ${MAX_FILES} files at a time.`)
      return
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 5 MB limit.`)
        return
      }
    }

    setUploading(true)
    setError(null)
    setProgress(5) // Start progress

    let completedFiles = 0
    const totalFiles = files.length

    try {
      // We will upload files concurrently for speed
      const uploadPromises = files.map(async (file) => {
        const fileId = uuidv4()
        const storagePath = `${roomId}/${fileId}_${file.name}`

        const { error: uploadError } = await supabase
          .storage
          .from('room_files')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type // Ensure correct content type is set
          })

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase
          .storage
          .from('room_files')
          .getPublicUrl(storagePath)

        // Increment progress as each file finishes
        completedFiles++
        setProgress(Math.floor((completedFiles / totalFiles) * 90) + 5)

        // Notify complete for this specific file
        onComplete(publicUrl, {
          name: file.name,
          storage_path: storagePath,
          type: file.type,
          size: file.size,
          url: publicUrl
        })
      })

      await Promise.all(uploadPromises)

      setProgress(100)
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
    uploadFiles,
    uploading,
    progress,
    error
  }
}