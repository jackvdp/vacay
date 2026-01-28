import { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
  Share,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '@/lib/auth-context'
import { getAlbumById, updateAlbum, deleteAlbum } from '@/lib/albums'
import { getAlbumMedia, deleteMedia } from '@/lib/media'
import { PhotoGrid, PhotoUpload, MemberManagementModal } from '@/components/albums'
import { Button, Modal, Input, Switch } from '@/components/ui'
import type { Album, Media } from '@/types/album'

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [album, setAlbum] = useState<Album | null>(null)
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)

  const isCreator = album?.creator_id === user?.id

  const loadAlbum = useCallback(async () => {
    if (!id) return

    try {
      const [albumResult, mediaResult] = await Promise.all([
        getAlbumById(id),
        getAlbumMedia(id),
      ])

      if (albumResult.album) {
        setAlbum(albumResult.album)
        setEditTitle(albumResult.album.title)
        setEditDescription(albumResult.album.description || '')
        setEditIsPublic(albumResult.album.is_public)
      }

      if (mediaResult.media) {
        setMedia(mediaResult.media)
      }
    } catch (error) {
      console.error('Error loading album:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useFocusEffect(
    useCallback(() => {
      loadAlbum()
    }, [loadAlbum])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadAlbum()
  }, [loadAlbum])

  const handleShare = async () => {
    if (!album?.is_public) {
      Alert.alert(
        'Album is Private',
        'Make your album public to share it with others.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Make Public',
            onPress: async () => {
              const { error } = await updateAlbum(album!.id, { is_public: true })
              if (!error) {
                setAlbum({ ...album!, is_public: true })
                setEditIsPublic(true)
                handleShare()
              }
            },
          },
        ]
      )
      return
    }

    const shareUrl = `${Platform.OS === 'web' ? window.location.origin : 'https://vacay.app'}/share/${album.share_id}`

    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(shareUrl)
      Alert.alert('Link Copied', 'Share link has been copied to clipboard')
    } else {
      try {
        await Share.share({
          message: `Check out my album "${album.title}" on Vacay!\n${shareUrl}`,
          url: shareUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  const handleSaveEdit = async () => {
    if (!album || !editTitle.trim()) return

    setSaving(true)
    try {
      const { album: updatedAlbum, error } = await updateAlbum(album.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        is_public: editIsPublic,
      })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      if (updatedAlbum) {
        setAlbum(updatedAlbum)
      }
      setShowEditModal(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to update album')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAlbum = () => {
    Alert.alert(
      'Delete Album',
      'Are you sure you want to delete this album? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAlbum(album!.id)
            if (error) {
              Alert.alert('Error', error.message)
            } else {
              router.back()
            }
          },
        },
      ]
    )
  }

  const handleDeleteMedia = (item: Media) => {
    const canDelete = item.uploader_id === user?.id || isCreator

    if (!canDelete) {
      Alert.alert('Cannot Delete', 'You can only delete photos you uploaded.')
      return
    }

    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteMedia(item.id, item.filename)
          if (error) {
            Alert.alert('Error', error.message)
          } else {
            setMedia((prev) => prev.filter((m) => m.id !== item.id))
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-500">Loading...</Text>
      </View>
    )
  }

  if (!album) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-500">Album not found</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0d9488"
          />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-slate-900">
                {album.title}
              </Text>
              {album.description && (
                <Text className="text-slate-500 mt-1">{album.description}</Text>
              )}
              <View className="flex-row items-center mt-2 gap-3">
                <View className="flex-row items-center">
                  <Ionicons name="images" size={14} color="#64748b" />
                  <Text className="text-sm text-slate-500 ml-1">
                    {media.length} photos
                  </Text>
                </View>
                {album.is_public && (
                  <View className="flex-row items-center">
                    <Ionicons name="globe-outline" size={14} color="#64748b" />
                    <Text className="text-sm text-slate-500 ml-1">Public</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowMembersModal(true)}
                className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center active:bg-primary-200"
              >
                <Ionicons name="people-outline" size={20} color="#0d9488" />
              </Pressable>
              <Pressable
                onPress={handleShare}
                className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center active:bg-primary-200"
              >
                <Ionicons name="share-outline" size={20} color="#0d9488" />
              </Pressable>
              {isCreator && (
                <Pressable
                  onPress={() => setShowEditModal(true)}
                  className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
                >
                  <Ionicons name="settings-outline" size={20} color="#64748b" />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Upload Section */}
        <View className="px-4 py-3">
          <PhotoUpload albumId={album.id} onUploadComplete={loadAlbum} />
        </View>

        {/* Photo Grid */}
        <PhotoGrid
          media={media}
          onDeletePress={handleDeleteMedia}
          canDelete={true}
        />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Album"
      >
        <View className="gap-4">
          <Input
            label="Title"
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Album title"
          />
          <Input
            label="Description"
            value={editDescription}
            onChangeText={setEditDescription}
            placeholder="Optional description"
            multiline
            numberOfLines={3}
          />
          <Switch
            value={editIsPublic}
            onValueChange={setEditIsPublic}
            label="Public Album"
            description="Anyone with the link can view"
          />
          <View className="flex-row gap-3 mt-2">
            <Button
              variant="danger"
              onPress={handleDeleteAlbum}
              className="flex-1"
            >
              Delete
            </Button>
            <Button onPress={handleSaveEdit} loading={saving} className="flex-1">
              Save
            </Button>
          </View>
        </View>
      </Modal>

      {/* Members Modal */}
      <MemberManagementModal
        visible={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        albumId={album.id}
        isCreator={isCreator}
      />
    </View>
  )
}
