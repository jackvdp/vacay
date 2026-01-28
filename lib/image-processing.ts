import { Platform } from 'react-native'
import * as ImageManipulator from 'expo-image-manipulator'

export interface ProcessedImages {
  original: {
    uri: string
    width: number
    height: number
  }
  large: {
    uri: string
    width: number
    height: number
  }
  thumbnail: {
    uri: string
    width: number
    height: number
  }
}

const LARGE_MAX_SIZE = 1500 // Max dimension for viewing
const THUMB_MAX_SIZE = 400 // Max dimension for thumbnails
const JPEG_QUALITY = 0.85

/**
 * Check if a file is an image that can be processed
 */
export function isProcessableImage(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)
}

/**
 * Process an image to create original, large, and thumbnail versions
 */
export async function processImage(
  uri: string,
  mimeType: string
): Promise<ProcessedImages | null> {
  // Skip processing for non-image files (videos, gifs)
  if (!isProcessableImage(mimeType)) {
    return null
  }

  if (Platform.OS === 'web') {
    return processImageWeb(uri)
  } else {
    return processImageNative(uri)
  }
}

/**
 * Process image on native platforms using expo-image-manipulator
 */
async function processImageNative(uri: string): Promise<ProcessedImages> {
  // Get original dimensions first
  const originalResult = await ImageManipulator.manipulateAsync(uri, [], {
    format: ImageManipulator.SaveFormat.JPEG,
  })

  const originalWidth = originalResult.width
  const originalHeight = originalResult.height

  // Create large version
  const largeResult = await createResizedImage(
    uri,
    originalWidth,
    originalHeight,
    LARGE_MAX_SIZE
  )

  // Create thumbnail version
  const thumbResult = await createResizedImage(
    uri,
    originalWidth,
    originalHeight,
    THUMB_MAX_SIZE
  )

  return {
    original: {
      uri: originalResult.uri,
      width: originalWidth,
      height: originalHeight,
    },
    large: largeResult,
    thumbnail: thumbResult,
  }
}

/**
 * Create a resized image maintaining aspect ratio
 */
async function createResizedImage(
  uri: string,
  originalWidth: number,
  originalHeight: number,
  maxSize: number
): Promise<{ uri: string; width: number; height: number }> {
  // Calculate new dimensions maintaining aspect ratio
  let newWidth = originalWidth
  let newHeight = originalHeight

  if (originalWidth > maxSize || originalHeight > maxSize) {
    if (originalWidth > originalHeight) {
      newWidth = maxSize
      newHeight = Math.round((originalHeight / originalWidth) * maxSize)
    } else {
      newHeight = maxSize
      newWidth = Math.round((originalWidth / originalHeight) * maxSize)
    }
  }

  // If already smaller than max, return original dimensions
  if (newWidth === originalWidth && newHeight === originalHeight) {
    const result = await ImageManipulator.manipulateAsync(uri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
      compress: JPEG_QUALITY,
    })
    return { uri: result.uri, width: newWidth, height: newHeight }
  }

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: newWidth, height: newHeight } }],
    {
      format: ImageManipulator.SaveFormat.JPEG,
      compress: JPEG_QUALITY,
    }
  )

  return { uri: result.uri, width: newWidth, height: newHeight }
}

/**
 * Process image on web using Canvas API
 */
async function processImageWeb(uri: string): Promise<ProcessedImages> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = async () => {
      const originalWidth = img.width
      const originalHeight = img.height

      try {
        // Create large version
        const large = await resizeImageCanvas(
          img,
          originalWidth,
          originalHeight,
          LARGE_MAX_SIZE
        )

        // Create thumbnail version
        const thumbnail = await resizeImageCanvas(
          img,
          originalWidth,
          originalHeight,
          THUMB_MAX_SIZE
        )

        resolve({
          original: {
            uri,
            width: originalWidth,
            height: originalHeight,
          },
          large,
          thumbnail,
        })
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = uri
  })
}

/**
 * Resize image using Canvas API (web only)
 */
function resizeImageCanvas(
  img: HTMLImageElement,
  originalWidth: number,
  originalHeight: number,
  maxSize: number
): Promise<{ uri: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    try {
      let newWidth = originalWidth
      let newHeight = originalHeight

      if (originalWidth > maxSize || originalHeight > maxSize) {
        if (originalWidth > originalHeight) {
          newWidth = maxSize
          newHeight = Math.round((originalHeight / originalWidth) * maxSize)
        } else {
          newHeight = maxSize
          newWidth = Math.round((originalWidth / originalHeight) * maxSize)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Use better quality scaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      resolve({ uri: dataUrl, width: newWidth, height: newHeight })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Convert a data URL to a Blob (for web uploads)
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}
