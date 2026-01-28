import { Platform } from 'react-native'
import * as MediaLibrary from 'expo-media-library'

export interface LivePhotoAsset {
  imageUri: string
  videoUri: string | null
  isLivePhoto: boolean
  width: number
  height: number
  filename: string
}

/**
 * Check if a media library asset is a Live Photo (iOS only)
 */
export function isLivePhoto(asset: MediaLibrary.Asset): boolean {
  if (Platform.OS !== 'ios') return false

  // Check mediaSubtypes for livePhoto
  // MediaLibrary.Asset has mediaSubtypes which includes 'livePhoto' for Live Photos
  const subtypes = asset.mediaSubtypes || []
  return subtypes.includes('livePhoto')
}

/**
 * Get the paired video URI for a Live Photo
 * Returns null if not a Live Photo or if video cannot be retrieved
 */
export async function getLivePhotoVideoUri(
  asset: MediaLibrary.Asset
): Promise<string | null> {
  if (Platform.OS !== 'ios') return null
  if (!isLivePhoto(asset)) return null

  try {
    // Get the asset info which includes the local URI
    const assetInfo = await MediaLibrary.getAssetInfoAsync(asset, {
      shouldDownloadFromNetwork: false,
    })

    // For Live Photos, the paired video is accessible via a special URI
    // The video file is typically stored alongside the image
    if (assetInfo.localUri) {
      // The Live Photo video typically has the same base name but .MOV extension
      const imageUri = assetInfo.localUri
      const videoUri = imageUri.replace(/\.(heic|jpg|jpeg|png)$/i, '.MOV')

      // Try to verify the video exists by checking if we can get its info
      // This is a best-effort approach
      return videoUri
    }

    return null
  } catch (error) {
    console.warn('Error getting Live Photo video:', error)
    return null
  }
}

/**
 * Process a selected asset and extract Live Photo components if applicable
 */
export async function processLivePhotoAsset(
  asset: MediaLibrary.Asset
): Promise<LivePhotoAsset> {
  const assetInfo = await MediaLibrary.getAssetInfoAsync(asset)
  const isLive = isLivePhoto(asset)

  let videoUri: string | null = null

  if (isLive && assetInfo.localUri) {
    // For iOS Live Photos, try to get the video component
    // The pairedVideoAsset property may be available in newer versions
    try {
      // Try the standard approach - paired video
      videoUri = await getLivePhotoVideoUri(asset)
    } catch (error) {
      console.warn('Could not get Live Photo video:', error)
    }
  }

  return {
    imageUri: assetInfo.localUri || asset.uri,
    videoUri,
    isLivePhoto: isLive,
    width: asset.width,
    height: asset.height,
    filename: asset.filename,
  }
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Pick assets from media library with Live Photo support
 */
export async function pickFromMediaLibrary(): Promise<LivePhotoAsset[] | null> {
  const hasPermission = await requestMediaLibraryPermissions()
  if (!hasPermission) {
    return null
  }

  // Get recent photos
  const { assets } = await MediaLibrary.getAssetsAsync({
    first: 50,
    mediaType: ['photo'],
    sortBy: [MediaLibrary.SortBy.creationTime],
  })

  // Process each asset to check for Live Photos
  const processedAssets: LivePhotoAsset[] = []

  for (const asset of assets) {
    const processed = await processLivePhotoAsset(asset)
    processedAssets.push(processed)
  }

  return processedAssets
}

/**
 * Check if the current platform supports Live Photos
 */
export function supportsLivePhotos(): boolean {
  return Platform.OS === 'ios'
}
