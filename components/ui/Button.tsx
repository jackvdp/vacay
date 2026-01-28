import { Pressable, Text, ActivityIndicator, View } from 'react-native'
import { cn } from '@/lib/utils'

interface ButtonProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  textClassName?: string
  icon?: React.ReactNode
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  textClassName,
  icon,
}: ButtonProps) {
  const baseClasses = 'flex-row items-center justify-center rounded-xl'

  const variantClasses = {
    primary: 'bg-primary-600 active:bg-primary-700',
    secondary: 'bg-slate-200 active:bg-slate-300',
    outline: 'border-2 border-primary-600 bg-transparent active:bg-primary-50',
    ghost: 'bg-transparent active:bg-slate-100',
    danger: 'bg-red-500 active:bg-red-600',
  }

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-slate-900',
    outline: 'text-primary-600',
    ghost: 'text-slate-700',
    danger: 'text-white',
  }

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const disabledClasses = disabled || loading ? 'opacity-50' : ''

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className
      )}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : '#0d9488'}
          size="small"
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            className={cn(
              'font-semibold',
              textVariantClasses[variant],
              textSizeClasses[size],
              textClassName
            )}
          >
            {children}
          </Text>
        </>
      )}
    </Pressable>
  )
}
