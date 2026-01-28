import { useState, useEffect } from 'react'
import { View, Text, Alert, Pressable, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Modal, Input, Button } from '@/components/ui'
import { getAlbumMembers, addAlbumMember, removeAlbumMember } from '@/lib/albums'
import type { AlbumMember } from '@/types/album'

interface MemberManagementModalProps {
  visible: boolean
  onClose: () => void
  albumId: string
  isCreator: boolean
}

export function MemberManagementModal({
  visible,
  onClose,
  albumId,
  isCreator,
}: MemberManagementModalProps) {
  const [members, setMembers] = useState<AlbumMember[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  const loadMembers = async () => {
    setLoading(true)
    try {
      const { members: data } = await getAlbumMembers(albumId)
      if (data) {
        setMembers(data)
      }
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (visible) {
      loadMembers()
    }
  }, [visible, albumId])

  const handleAddMember = async () => {
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter an email address')
      return
    }

    // Basic email validation
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    // Check if already a member
    if (members.some(m => m.allowed_email.toLowerCase() === trimmedEmail)) {
      Alert.alert('Error', 'This person is already a collaborator')
      return
    }

    setAdding(true)
    try {
      const { member, error } = await addAlbumMember(albumId, trimmedEmail)

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      if (member) {
        setMembers(prev => [...prev, member])
        setEmail('')
        Alert.alert('Success', `${trimmedEmail} can now add photos to this album`)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add collaborator')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = (member: AlbumMember) => {
    Alert.alert(
      'Remove Collaborator',
      `Remove ${member.allowed_email} from this album?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await removeAlbumMember(member.id)
            if (error) {
              Alert.alert('Error', error.message)
            } else {
              setMembers(prev => prev.filter(m => m.id !== member.id))
            }
          },
        },
      ]
    )
  }

  const renderMember = ({ item }: { item: AlbumMember }) => (
    <View className="flex-row items-center py-3 border-b border-slate-100">
      <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
        <Ionicons name="person" size={20} color="#0d9488" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-slate-900 font-medium">{item.allowed_email}</Text>
        <Text className="text-slate-500 text-sm capitalize">{item.role}</Text>
      </View>
      {isCreator && (
        <Pressable
          onPress={() => handleRemoveMember(item)}
          className="w-8 h-8 items-center justify-center rounded-full active:bg-slate-100"
        >
          <Ionicons name="close" size={20} color="#ef4444" />
        </Pressable>
      )}
    </View>
  )

  return (
    <Modal visible={visible} onClose={onClose} title="Collaborators">
      <View className="gap-4">
        {/* Add member form - only for creator */}
        {isCreator && (
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Button
              onPress={handleAddMember}
              loading={adding}
              disabled={!email.trim()}
              className="px-4"
            >
              Add
            </Button>
          </View>
        )}

        {/* Member list */}
        <View className="max-h-64">
          {loading ? (
            <Text className="text-slate-500 text-center py-4">Loading...</Text>
          ) : members.length === 0 ? (
            <View className="items-center py-6">
              <Ionicons name="people-outline" size={40} color="#cbd5e1" />
              <Text className="text-slate-500 mt-2 text-center">
                No collaborators yet
              </Text>
              {isCreator && (
                <Text className="text-slate-400 text-sm mt-1 text-center">
                  Add people by email to let them upload photos
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={(item) => item.id}
              scrollEnabled={members.length > 4}
            />
          )}
        </View>

        {/* Close button */}
        <Button variant="secondary" onPress={onClose}>
          Close
        </Button>
      </View>
    </Modal>
  )
}
