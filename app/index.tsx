import { useEffect } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui'

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Hero Section */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo */}
        <View className="w-20 h-20 rounded-2xl bg-primary-600 items-center justify-center mb-6">
          <Ionicons name="images" size={40} color="#fff" />
        </View>

        <Text className="text-4xl font-bold text-slate-900 text-center">
          Vacay
        </Text>
        <Text className="text-lg text-slate-500 text-center mt-2 max-w-xs">
          Share your vacation memories with friends and family
        </Text>

        {/* Features */}
        <View className="mt-12 gap-4 w-full max-w-xs">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Ionicons name="cloud-upload" size={20} color="#0d9488" />
            </View>
            <Text className="flex-1 text-slate-700">Upload photos and videos</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Ionicons name="people" size={20} color="#0d9488" />
            </View>
            <Text className="flex-1 text-slate-700">Collaborate with friends</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Ionicons name="share-social" size={20} color="#0d9488" />
            </View>
            <Text className="flex-1 text-slate-700">Share albums publicly</Text>
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <View className="px-6 pb-12 gap-3">
        <Button onPress={signInWithGoogle} size="lg">
          <View className="flex-row items-center gap-2">
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text className="text-white font-semibold text-lg">
              Continue with Google
            </Text>
          </View>
        </Button>
        <Text className="text-center text-sm text-slate-400 mt-2">
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </View>
  )
}
