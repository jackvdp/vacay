"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Image as ImageIcon, Video, FileText, Check, AlertCircle } from "lucide-react"
import { upload } from '@vercel/blob/client'
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface PhotoUploadProps {
    albumId: string
    onUploadComplete?: () => void
}

interface UploadProgress {
    fileName: string
    progress: number
    status: 'uploading' | 'processing' | 'complete' | 'error'
    error?: string
}

export function PhotoUpload({ albumId, onUploadComplete }: PhotoUploadProps) {
    const [uploads, setUploads] = useState<UploadProgress[]>([])
    const [isUploading, setIsUploading] = useState(false)

    // Helper function to validate file types
    const isValidFileType = (file: File): boolean => {
        const fileName = file.name.toLowerCase()
        const mimeType = file.type

        const validTypes = [
            { mime: 'image/jpeg', extensions: ['.jpg', '.jpeg'] },
            { mime: 'image/png', extensions: ['.png'] },
            { mime: 'image/webp', extensions: ['.webp'] },
            { mime: 'image/gif', extensions: ['.gif'] },
            { mime: 'video/mp4', extensions: ['.mp4'] },
            { mime: 'video/mov', extensions: ['.mov'] },
            { mime: 'video/quicktime', extensions: ['.mov'] },
            { mime: 'video/avi', extensions: ['.avi'] }
        ]

        // Check by MIME type
        if (validTypes.some(type => type.mime === mimeType)) {
            return true
        }

        // Check by extension (for cases where MIME type is generic)
        return validTypes.some(type =>
            type.extensions.some(ext => fileName.endsWith(ext))
        )
    }

    // Get corrected MIME type based on file extension
    const getCorrectMimeType = (file: File): string => {
        const fileName = file.name.toLowerCase()
        const originalMimeType = file.type

        const typeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.mp4': 'video/mp4',
            '.mov': 'video/mov',
            '.avi': 'video/avi'
        }

        // If original MIME type is valid, use it
        if (originalMimeType && originalMimeType !== 'application/octet-stream') {
            return originalMimeType
        }

        // Otherwise, determine from extension
        for (const [ext, mime] of Object.entries(typeMap)) {
            if (fileName.endsWith(ext)) {
                return mime
            }
        }

        return originalMimeType || 'application/octet-stream'
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return

        // Validate files
        const validFiles = acceptedFiles.filter(file => {
            if (!isValidFileType(file)) {
                toast.error(`${file.name} is not a supported file type`)
                return false
            }
            if (file.size > 200 * 1024 * 1024) { // 200MB limit
                toast.error(`${file.name} is too large (max 200MB)`)
                return false
            }
            return true
        })

        if (!validFiles.length) return

        setIsUploading(true)

        // Initialize upload progress
        const initialUploads: UploadProgress[] = validFiles.map(file => ({
            fileName: file.name,
            progress: 0,
            status: 'uploading'
        }))
        setUploads(initialUploads)

        // Upload files concurrently (but limit concurrency to avoid overwhelming)
        const uploadPromises = validFiles.map(async (file, index) => {
            try {
                // Update progress to show uploading started
                setUploads(prev => prev.map((upload, i) =>
                    i === index ? { ...upload, progress: 10, status: 'uploading' } : upload
                ))

                // Generate unique filename
                const timestamp = Date.now()
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                const filename = `albums/${albumId}/${timestamp}_${sanitizedName}`

                console.log(`Starting direct upload for ${file.name}`)

                // Get user session for authentication
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.access_token) {
                    throw new Error('Not authenticated')
                }

                // Direct upload to Vercel Blob using client upload
                const blob = await upload(filename, file, {
                    access: 'public',
                    handleUploadUrl: `/api/albums/${albumId}/upload-token`,
                    clientPayload: JSON.stringify({
                        userToken: session.access_token,
                        albumId: albumId
                    })
                })

                console.log(`Direct upload completed for ${file.name}:`, blob.url)

                // Update progress to show blob upload complete
                setUploads(prev => prev.map((upload, i) =>
                    i === index ? { ...upload, progress: 80, status: 'processing' } : upload
                ))

                // Now save metadata to database
                const mediaData = {
                    album_id: albumId,
                    filename: filename,
                    original_name: file.name,
                    mime_type: getCorrectMimeType(file),
                    size_bytes: file.size,
                    blob_url: blob.url,
                }

                const metadataResponse = await fetch(`/api/albums/${albumId}/metadata`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mediaData)
                })

                if (!metadataResponse.ok) {
                    const errorResult = await metadataResponse.json()
                    throw new Error(errorResult.error || 'Failed to save metadata')
                }

                // Mark as complete
                setUploads(prev => prev.map((upload, i) =>
                    i === index ? { ...upload, progress: 100, status: 'complete' } : upload
                ))

                toast.success(`${file.name} uploaded successfully!`)
                return true

            } catch (error: any) {
                console.error(`Upload failed for ${file.name}:`, error)
                setUploads(prev => prev.map((upload, i) =>
                    i === index ? {
                        ...upload,
                        progress: 0,
                        status: 'error',
                        error: error.message || 'Upload failed'
                    } : upload
                ))
                toast.error(`Failed to upload ${file.name}: ${error.message}`)
                return false
            }
        })

        // Wait for all uploads to complete
        await Promise.all(uploadPromises)

        setIsUploading(false)

        // Clear uploads after a delay and refresh parent
        setTimeout(() => {
            setUploads([])
            onUploadComplete?.()
        }, 2000)

    }, [albumId, onUploadComplete])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            'video/*': ['.mp4', '.mov', '.avi']
        },
        multiple: true,
        disabled: isUploading
    })

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '')) {
            return <ImageIcon className="h-4 w-4" />
        }
        if (['mp4', 'mov', 'avi'].includes(extension || '')) {
            return <Video className="h-4 w-4" />
        }
        return <FileText className="h-4 w-4" />
    }

    const getStatusIcon = (status: UploadProgress['status']) => {
        switch (status) {
            case 'complete':
                return <Check className="h-4 w-4 text-green-600" />
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-600" />
            default:
                return null
        }
    }

    return (
        <div className="space-y-6">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'
                }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
            >
                <input {...getInputProps()} />

                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                    <Upload className="h-8 w-8 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {isDragActive ? 'Drop files here' : 'Upload photos and videos'}
                </h3>

                <p className="text-slate-600 mb-6">
                    Drag and drop your files here, or click to browse
                </p>

                <Button
                    type="button"
                    disabled={isUploading}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                >
                    Choose Files
                </Button>

                <p className="text-xs text-slate-500 mt-4">
                    Supports JPG, PNG, WebP, GIF, MP4, MOV • Max 200MB per file
                </p>
            </div>

            {/* Upload Progress */}
            {uploads.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h4 className="font-semibold text-slate-900 mb-4">
                        Uploading {uploads.length} file{uploads.length > 1 ? 's' : ''}
                    </h4>

                    <div className="space-y-3">
                        {uploads.map((upload, index) => (
                            <div key={index} className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    {getFileIcon(upload.fileName)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {upload.fileName}
                                        </p>
                                        {getStatusIcon(upload.status)}
                                    </div>

                                    {upload.status === 'error' ? (
                                        <p className="text-xs text-red-600">{upload.error}</p>
                                    ) : (
                                        <div className="space-y-1">
                                            <Progress
                                                value={upload.progress}
                                                className="h-2"
                                            />
                                            <p className="text-xs text-slate-500">
                                                {upload.status === 'uploading' ? 'Uploading...' :
                                                    upload.status === 'processing' ? 'Saving...' :
                                                        upload.status === 'complete' ? 'Complete!' : ''}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}