"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Image as ImageIcon, Video, FileText, Check, AlertCircle } from "lucide-react"
import { uploadMedia, isValidFileType, formatFileSize, type UploadProgress } from "@/lib/media"
import { toast } from "sonner"

interface PhotoUploadProps {
    albumId: string
    onUploadComplete?: () => void
}

export function PhotoUpload({ albumId, onUploadComplete }: PhotoUploadProps) {
    const [uploads, setUploads] = useState<UploadProgress[]>([])
    const [isUploading, setIsUploading] = useState(false)

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

        // Upload files one by one
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i]

            try {
                // Update progress to show uploading
                setUploads(prev => prev.map((upload, index) =>
                    index === i ? { ...upload, progress: 10, status: 'uploading' } : upload
                ))

                const { media, error } = await uploadMedia({
                    albumId,
                    file
                })

                if (error) {
                    setUploads(prev => prev.map((upload, index) =>
                        index === i ? {
                            ...upload,
                            progress: 0,
                            status: 'error',
                            error: error.message || 'Upload failed'
                        } : upload
                    ))
                    toast.error(`Failed to upload ${file.name}`)
                } else {
                    setUploads(prev => prev.map((upload, index) =>
                        index === i ? { ...upload, progress: 100, status: 'complete' } : upload
                    ))
                    toast.success(`${file.name} uploaded successfully!`)
                }
            } catch (err) {
                setUploads(prev => prev.map((upload, index) =>
                    index === i ? {
                        ...upload,
                        progress: 0,
                        status: 'error',
                        error: 'Upload failed'
                    } : upload
                ))
                toast.error(`Failed to upload ${file.name}`)
            }
        }

        setIsUploading(false)

        // Clear uploads after a delay
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
                                        <Progress
                                            value={upload.progress}
                                            className="h-2"
                                        />
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