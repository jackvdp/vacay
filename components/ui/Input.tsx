import { TextInput, View, Text } from 'react-native'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps {
  value?: string
  onChangeText?: (text: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  multiline?: boolean
  numberOfLines?: number
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoCorrect?: boolean
  className?: string
  inputClassName?: string
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    value,
    onChangeText,
    placeholder,
    label,
    error,
    disabled = false,
    multiline = false,
    numberOfLines = 1,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    autoCorrect = true,
    className,
    inputClassName,
  },
  ref
) {
  return (
    <View className={cn('w-full', className)}>
      {label && (
        <Text className="text-sm font-medium text-slate-700 mb-1.5">{label}</Text>
      )}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        editable={!disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        className={cn(
          'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900',
          multiline && 'min-h-[100px] py-3',
          disabled && 'opacity-50',
          error && 'border-red-500',
          inputClassName
        )}
        style={{ textAlignVertical: multiline ? 'top' : 'center' }}
      />
      {error && <Text className="text-sm text-red-500 mt-1">{error}</Text>}
    </View>
  )
})
