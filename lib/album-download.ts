import { Platform } from 'react-native'
import * as MediaLibrary from 'expo-media-library'
import * as FileSystem from 'expo-file-system'
import type { Media } from '@/types/album'
import { getDownloadUrl } from './media'

export interface DownloadProgress {
  current: number
  total: number
  phase: 'downloading' | 'saving' | 'complete' | 'error'
  message: string
}

export interface DownloadResult {
  success: boolean
  savedCount: number
  failedCount: number
  albumName?: string
  error?: string
}

/**
 * Request permissions to save to media library
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false

  const { status } = await MediaLibrary.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Download all media from an album and save to device Photos app as an album
 */
export async function downloadAlbumToDevice(
  albumTitle: string,
  mediaItems: Media[],
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  if (Platform.OS === 'web') {
    return {
      success: false,
      savedCount: 0,
      failedCount: 0,
      error: 'Native album download not available on web',
    }
  }

  // Request permission
  const hasPermission = await requestMediaLibraryPermission()
  if (!hasPermission) {
    return {
      success: false,
      savedCount: 0,
      failedCount: 0,
      error: 'Permission denied. Please allow access to your photo library.',
    }
  }

  const total = mediaItems.length
  let savedCount = 0
  let failedCount = 0
  const savedAssets: MediaLibrary.Asset[] = []

  // Download and save each file
  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i]
    const downloadUrl = getDownloadUrl(item)

    onProgress?.({
      current: i + 1,
      total,
      phase: 'downloading',
      message: `Downloading ${i + 1} of ${total}...`,
    })

    try {
      // Create unique filename to avoid conflicts
      const fileExt = item.original_name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}_${i}_${item.original_name}`
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri)

      if (downloadResult.status !== 200) {
        failedCount++
        continue
      }

      onProgress?.({
        current: i + 1,
        total,
        phase: 'saving',
        message: `Saving ${i + 1} of ${total} to Photos...`,
      })

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri)
      savedAssets.push(asset)
      savedCount++

      // Clean up temp file
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true })

      // Also download Live Photo video if present
      if (item.is_live_photo && item.live_video_url) {
        try {
          const videoFileName = `${Date.now()}_${i}_live.mov`
          const videoUri = `${FileSystem.cacheDirectory}${videoFileName}`

          const videoResult = await FileSystem.downloadAsync(
            item.live_video_url,
            videoUri
          )

          if (videoResult.status === 200) {
            const videoAsset = await MediaLibrary.createAssetAsync(videoResult.uri)
            savedAssets.push(videoAsset)
            await FileSystem.deleteAsync(videoResult.uri, { idempotent: true })
          }
        } catch (videoErr) {
          console.warn('Failed to download Live Photo video:', videoErr)
        }
      }
    } catch (error) {
      console.error(`Failed to download/save item ${i}:`, error)
      failedCount++
    }
  }

  // Create album and add assets (iOS creates album, Android uses folder)
  if (savedAssets.length > 0) {
    onProgress?.({
      current: total,
      total,
      phase: 'saving',
      message: `Creating "${albumTitle}" album...`,
    })

    try {
      // Try to find existing album with this name
      const albums = await MediaLibrary.getAlbumsAsync()
      let album = albums.find(
        (a) => a.title.toLowerCase() === albumTitle.toLowerCase()
      )

      if (!album) {
        // Create new album with first asset
        album = await MediaLibrary.createAlbumAsync(
          albumTitle,
          savedAssets[0],
          false // Don't copy, move the asset
        )

        // Add remaining assets to album
        if (savedAssets.length > 1) {
          await MediaLibrary.addAssetsToAlbumAsync(
            savedAssets.slice(1),
            album,
            false
          )
        }
      } else {
        // Add all assets to existing album
        await MediaLibrary.addAssetsToAlbumAsync(savedAssets, album, false)
      }

      onProgress?.({
        current: total,
        total,
        phase: 'complete',
        message: `Saved ${savedCount} photos to "${albumTitle}"`,
      })

      return {
        success: true,
        savedCount,
        failedCount,
        albumName: albumTitle,
      }
    } catch (albumError) {
      console.error('Failed to create album:', albumError)
      // Assets are still saved, just not in an album
      onProgress?.({
        current: total,
        total,
        phase: 'complete',
        message: `Saved ${savedCount} photos (album creation failed)`,
      })

      return {
        success: true,
        savedCount,
        failedCount,
        error: 'Photos saved but could not create album',
      }
    }
  }

  onProgress?.({
    current: total,
    total,
    phase: failedCount === total ? 'error' : 'complete',
    message: failedCount === total ? 'All downloads failed' : `Saved ${savedCount} photos`,
  })

  return {
    success: savedCount > 0,
    savedCount,
    failedCount,
    error: failedCount === total ? 'All downloads failed' : undefined,
  }
}

/**
 * Web fallback: Download files using browser download
 */
export async function downloadAlbumWeb(
  mediaItems: Media[],
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  const total = mediaItems.length
  let downloadedCount = 0

  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i]

    onProgress?.({
      current: i + 1,
      total,
      phase: 'downloading',
      message: `Downloading ${i + 1} of ${total}...`,
    })

    try {
      const downloadUrl = getDownloadUrl(item)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = item.original_name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      downloadedCount++

      // Delay between downloads to prevent browser blocking
      if (i < mediaItems.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`Failed to download item ${i}:`, error)
    }
  }

  onProgress?.({
    current: total,
    total,
    phase: 'complete',
    message: `Downloaded ${downloadedCount} files`,
  })

  return {
    success: downloadedCount > 0,
    savedCount: downloadedCount,
    failedCount: total - downloadedCount,
  }
}

/**
 * Download album - uses native method on mobile, web fallback on browser
 */
export async function downloadAlbum(
  albumTitle: string,
  mediaItems: Media[],
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  if (Platform.OS === 'web') {
    return downloadAlbumWeb(mediaItems, onProgress)
  } else {
    return downloadAlbumToDevice(albumTitle, mediaItems, onProgress)
  }
}
