import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

export function getValidMimeTypes(): string[] {
  return [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/mov',
    'video/quicktime',
    'video/avi',
  ]
}

export function isValidMimeType(mimeType: string): boolean {
  return getValidMimeTypes().includes(mimeType)
}
