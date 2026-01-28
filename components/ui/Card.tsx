import { View, Pressable } from 'react-native'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onPress?: () => void
}

export function Card({ children, className, onPress }: CardProps) {
  const baseClasses = 'bg-white rounded-2xl p-4 shadow-sm border border-slate-100'

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn(baseClasses, 'active:scale-[0.98]', className)}
      >
        {children}
      </Pressable>
    )
  }

  return <View className={cn(baseClasses, className)}>{children}</View>
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn('mb-3', className)}>{children}</View>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn(className)}>{children}</View>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn('mt-3 pt-3 border-t border-slate-100', className)}>{children}</View>
}
