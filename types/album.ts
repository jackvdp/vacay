export interface Album {
  id: string
  title: string
  description?: string
  share_id: string
  is_public: boolean
  creator_id: string
  created_at: string
  updated_at: string
}

export interface Media {
  id: string
  album_id: string
  uploader_id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  blob_url: string // Original/raw file for download
  large_url?: string // Optimized for viewing (~1500px)
  thumbnail_url?: string // Grid display (~400px)
  live_video_url?: string // Live Photo video component (iOS)
  is_live_photo?: boolean // True if this is a Live Photo
  width?: number
  height?: number
  duration?: number
  uploaded_at: string
}

export interface CreateAlbumData {
  title: string
  description?: string
  is_public?: boolean
}

export interface UpdateAlbumData {
  title?: string
  description?: string
  is_public?: boolean
}

export interface AlbumMember {
  id: string
  album_id: string
  allowed_email: string
  role: 'admin' | 'member'
  added_at: string
}

export interface Profile {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}
