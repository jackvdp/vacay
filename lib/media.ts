import { Platform } from 'react-native'
import { supabase } from './supabase'
import { processImage, isProcessableImage, dataUrlToBlob } from './image-processing'
import type { Media } from '@/types/album'

export async function getAlbumMedia(
  albumId: string
): Promise<{ media: Media[] | null; error: Error | null }> {
  try {
    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .eq('album_id', albumId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      return { media: null, error: new Error(error.message) }
    }

    return { media, error: null }
  } catch (error) {
    return { media: null, error: error as Error }
  }
}

interface UploadFile {
  uri: string
  name: string
  type: string
  size?: number
}

export async function uploadMediaToSupabase(
  albumId: string,
  file: UploadFile,
  onProgress?: (progress: number) => void
): Promise<{ media: Media | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { media: null, error: new Error('User not authenticated') }
    }

    // Generate unique base filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const baseFileName = `${albumId}/${Date.now()}-${Math.random().toString(36).substring(7)}`

    onProgress?.(10)

    let originalUrl: string
    let largeUrl: string | undefined
    let thumbnailUrl: string | undefined
    let width: number | undefined
    let height: number | undefined

    // Check if we can process this image
    const canProcess = isProcessableImage(file.type)

    if (canProcess) {
      // Process image to get 3 versions
      onProgress?.(20)
      const processed = await processImage(file.uri, file.type)

      if (processed) {
        width = processed.original.width
        height = processed.original.height

        // Upload original (raw) file
        onProgress?.(30)
        const originalFileName = `${baseFileName}-original.${fileExt}`
        const originalResponse = await fetch(file.uri)
        const originalBlob = await originalResponse.blob()

        const { error: originalError } = await supabase.storage
          .from('media')
          .upload(originalFileName, originalBlob, {
            contentType: file.type,
            upsert: false,
          })

        if (originalError) {
          return { media: null, error: new Error(originalError.message) }
        }

        const { data: originalUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(originalFileName)
        originalUrl = originalUrlData.publicUrl

        // Upload large version
        onProgress?.(50)
        const largeFileName = `${baseFileName}-large.jpg`
        let largeBlob: Blob

        if (Platform.OS === 'web') {
          largeBlob = dataUrlToBlob(processed.large.uri)
        } else {
          const largeResponse = await fetch(processed.large.uri)
          largeBlob = await largeResponse.blob()
        }

        const { error: largeError } = await supabase.storage
          .from('media')
          .upload(largeFileName, largeBlob, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (!largeError) {
          const { data: largeUrlData } = supabase.storage
            .from('media')
            .getPublicUrl(largeFileName)
          largeUrl = largeUrlData.publicUrl
        }

        // Upload thumbnail
        onProgress?.(70)
        const thumbFileName = `${baseFileName}-thumb.jpg`
        let thumbBlob: Blob

        if (Platform.OS === 'web') {
          thumbBlob = dataUrlToBlob(processed.thumbnail.uri)
        } else {
          const thumbResponse = await fetch(processed.thumbnail.uri)
          thumbBlob = await thumbResponse.blob()
        }

        const { error: thumbError } = await supabase.storage
          .from('media')
          .upload(thumbFileName, thumbBlob, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from('media')
            .getPublicUrl(thumbFileName)
          thumbnailUrl = thumbUrlData.publicUrl
        }
      } else {
        // Processing failed, fall back to just uploading original
        const result = await uploadOriginalOnly(file, baseFileName, fileExt)
        if (result.error) return { media: null, error: result.error }
        originalUrl = result.url
      }
    } else {
      // Non-image file (video, gif), just upload original
      onProgress?.(30)
      const result = await uploadOriginalOnly(file, baseFileName, fileExt)
      if (result.error) return { media: null, error: result.error }
      originalUrl = result.url
    }

    onProgress?.(85)

    // Save metadata to database
    const { data: media, error: metadataError } = await supabase
      .from('media')
      .insert({
        album_id: albumId,
        uploader_id: user.id,
        filename: `${baseFileName}-original.${fileExt}`,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size || 0,
        blob_url: originalUrl,
        large_url: largeUrl,
        thumbnail_url: thumbnailUrl,
        width,
        height,
      })
      .select()
      .single()

    if (metadataError) {
      // Try to clean up uploaded files
      await cleanupUploadedFiles(baseFileName, fileExt)
      return { media: null, error: new Error(metadataError.message) }
    }

    onProgress?.(100)

    return { media, error: null }
  } catch (error) {
    console.error('Upload error:', error)
    return { media: null, error: error as Error }
  }
}

async function uploadOriginalOnly(
  file: UploadFile,
  baseFileName: string,
  fileExt: string
): Promise<{ url: string; error?: Error }> {
  const fileName = `${baseFileName}-original.${fileExt}`
  const response = await fetch(file.uri)
  const blob = await response.blob()

  const { error } = await supabase.storage
    .from('media')
    .upload(fileName, blob, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return { url: '', error: new Error(error.message) }
  }

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName)
  return { url: urlData.publicUrl }
}

async function cleanupUploadedFiles(baseFileName: string, fileExt: string) {
  const filesToDelete = [
    `${baseFileName}-original.${fileExt}`,
    `${baseFileName}-large.jpg`,
    `${baseFileName}-thumb.jpg`,
  ]

  try {
    await supabase.storage.from('media').remove(filesToDelete)
  } catch (error) {
    console.warn('Error cleaning up files:', error)
  }
}

export async function deleteMedia(
  mediaId: string,
  filename: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: new Error('User not authenticated') }
    }

    // Extract base filename to delete all versions
    const baseFileName = filename.replace(/-original\.[^.]+$/, '')
    const fileExt = filename.split('.').pop() || 'jpg'

    const filesToDelete = [
      filename, // Original
      `${baseFileName}-large.jpg`,
      `${baseFileName}-thumb.jpg`,
    ]

    // Delete all versions from storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .remove(filesToDelete)

    if (storageError) {
      console.warn('Error deleting from storage:', storageError)
      // Continue anyway to delete metadata
    }

    // Delete metadata
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId)

    if (dbError) {
      return { success: false, error: new Error(dbError.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

export async function getPublicAlbumWithMedia(shareId: string): Promise<{
  album: { id: string; title: string; description?: string } | null
  media: Media[] | null
  error: Error | null
}> {
  try {
    // Get album by share_id
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('id, title, description, is_public')
      .eq('share_id', shareId)
      .single()

    if (albumError) {
      return { album: null, media: null, error: new Error(albumError.message) }
    }

    if (!album.is_public) {
      return { album: null, media: null, error: new Error('Album is not public') }
    }

    // Get media for album
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .eq('album_id', album.id)
      .order('uploaded_at', { ascending: false })

    if (mediaError) {
      return { album, media: null, error: new Error(mediaError.message) }
    }

    return { album, media, error: null }
  } catch (error) {
    return { album: null, media: null, error: error as Error }
  }
}

/**
 * Get the best URL for displaying an image in a grid (thumbnail)
 */
export function getGridImageUrl(media: Media): string {
  return media.thumbnail_url || media.large_url || media.blob_url
}

/**
 * Get the best URL for viewing an image full-screen
 */
export function getViewImageUrl(media: Media): string {
  return media.large_url || media.blob_url
}

/**
 * Get the original/raw URL for downloading
 */
export function getDownloadUrl(media: Media): string {
  return media.blob_url
}
