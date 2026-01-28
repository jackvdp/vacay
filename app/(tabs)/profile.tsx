import { View, Text, Pressable, Alert } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/lib/auth-context'
import { Button, Card } from '@/components/ui'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/')
        },
      },
    ])
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const fullName = user?.user_metadata?.full_name || 'User'
  const email = user?.email || ''

  return (
    <View className="flex-1 bg-slate-50 px-4 pt-6">
      {/* Profile Header */}
      <Card className="items-center py-6">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="w-24 h-24 rounded-full"
            contentFit="cover"
          />
        ) : (
          <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center">
            <Ionicons name="person" size={40} color="#0d9488" />
          </View>
        )}
        <Text className="text-xl font-semibold text-slate-900 mt-4">
          {fullName}
        </Text>
        <Text className="text-slate-500 mt-1">{email}</Text>
      </Card>

      {/* Menu Items */}
      <View className="mt-6 gap-2">
        <Card>
          <Pressable className="flex-row items-center py-2">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Ionicons name="settings-outline" size={20} color="#0d9488" />
            </View>
            <Text className="flex-1 text-slate-900 font-medium ml-3">
              Settings
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </Card>

        <Card>
          <Pressable className="flex-row items-center py-2">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Ionicons name="help-circle-outline" size={20} color="#0d9488" />
            </View>
            <Text className="flex-1 text-slate-900 font-medium ml-3">
              Help & Support
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </Card>

        <Card>
          <Pressable className="flex-row items-center py-2">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Ionicons name="information-circle-outline" size={20} color="#0d9488" />
            </View>
            <Text className="flex-1 text-slate-900 font-medium ml-3">
              About
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </Card>
      </View>

      {/* Sign Out Button */}
      <View className="mt-auto pb-8">
        <Button variant="outline" onPress={handleSignOut}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="log-out-outline" size={20} color="#0d9488" />
            <Text className="text-primary-600 font-semibold">Sign Out</Text>
          </View>
        </Button>
      </View>
    </View>
  )
}
