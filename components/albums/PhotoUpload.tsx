import { useState } from 'react'
import { View, Text, Alert, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui'
import { uploadMediaToSupabase } from '@/lib/media'
import { isValidMimeType } from '@/lib/utils'

interface PhotoUploadProps {
  albumId: string
  onUploadComplete: () => void
}

/**
 * Check if an asset is a Live Photo (iOS only)
 */
function checkIfLivePhoto(asset: MediaLibrary.Asset): boolean {
  if (Platform.OS !== 'ios') return false
  const subtypes = asset.mediaSubtypes || []
  return subtypes.includes('livePhoto')
}

/**
 * Get the Live Photo video URI using the asset's local URI
 */
async function getLivePhotoVideoUri(asset: MediaLibrary.Asset): Promise<string | null> {
  if (Platform.OS !== 'ios') return null

  try {
    const assetInfo = await MediaLibrary.getAssetInfoAsync(asset)
    if (assetInfo.localUri) {
      // Live Photo videos are typically stored with .MOV extension
      // alongside the image with same base name
      const videoUri = assetInfo.localUri.replace(/\.(heic|jpg|jpeg|png)$/i, '.MOV')
      return videoUri
    }
  } catch (error) {
    console.warn('Error getting Live Photo video URI:', error)
  }
  return null
}

export function PhotoUpload({ albumId, onUploadComplete }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    current: number
    total: number
  } | null>(null)

  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload photos.'
        )
        return false
      }
    }
    return true
  }

  const pickImages = async () => {
    const hasPermission = await requestPermission()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 1, // Full quality to preserve original
        selectionLimit: 20,
      })

      if (result.canceled || result.assets.length === 0) return

      setUploading(true)
      setUploadProgress({ current: 0, total: result.assets.length })

      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i]
        setUploadProgress({ current: i + 1, total: result.assets.length })

        // Get file info
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`
        const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg')

        if (!isValidMimeType(mimeType)) {
          errorCount++
          continue
        }

        // Check for Live Photo on iOS
        let isLivePhoto = false
        let liveVideoUri: string | undefined

        if (Platform.OS === 'ios' && asset.assetId) {
          try {
            // Get the full asset from MediaLibrary to check for Live Photo
            const mediaAsset = await MediaLibrary.getAssetInfoAsync(asset.assetId)
            if (mediaAsset) {
              isLivePhoto = checkIfLivePhoto(mediaAsset as MediaLibrary.Asset)
              if (isLivePhoto) {
                const videoUri = await getLivePhotoVideoUri(mediaAsset as MediaLibrary.Asset)
                if (videoUri) {
                  liveVideoUri = videoUri
                }
              }
            }
          } catch (err) {
            console.warn('Could not check Live Photo status:', err)
          }
        }

        const { error } = await uploadMediaToSupabase(albumId, {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
          size: asset.fileSize,
          isLivePhoto,
          liveVideoUri,
        })

        if (error) {
          console.error('Upload error:', error)
          errorCount++
        } else {
          successCount++
        }
      }

      if (errorCount > 0) {
        Alert.alert(
          'Upload Complete',
          `${successCount} uploaded successfully, ${errorCount} failed.`
        )
      }

      onUploadComplete()
    } catch (error) {
      console.error('Pick images error:', error)
      Alert.alert('Error', 'Failed to pick images')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web')
      return
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take photos.'
      )
      return
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 1,
      })

      if (result.canceled || !result.assets[0]) return

      setUploading(true)
      setUploadProgress({ current: 1, total: 1 })

      const asset = result.assets[0]
      const fileName = asset.fileName || `photo_${Date.now()}.jpg`
      const mimeType = asset.mimeType || 'image/jpeg'

      // Camera photos are not Live Photos
      const { error } = await uploadMediaToSupabase(albumId, {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
        size: asset.fileSize,
        isLivePhoto: false,
      })

      if (error) {
        Alert.alert('Error', 'Failed to upload photo')
      }

      onUploadComplete()
    } catch (error) {
      console.error('Camera error:', error)
      Alert.alert('Error', 'Failed to take photo')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  if (uploading && uploadProgress) {
    return (
      <View className="flex-row items-center justify-center gap-3 py-4 px-6 bg-primary-50 rounded-xl">
        <Ionicons name="cloud-upload" size={24} color="#0d9488" />
        <Text className="text-primary-700 font-medium">
          Uploading {uploadProgress.current} of {uploadProgress.total}...
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-row gap-3">
      <Button
        variant="primary"
        onPress={pickImages}
        disabled={uploading}
        className="flex-1"
        icon={<Ionicons name="images" size={20} color="#fff" />}
      >
        Add Photos
      </Button>
      {Platform.OS !== 'web' && (
        <Button
          variant="outline"
          onPress={takePhoto}
          disabled={uploading}
          icon={<Ionicons name="camera" size={20} color="#0d9488" />}
        >
          Camera
        </Button>
      )}
    </View>
  )
}
