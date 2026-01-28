import { View, Text, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import type { Album, Media } from '@/types/album'

interface AlbumCardProps {
  album: Album
  coverImage?: Media | null
  mediaCount?: number
}

export function AlbumCard({ album, coverImage, mediaCount = 0 }: AlbumCardProps) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => router.push(`/albums/${album.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 active:scale-[0.98]"
    >
      {/* Cover Image */}
      <View className="aspect-[4/3] bg-slate-100">
        {coverImage ? (
          <Image
            source={{ uri: coverImage.blob_url }}
            contentFit="cover"
            className="w-full h-full"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="images-outline" size={48} color="#cbd5e1" />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="p-4">
        <Text className="text-lg font-semibold text-slate-900" numberOfLines={1}>
          {album.title}
        </Text>
        {album.description && (
          <Text className="text-sm text-slate-500 mt-1" numberOfLines={2}>
            {album.description}
          </Text>
        )}
        <View className="flex-row items-center mt-2">
          <Ionicons name="images" size={14} color="#64748b" />
          <Text className="text-sm text-slate-500 ml-1">
            {mediaCount} {mediaCount === 1 ? 'photo' : 'photos'}
          </Text>
          {album.is_public && (
            <>
              <View className="w-1 h-1 rounded-full bg-slate-300 mx-2" />
              <Ionicons name="globe-outline" size={14} color="#64748b" />
              <Text className="text-sm text-slate-500 ml-1">Public</Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  )
}
