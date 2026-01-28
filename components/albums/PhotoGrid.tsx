import { View, Text, Pressable, Dimensions, FlatList } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import type { Media } from '@/types/album'
import { isVideo } from '@/lib/utils'
import { getGridImageUrl } from '@/lib/media'

interface PhotoGridProps {
  media: Media[]
  onMediaPress?: (media: Media, index: number) => void
  onDeletePress?: (media: Media) => void
  canDelete?: boolean
  numColumns?: number
}

export function PhotoGrid({
  media,
  onMediaPress,
  onDeletePress,
  canDelete = false,
  numColumns = 3,
}: PhotoGridProps) {
  const screenWidth = Dimensions.get('window').width
  const gap = 2
  const itemWidth = (screenWidth - gap * (numColumns + 1)) / numColumns

  const renderItem = ({ item, index }: { item: Media; index: number }) => {
    const isVideoFile = isVideo(item.mime_type)

    return (
      <Pressable
        onPress={() => onMediaPress?.(item, index)}
        className="relative active:opacity-80"
        style={{ width: itemWidth, height: itemWidth, margin: gap / 2 }}
      >
        <Image
          source={{ uri: getGridImageUrl(item) }}
          contentFit="cover"
          className="w-full h-full"
        />

        {/* Video indicator */}
        {isVideoFile && (
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-10 h-10 rounded-full bg-black/50 items-center justify-center">
              <Ionicons name="play" size={20} color="#fff" />
            </View>
          </View>
        )}

        {/* Delete button */}
        {canDelete && onDeletePress && (
          <Pressable
            onPress={() => onDeletePress(item)}
            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/50 items-center justify-center active:bg-black/70"
          >
            <Ionicons name="trash-outline" size={14} color="#fff" />
          </Pressable>
        )}
      </Pressable>
    )
  }

  if (media.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Ionicons name="images-outline" size={64} color="#cbd5e1" />
        <Text className="text-slate-400 mt-4 text-base">No photos yet</Text>
        <Text className="text-slate-400 text-sm mt-1">Add some memories to this album</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={media}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: gap / 2 }}
    />
  )
}
