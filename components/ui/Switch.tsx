import { Switch as RNSwitch, View, Text } from 'react-native'
import { cn } from '@/lib/utils'

interface SwitchProps {
  value: boolean
  onValueChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function Switch({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <View className={cn('flex-row items-center justify-between', className)}>
      {(label || description) && (
        <View className="flex-1 mr-3">
          {label && (
            <Text className="text-base font-medium text-slate-900">{label}</Text>
          )}
          {description && (
            <Text className="text-sm text-slate-500 mt-0.5">{description}</Text>
          )}
        </View>
      )}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#cbd5e1', true: '#5eead4' }}
        thumbColor={value ? '#0d9488' : '#f1f5f9'}
        ios_backgroundColor="#cbd5e1"
      />
    </View>
  )
}
