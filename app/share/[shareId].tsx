import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Platform,
  Alert,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import { getPublicAlbumWithMedia } from '@/lib/media'
import { isVideo } from '@/lib/utils'
import { Button } from '@/components/ui'
import type { Media } from '@/types/album'

export default function ShareScreen() {
  const { shareId } = useLocalSearchParams<{ shareId: string }>()

  const [album, setAlbum] = useState<{ title: string; description?: string } | null>(null)
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [batchDownloading, setBatchDownloading] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })

  const loadAlbum = async () => {
    if (!shareId) return

    try {
      const result = await getPublicAlbumWithMedia(shareId)

      if (result.error) {
        setError(result.error.message)
        return
      }

      setAlbum(result.album)
      setMedia(result.media || [])
    } catch (err) {
      setError('Failed to load album')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAlbum()
  }, [shareId])

  const handleDownload = async (item: Media) => {
    setDownloading(item.id)

    try {
      if (Platform.OS === 'web') {
        // Web: Trigger download
        const link = document.createElement('a')
        link.href = item.blob_url
        link.download = item.original_name
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Mobile: Save to camera roll
        const { status } = await MediaLibrary.requestPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please allow access to save photos to your library')
          return
        }

        const fileUri = `${FileSystem.documentDirectory}${item.original_name}`
        const downloadResult = await FileSystem.downloadAsync(
          item.blob_url,
          fileUri
        )

        await MediaLibrary.saveToLibraryAsync(downloadResult.uri)

        // Clean up temp file
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true })

        Alert.alert('Saved', 'Photo saved to your library')
      }
    } catch (err) {
      console.error('Download error:', err)
      Alert.alert('Error', 'Failed to download')
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadAll = async () => {
    if (media.length === 0) return

    if (Platform.OS === 'web') {
      // Web: Download files with delay between each
      setBatchDownloading(true)
      setBatchProgress({ current: 0, total: media.length })

      for (let i = 0; i < media.length; i++) {
        const item = media[i]
        setBatchProgress({ current: i + 1, total: media.length })

        const link = document.createElement('a')
        link.href = item.blob_url
        link.download = item.original_name
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Add delay between downloads to prevent browser blocking
        if (i < media.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      setBatchDownloading(false)
      Alert.alert('Complete', `Downloaded ${media.length} files`)
    } else {
      // Mobile: Request permission first
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save photos to your library')
        return
      }

      setBatchDownloading(true)
      setBatchProgress({ current: 0, total: media.length })

      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < media.length; i++) {
        const item = media[i]
        setBatchProgress({ current: i + 1, total: media.length })

        try {
          const fileUri = `${FileSystem.documentDirectory}${Date.now()}_${item.original_name}`
          const downloadResult = await FileSystem.downloadAsync(
            item.blob_url,
            fileUri
          )

          await MediaLibrary.saveToLibraryAsync(downloadResult.uri)

          // Clean up temp file
          await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true })

          successCount++
        } catch (err) {
          console.error('Download error for', item.original_name, err)
          errorCount++
        }

        // Small delay between saves
        if (i < media.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      setBatchDownloading(false)

      if (errorCount > 0) {
        Alert.alert('Complete', `Saved ${successCount} of ${media.length} photos. ${errorCount} failed.`)
      } else {
        Alert.alert('Complete', `All ${successCount} photos saved to your library!`)
      }
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-500">Loading album...</Text>
      </View>
    )
  }

  if (error || !album) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Ionicons name="lock-closed-outline" size={64} color="#cbd5e1" />
        <Text className="text-xl font-semibold text-slate-700 mt-4 text-center">
          {error || 'Album not found'}
        </Text>
        <Text className="text-slate-500 text-center mt-2">
          This album may be private or no longer exists.
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadAlbum()
            }}
            tintColor="#0d9488"
          />
        }
      >
        {/* Header */}
        <View className="px-4 pt-12 pb-4 bg-white border-b border-slate-100">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-8 h-8 rounded-lg bg-primary-600 items-center justify-center">
              <Ionicons name="images" size={16} color="#fff" />
            </View>
            <Text className="text-sm font-medium text-primary-600">Vacay</Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900">{album.title}</Text>
          {album.description && (
            <Text className="text-slate-500 mt-1">{album.description}</Text>
          )}
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-sm text-slate-400">
              {media.length} {media.length === 1 ? 'photo' : 'photos'}
            </Text>
            {media.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onPress={handleDownloadAll}
                disabled={batchDownloading}
                icon={<Ionicons name="download" size={16} color="#fff" />}
              >
                {batchDownloading
                  ? `${batchProgress.current}/${batchProgress.total}`
                  : 'Download All'}
              </Button>
            )}
          </View>
        </View>

        {/* Batch download progress */}
        {batchDownloading && (
          <View className="mx-4 mt-3 p-3 bg-primary-50 rounded-xl flex-row items-center">
            <Ionicons name="cloud-download" size={20} color="#0d9488" />
            <Text className="text-primary-700 ml-2 font-medium">
              Downloading {batchProgress.current} of {batchProgress.total}...
            </Text>
          </View>
        )}

        {/* Media Grid */}
        <View className="flex-row flex-wrap">
          {media.map((item) => {
            const isVideoFile = isVideo(item.mime_type)
            const isDownloading = downloading === item.id

            return (
              <View key={item.id} className="w-1/3 aspect-square p-0.5">
                <Pressable className="relative w-full h-full">
                  <Image
                    source={{ uri: item.blob_url }}
                    contentFit="cover"
                    className="w-full h-full"
                  />

                  {isVideoFile && (
                    <View className="absolute inset-0 items-center justify-center">
                      <View className="w-10 h-10 rounded-full bg-black/50 items-center justify-center">
                        <Ionicons name="play" size={20} color="#fff" />
                      </View>
                    </View>
                  )}

                  {/* Download button */}
                  <Pressable
                    onPress={() => handleDownload(item)}
                    disabled={isDownloading || batchDownloading}
                    className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-black/50 items-center justify-center active:bg-black/70"
                  >
                    {isDownloading ? (
                      <Ionicons name="hourglass" size={16} color="#fff" />
                    ) : (
                      <Ionicons name="download-outline" size={16} color="#fff" />
                    )}
                  </Pressable>
                </Pressable>
              </View>
            )
          })}
        </View>

        {media.length === 0 && (
          <View className="items-center justify-center py-20">
            <Ionicons name="images-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-400 mt-4">No photos in this album yet</Text>
          </View>
        )}

        {/* Footer */}
        <View className="items-center py-8">
          <Text className="text-sm text-slate-400">Shared via Vacay</Text>
        </View>
      </ScrollView>
    </View>
  )
}
