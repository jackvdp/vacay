import { useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AlbumCard, CreateAlbumModal } from '@/components/albums'
import { getUserAlbums } from '@/lib/albums'
import { getAlbumMedia } from '@/lib/media'
import type { Album, Media } from '@/types/album'

interface AlbumWithCover extends Album {
  coverImage?: Media | null
  mediaCount: number
}

export default function DashboardScreen() {
  const [albums, setAlbums] = useState<AlbumWithCover[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadAlbums = useCallback(async () => {
    try {
      const { albums: albumData } = await getUserAlbums()

      if (albumData) {
        // Fetch cover images for each album
        const albumsWithCovers = await Promise.all(
          albumData.map(async (album) => {
            const { media } = await getAlbumMedia(album.id)
            return {
              ...album,
              coverImage: media?.[0] || null,
              mediaCount: media?.length || 0,
            }
          })
        )
        setAlbums(albumsWithCovers)
      }
    } catch (error) {
      console.error('Error loading albums:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadAlbums()
    }, [loadAlbums])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadAlbums()
  }, [loadAlbums])

  const renderItem = ({ item }: { item: AlbumWithCover }) => (
    <View className="px-4 pb-4">
      <AlbumCard
        album={item}
        coverImage={item.coverImage}
        mediaCount={item.mediaCount}
      />
    </View>
  )

  const ListEmptyComponent = () => (
    <View className="flex-1 items-center justify-center py-20 px-6">
      <Ionicons name="images-outline" size={64} color="#cbd5e1" />
      <Text className="text-xl font-semibold text-slate-700 mt-4">
        No albums yet
      </Text>
      <Text className="text-slate-500 text-center mt-2">
        Create your first album to start sharing memories
      </Text>
      <Pressable
        onPress={() => setShowCreateModal(true)}
        className="mt-6 flex-row items-center gap-2 bg-primary-600 px-6 py-3 rounded-xl active:bg-primary-700"
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text className="text-white font-semibold text-lg">Create Album</Text>
      </Pressable>
    </View>
  )

  const ListHeaderComponent = () => (
    <View className="flex-row items-center justify-between px-4 py-4">
      <Text className="text-2xl font-bold text-slate-900">My Albums</Text>
      <Pressable
        onPress={() => setShowCreateModal(true)}
        className="w-10 h-10 items-center justify-center rounded-full bg-primary-600 active:bg-primary-700"
      >
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>
    </View>
  )

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={albums}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={albums.length > 0 ? ListHeaderComponent : null}
        ListEmptyComponent={loading ? null : ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0d9488"
          />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      />

      <CreateAlbumModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadAlbums}
      />
    </View>
  )
}
