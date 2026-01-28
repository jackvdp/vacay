import { supabase } from './supabase'
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

export async function uploadMediaToSupabase(
  albumId: string,
  file: {
    uri: string
    name: string
    type: string
    size?: number
  },
  onProgress?: (progress: number) => void
): Promise<{ media: Media | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { media: null, error: new Error('User not authenticated') }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${albumId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Fetch the file as blob
    const response = await fetch(file.uri)
    const blob = await response.blob()

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, blob, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return { media: null, error: new Error(uploadError.message) }
    }

    onProgress?.(50)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(fileName)

    // Save metadata to database
    const { data: media, error: metadataError } = await supabase
      .from('media')
      .insert({
        album_id: albumId,
        uploader_id: user.id,
        filename: fileName,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size || blob.size,
        blob_url: urlData.publicUrl,
      })
      .select()
      .single()

    if (metadataError) {
      // Try to clean up uploaded file
      await supabase.storage.from('media').remove([fileName])
      return { media: null, error: new Error(metadataError.message) }
    }

    onProgress?.(100)

    return { media, error: null }
  } catch (error) {
    return { media: null, error: error as Error }
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

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([filename])

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
