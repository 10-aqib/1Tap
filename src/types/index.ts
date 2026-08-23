export type RoomStatus = 'active' | 'expired' | 'deleted'

export type ItemType = 'text' | 'link' | 'file'

export interface Room {
  id: string
  join_code: string
  created_at: string
  expires_at: string
  last_activity_at: string
  status: RoomStatus
}

export interface RoomItemMetadata {
  name?: string
  storage_path?: string
  type?: string
  size?: number
  url?: string
  title?: string
  domain?: string
}

export interface RoomItem {
  id: string
  room_id: string
  type: ItemType
  content: string
  metadata: RoomItemMetadata | null
  created_at: string
  session_id: string
}

export interface DevicePresence {
  id: string
  label: string
  isYou: boolean
}

export interface RoomToken {
  roomId: string
  sessionId: string
  expiresAt: number
  signature: string
}

export interface CreateRoomResponse {
  room: Room
  token: RoomToken
}

export interface JoinRoomResponse {
  room: Room
  token: RoomToken
}

export interface UploadIntent {
  storagePath: string
  uploadUrl: string
  fileId: string
}

export interface DownloadUrlResponse {
  url: string
  expiresAt: number
}

export type ExpiryOption = 15 | 30 | 60 | 1440

export interface ExpiryOptionConfig {
  value: ExpiryOption
  label: string
  description: string
}
