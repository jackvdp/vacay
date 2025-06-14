import { supabase } from './supabase'
import type { Media } from '@/types/album'

export interface UploadMediaData {
    albumId: string
    file: File
}

export interface UploadProgress {
    fileName: string
    progress: number
    status: 'uploading' | 'processing' | 'complete' | 'error'
    error?: string
}

export async function uploadMedia(data: UploadMediaData): Promise<{ media: Media | null; error: any }> {
    try {
        // Get the current user's session token
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.access_token) {
            return { media: null, error: 'User not authenticated' }
        }

        // Create FormData
        const formData = new FormData()
        formData.append('file', data.file)

        console.log('Uploading file via API:', data.file.name, 'Type:', data.file.type)

        // Upload via API route
        const response = await fetch(`/api/albums/${data.albumId}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            },
            body: formData
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('Upload API error:', result.error)
            return { media: null, error: result.error || 'Upload failed' }
        }

        console.log('Upload successful:', result.media)
        return { media: result.media, error: null }

    } catch (error) {
        console.error('Error uploading media:', error)
        return { media: null, error: 'Network error during upload' }
    }
}

export async function getAlbumMedia(albumId: string): Promise<{ media: Media[] | null; error: any }> {
    try {
        const { data: media, error } = await supabase
            .from('media')
            .select('*')
            .eq('album_id', albumId)
            .order('uploaded_at', { ascending: false })

        return { media, error }
    } catch (error) {
        return { media: null, error }
    }
}

// Helper function to validate file types - improved version
export function isValidFileType(file: File): boolean {
    const fileName = file.name.toLowerCase()
    const mimeType = file.type

    // Define valid combinations of MIME types and extensions
    const validTypes = [
        // Images
        { mime: 'image/jpeg', extensions: ['.jpg', '.jpeg'] },
        { mime: 'image/png', extensions: ['.png'] },
        { mime: 'image/webp', extensions: ['.webp'] },
        { mime: 'image/gif', extensions: ['.gif'] },
        // Videos
        { mime: 'video/mp4', extensions: ['.mp4'] },
        { mime: 'video/mov', extensions: ['.mov'] },
        { mime: 'video/quicktime', extensions: ['.mov'] },
        { mime: 'video/avi', extensions: ['.avi'] }
    ]

    // Check if MIME type is directly valid
    if (validTypes.some(type => type.mime === mimeType)) {
        console.log('File type valid by MIME type:', mimeType)
        return true
    }

    // If MIME type is generic or unknown, check by file extension
    if (mimeType === 'application/octet-stream' || mimeType === '' || !mimeType) {
        const isValidByExtension = validTypes.some(type =>
            type.extensions.some(ext => fileName.endsWith(ext))
        )

        if (isValidByExtension) {
            console.log('File type valid by extension:', fileName, '(MIME type was:', mimeType, ')')
            return true
        }
    }

    // Check if file has valid extension even if MIME type is different
    const hasValidExtension = validTypes.some(type =>
        type.extensions.some(ext => fileName.endsWith(ext))
    )

    if (hasValidExtension) {
        console.log('File type valid by extension despite different MIME type:', fileName, mimeType)
        return true
    }

    console.log('Invalid file type:', fileName, mimeType)
    return false
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}