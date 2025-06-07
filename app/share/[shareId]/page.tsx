"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Camera, Calendar, Globe, Share2, ArrowLeft, Download } from "lucide-react"
import { toast } from "sonner"

// Types for public album
interface PublicAlbum {
    id: string
    title: string
    description?: string
    is_public: boolean
    created_at: string
    share_id: string
}

interface PublicMedia {
    id: string
    album_id: string
    filename: string
    original_name: string
    mime_type: string
    size_bytes: number
    blob_url: string
    width?: number
    height?: number
    uploaded_at: string
}

export default function PublicAlbumPage() {
    const params = useParams()
    const [album, setAlbum] = useState<PublicAlbum | null>(null)
    const [media, setMedia] = useState<PublicMedia[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState<PublicMedia | null>(null)

    const shareId = params.shareId as string

    useEffect(() => {
        if (shareId) {
            loadPublicAlbumData()
        }
    }, [shareId])

    const loadPublicAlbumData = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/share/${shareId}`)
            const result = await response.json()

            if (!response.ok) {
                setError(result.error || "Failed to load album")
                return
            }

            setAlbum(result.album)
            setMedia(result.media || [])
        } catch (err) {
            console.error("Error loading public album:", err)
            setError("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const handleShare = async () => {
        try {
            const shareUrl = window.location.href
            await navigator.clipboard.writeText(shareUrl)
            toast.success("Album link copied to clipboard! 📋")
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea")
            textArea.value = window.location.href
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand("copy")
            document.body.removeChild(textArea)
            toast.success("Album link copied to clipboard! 📋")
        }
    }

    const handleImageClick = (mediaItem: PublicMedia) => {
        setSelectedImage(mediaItem)
    }

    const closeImageModal = () => {
        setSelectedImage(null)
    }

    const downloadImage = async (mediaItem: PublicMedia) => {
        try {
            const response = await fetch(mediaItem.blob_url)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = mediaItem.original_name
            document.body.appendChild(link)
            link.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)
            toast.success("Download started!")
        } catch (error) {
            console.error("Download failed:", error)
            toast.error("Download failed")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
                {/* Simple Header */}
                <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/20">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                    <Camera className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                    Vacay
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
                            <Camera className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-slate-600">Loading album...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !album) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
                {/* Simple Header */}
                <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/20">
                    <div className="max-w-6xl mx-auto px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                    <Camera className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                    Vacay
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Camera className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {error || "Album not found"}
                        </h3>
                        <p className="text-slate-600 mb-6">
                            This album doesn't exist or is no longer available.
                        </p>
                        <Button
                            onClick={() => window.location.href = '/'}
                            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go to Vacay
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
            {/* Simple Header */}
            <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/20">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <Camera className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                Vacay
                            </h1>
                        </div>

                        <Button
                            onClick={handleShare}
                            variant="outline"
                            size="sm"
                            className="border-teal-200 text-teal-600 hover:bg-teal-50"
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            {/* Album Header */}
            <div className="bg-white border-b border-slate-200/50">
                <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            {album.title}
                        </h1>

                        {album.description && (
                            <p className="text-xl text-slate-600 mb-6">
                                {album.description}
                            </p>
                        )}

                        <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
                            <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4" />
                                <span>Public Album</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Created {new Date(album.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Camera className="h-4 w-4" />
                                <span>{media.length} photo{media.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photos Grid */}
            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {media.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {media.map((item) => (
                            <div
                                key={item.id}
                                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300"
                                onClick={() => handleImageClick(item)}
                            >
                                {item.mime_type.startsWith('image/') ? (
                                    <img
                                        src={item.blob_url}
                                        alt={item.original_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                        <div className="text-center">
                                            <video className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                                            <p className="text-xs text-slate-500">Video</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Camera className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No photos yet</h3>
                        <p className="text-slate-600 max-w-md mx-auto">
                            This album is empty. Photos will appear here when they're uploaded.
                        </p>
                    </div>
                )}
            </main>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={closeImageModal}
                >
                    <div className="relative max-w-5xl max-h-full">
                        <img
                            src={selectedImage.blob_url}
                            alt={selectedImage.original_name}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Modal Controls */}
                        <div className="absolute top-4 right-4 flex space-x-2">
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    downloadImage(selectedImage)
                                }}
                                size="sm"
                                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={closeImageModal}
                                size="sm"
                                variant="outline"
                                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                            >
                                ✕
                            </Button>
                        </div>

                        {/* Image Info */}
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-black/50 rounded-lg p-4 text-white">
                                <h4 className="font-medium">{selectedImage.original_name}</h4>
                                <p className="text-sm text-white/70">
                                    Uploaded {new Date(selectedImage.uploaded_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}