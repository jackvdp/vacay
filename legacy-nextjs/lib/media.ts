// lib/media.ts

import { supabase } from './supabase'
import type { Media } from '@/types/album'

export interface UploadProgress {
    fileName: string
    progress: number
    status: 'uploading' | 'processing' | 'complete' | 'error'
    error?: string
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

// Helper function to get correct MIME type based on file extension
export function getCorrectMimeType(file: File): string {
    const fileName = file.name.toLowerCase()
    const originalMimeType = file.type

    const typeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.mp4': 'video/mp4',
        '.mov': 'video/mov',
        '.avi': 'video/avi'
    }

    // If original MIME type is valid and not generic, use it
    if (originalMimeType &&
        originalMimeType !== 'application/octet-stream' &&
        originalMimeType !== '') {
        return originalMimeType
    }

    // Otherwise, determine from extension
    for (const [ext, mime] of Object.entries(typeMap)) {
        if (fileName.endsWith(ext)) {
            console.log(`Corrected MIME type for ${fileName} from ${originalMimeType} to ${mime}`)
            return mime
        }
    }

    return originalMimeType || 'application/octet-stream'
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Legacy upload function (kept for backwards compatibility, but now unused)
export async function uploadMedia(data: { albumId: string; file: File }): Promise<{ media: Media | null; error: any }> {
    console.warn('uploadMedia function is deprecated. Use direct client upload instead.')
    return { media: null, error: 'This upload method is no longer supported. Please use the updated upload component.' }
}