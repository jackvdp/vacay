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

        console.log('Uploading file via API:', data.file.name)

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

// Helper function to validate file types
export function isValidFileType(file: File): boolean {
    const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/mov',
        'video/avi'
    ]
    return validTypes.includes(file.type)
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}