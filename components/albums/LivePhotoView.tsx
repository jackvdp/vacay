import { useState, useRef, useEffect } from 'react'
import { View, Pressable, Platform, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import type { Media } from '@/types/album'
import { getGridImageUrl, isLivePhoto, getLiveVideoUrl } from '@/lib/media'

interface LivePhotoViewProps {
  media: Media
  style?: object
  showBadge?: boolean
  onPress?: () => void
  onLongPressStart?: () => void
  onLongPressEnd?: () => void
}

export function LivePhotoView({
  media,
  style,
  showBadge = true,
  onPress,
  onLongPressStart,
  onLongPressEnd,
}: LivePhotoViewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRef = useRef<Video>(null)
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null)

  const isLive = isLivePhoto(media)
  const videoUrl = getLiveVideoUrl(media)
  const imageUrl = getGridImageUrl(media)

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current)
      }
    }
  }, [])

  const handlePressIn = () => {
    if (!isLive || !videoUrl || Platform.OS === 'web') return

    // Start long press detection
    longPressTimeout.current = setTimeout(() => {
      setIsPlaying(true)
      onLongPressStart?.()

      // Play the video
      if (videoRef.current) {
        videoRef.current.setPositionAsync(0)
        videoRef.current.playAsync()
      }
    }, 200) // 200ms hold to trigger
  }

  const handlePressOut = () => {
    // Clear the timeout if released before threshold
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }

    if (isPlaying) {
      setIsPlaying(false)
      onLongPressEnd?.()

      // Stop the video
      if (videoRef.current) {
        videoRef.current.stopAsync()
      }
    }
  }

  const handlePress = () => {
    // Only trigger onPress if it wasn't a long press
    if (!isPlaying) {
      onPress?.()
    }
  }

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoaded(true)
      // Loop the video while holding
      if (status.didJustFinish && isPlaying) {
        videoRef.current?.setPositionAsync(0)
        videoRef.current?.playAsync()
      }
    }
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.container, style]}
    >
      {/* Still image - always visible */}
      <Image
        source={{ uri: imageUrl }}
        contentFit="cover"
        style={[styles.image, isPlaying && styles.hidden]}
      />

      {/* Live Photo video - only on native, visible when playing */}
      {isLive && videoUrl && Platform.OS !== 'web' && (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={[styles.video, !isPlaying && styles.hidden]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping={false}
          isMuted={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
      )}

      {/* LIVE badge */}
      {isLive && showBadge && !isPlaying && (
        <View style={styles.badge}>
          <Ionicons name="radio-button-on" size={8} color="#fff" />
          <View style={styles.badgeTextContainer}>
            <Ionicons name="radio-button-on" size={6} color="#fff" style={styles.badgeIcon} />
          </View>
        </View>
      )}

      {/* Playing indicator */}
      {isPlaying && (
        <View style={styles.playingIndicator}>
          <Ionicons name="radio-button-on" size={12} color="#fff" />
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    opacity: 0,
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  badgeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginLeft: 2,
  },
  playingIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
})
