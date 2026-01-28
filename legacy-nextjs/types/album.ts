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
    blob_url: string
    thumbnail_url?: string
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

export interface AlbumMember {
    id: string
    album_id: string
    allowed_email: string
    role: 'admin' | 'member'
    added_at: string
}

// You might also need a Profile type if you don't have it
export interface Profile {
    id: string
    email: string
    name: string
    avatar_url?: string
    created_at: string
    updated_at: string
}