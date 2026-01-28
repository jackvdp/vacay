import { Modal as RNModal, View, Text, Pressable, Platform, KeyboardAvoidingView } from 'react-native'
import { cn } from '@/lib/utils'
import { Ionicons } from '@expo/vector-icons'

interface ModalProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ visible, onClose, title, children, className }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable
          onPress={onClose}
          className="flex-1 bg-black/50 justify-center items-center p-4"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className={cn(
              'w-full max-w-md bg-white rounded-2xl overflow-hidden',
              className
            )}
          >
            {title && (
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
                <Text className="text-lg font-semibold text-slate-900">{title}</Text>
                <Pressable
                  onPress={onClose}
                  className="w-8 h-8 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </Pressable>
              </View>
            )}
            <View className="p-5">{children}</View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  )
}
