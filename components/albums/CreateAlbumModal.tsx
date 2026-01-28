import { useState } from 'react'
import { View, Text, Alert } from 'react-native'
import { Modal, Input, Button, Switch } from '@/components/ui'
import { createAlbum } from '@/lib/albums'

interface CreateAlbumModalProps {
  visible: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateAlbumModal({ visible, onClose, onCreated }: CreateAlbumModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your album')
      return
    }

    setLoading(true)
    try {
      const { album, error } = await createAlbum({
        title: title.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      // Reset form
      setTitle('')
      setDescription('')
      setIsPublic(false)

      onCreated()
      onClose()
    } catch (err) {
      Alert.alert('Error', 'Failed to create album')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setIsPublic(false)
    onClose()
  }

  return (
    <Modal visible={visible} onClose={handleClose} title="Create Album">
      <View className="gap-4">
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="My Vacation Photos"
          autoCapitalize="words"
        />

        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Summer trip to..."
          multiline
          numberOfLines={3}
        />

        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          label="Public Album"
          description="Anyone with the link can view this album"
        />

        <View className="flex-row gap-3 mt-2">
          <Button
            variant="secondary"
            onPress={handleClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onPress={handleCreate}
            className="flex-1"
            loading={loading}
          >
            Create
          </Button>
        </View>
      </View>
    </Modal>
  )
}
