"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Camera, Calendar, Globe, Share2, ArrowLeft, Download, Plus, Smartphone, Monitor, Video } from "lucide-react"
import { toast } from "sonner"
import Navbar from "@/components/navbar"

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
    const [selectedMedia, setSelectedMedia] = useState<PublicMedia | null>(null)
    const [isSavingToLibrary, setIsSavingToLibrary] = useState(false)
    const [savedCount, setSavedCount] = useState(0)

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

    const handleMediaClick = (mediaItem: PublicMedia) => {
        setSelectedMedia(mediaItem)
    }

    const closeMediaModal = () => {
        setSelectedMedia(null)
    }

    const detectDevice = () => {
        const userAgent = navigator.userAgent.toLowerCase()
        const isIOS = /iphone|ipad|ipod/.test(userAgent)
        const isAndroid = /android/.test(userAgent)
        const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
        const isMobile = isIOS || isAndroid

        return { isIOS, isAndroid, isSafari, isMobile }
    }

    // Convert blob URL to data URL for better mobile compatibility
    const convertToDataURL = async (blobUrl: string): Promise<string> => {
        const response = await fetch(blobUrl)
        const blob = await response.blob()

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    }

    // Save individual media (image or video) with native mobile integration
    const saveMediaToDevice = async (mediaItem: PublicMedia, index: number, total: number): Promise<boolean> => {
        const { isIOS, isAndroid, isSafari } = detectDevice()
        const isImage = mediaItem.mime_type.startsWith('image/')
        const isVideo = mediaItem.mime_type.startsWith('video/')

        try {
            if (isImage && isIOS && isSafari) {
                // For iOS Safari images, try the native save approach
                return await saveImageIOS(mediaItem, index, total)
            } else {
                // For all other cases (Android, desktop, videos), use generic download
                return await saveMediaGeneric(mediaItem, index, total)
            }
        } catch (error) {
            console.error(`Failed to save media ${index + 1}:`, error)
            return false
        }
    }

    const saveImageIOS = async (mediaItem: PublicMedia, index: number, total: number): Promise<boolean> => {
        try {
            // Convert to data URL for better iOS compatibility
            const dataUrl = await convertToDataURL(mediaItem.blob_url)

            // Create a temporary image element
            const img = new Image()
            img.src = dataUrl

            await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
            })

            // Create a canvas to ensure proper format
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            ctx.drawImage(img, 0, 0)

            // Convert to blob
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
            })

            // Try to use the native share API for iOS
            if (navigator.share && navigator.canShare) {
                const file = new File([blob], `${album?.title}_${index + 1}.jpg`, { type: 'image/jpeg' })

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Photo ${index + 1} from ${album?.title}`
                    })
                    return true
                }
            }

            // Fallback: trigger download
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${album?.title}_${String(index + 1).padStart(2, '0')}.jpg`

            // For iOS, we need to open in new tab for save option
            link.target = '_blank'
            link.rel = 'noopener'

            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                URL.revokeObjectURL(url)
                document.body.removeChild(link)
            }, 100)

            return true

        } catch (error) {
            console.error('iOS save failed:', error)
            return false
        }
    }

    const saveMediaGeneric = async (mediaItem: PublicMedia, index: number, total: number): Promise<boolean> => {
        try {
            const response = await fetch(mediaItem.blob_url)
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            // Get file extension from original name or mime type
            let extension = ''
            if (mediaItem.mime_type.startsWith('image/')) {
                extension = mediaItem.mime_type === 'image/jpeg' ? '.jpg' :
                    mediaItem.mime_type === 'image/png' ? '.png' :
                        mediaItem.mime_type === 'image/webp' ? '.webp' :
                            mediaItem.mime_type === 'image/gif' ? '.gif' : '.jpg'
            } else if (mediaItem.mime_type.startsWith('video/')) {
                extension = mediaItem.mime_type === 'video/mp4' ? '.mp4' :
                    mediaItem.mime_type === 'video/quicktime' || mediaItem.mime_type === 'video/mov' ? '.mov' :
                        mediaItem.mime_type === 'video/avi' ? '.avi' : '.mp4'
            }

            link.download = `${album?.title}_${String(index + 1).padStart(2, '0')}${extension}`

            document.body.appendChild(link)
            link.click()
            URL.revokeObjectURL(url)
            document.body.removeChild(link)
            return true
        } catch (error) {
            console.error('Generic save failed:', error)
            return false
        }
    }

    const saveAllMediaToLibrary = async () => {
        if (!album || !media.length) return

        const { isIOS, isAndroid, isMobile } = detectDevice()

        if (media.length === 0) {
            toast.error("No media to save")
            return
        }

        setIsSavingToLibrary(true)
        setSavedCount(0)

        // Show initial instruction based on device
        if (isIOS) {
            toast.info("💡 Tip: Photos will save to Photos app, videos will download", {
                duration: 5000
            })
        } else if (isAndroid) {
            toast.info("💡 Tip: Media will download to your device", {
                duration: 5000
            })
        } else {
            toast.info("💡 Tip: Media will download to your computer", {
                duration: 5000
            })
        }

        let successCount = 0
        const totalMedia = media.length

        for (let i = 0; i < totalMedia; i++) {
            const item = media[i]
            const mediaType = item.mime_type.startsWith('image/') ? 'photo' : 'video'

            // Update progress
            toast.loading(`Saving ${mediaType} ${i + 1} of ${totalMedia}...`, {
                id: 'save-progress'
            })

            const success = await saveMediaToDevice(item, i, totalMedia)

            if (success) {
                successCount++
                setSavedCount(successCount)
            }

            // Add delay between downloads to prevent overwhelming the browser
            if (i < totalMedia - 1) {
                await new Promise(resolve => setTimeout(resolve, isIOS ? 1500 : 800))
            }
        }

        // Final success message
        toast.success(`${successCount} of ${totalMedia} files processed!`, {
            id: 'save-progress'
        })

        // Device-specific follow-up instructions
        setTimeout(() => {
            if (isIOS) {
                toast.success("📱 Photos in Photos app, videos in Files app!", {
                    duration: 6000
                })
            } else if (isAndroid) {
                toast.success("📱 Check your Downloads folder or Gallery app!", {
                    duration: 6000
                })
            } else {
                toast.success("💻 Files downloaded to your Downloads folder!", {
                    duration: 6000
                })
            }
        }, 1000)

        setIsSavingToLibrary(false)
    }

    const getSaveButtonText = () => {
        const { isIOS, isAndroid, isMobile } = detectDevice()
        const totalCount = media.length
        const imageCount = media.filter(item => item.mime_type.startsWith('image/')).length
        const videoCount = media.filter(item => item.mime_type.startsWith('video/')).length

        if (isSavingToLibrary) {
            return `Saving ${savedCount}/${totalCount}...`
        }

        if (isIOS) {
            return `Save ${totalCount} Files`
        } else if (isAndroid) {
            return `Download ${totalCount} Files`
        } else {
            return `Download Album (${totalCount} files)`
        }
    }

    const getSaveButtonIcon = () => {
        const { isMobile } = detectDevice()

        if (isSavingToLibrary) {
            return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        }

        return isMobile ? <Plus className="h-4 w-4" /> : <Download className="h-4 w-4" />
    }

    const getMediaCounts = () => {
        const imageCount = media.filter(item => item.mime_type.startsWith('image/')).length
        const videoCount = media.filter(item => item.mime_type.startsWith('video/')).length

        if (imageCount === 0 && videoCount === 0) return "0 files"
        if (imageCount > 0 && videoCount === 0) return `${imageCount} photo${imageCount !== 1 ? 's' : ''}`
        if (imageCount === 0 && videoCount > 0) return `${videoCount} video${videoCount !== 1 ? 's' : ''}`
        return `${imageCount} photo${imageCount !== 1 ? 's' : ''} & ${videoCount} video${videoCount !== 1 ? 's' : ''}`
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
            <Navbar />

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

                        <div className="flex items-center justify-center space-x-6 text-sm text-slate-500 mb-8">
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
                                <span>{getMediaCounts()}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center space-x-4">
                            <Button
                                onClick={handleShare}
                                variant="outline"
                                size="lg"
                                className="border-teal-200 text-teal-600 hover:bg-teal-50"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Album
                            </Button>

                            {media.length > 0 && (
                                <Button
                                    onClick={saveAllMediaToLibrary}
                                    disabled={isSavingToLibrary}
                                    size="lg"
                                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg"
                                >
                                    {getSaveButtonIcon()}
                                    <span className="ml-2">{getSaveButtonText()}</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Grid */}
            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {media.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {media.map((item) => (
                            <div
                                key={item.id}
                                className="aspect-square bg-slate-100 rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 relative"
                                onClick={() => handleMediaClick(item)}
                            >
                                {item.mime_type.startsWith('image/') ? (
                                    <img
                                        src={item.blob_url}
                                        alt={item.original_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 relative">
                                        <div className="text-center">
                                            <Video className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                                            <p className="text-xs text-slate-500 font-medium">Video</p>
                                        </div>
                                        {/* Video play indicator */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center">
                                                <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                                            </div>
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
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No media yet</h3>
                        <p className="text-slate-600 max-w-md mx-auto">
                            This album is empty. Photos and videos will appear here when they're uploaded.
                        </p>
                    </div>
                )}
            </main>

            {/* Media Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={closeMediaModal}
                >
                    <div className="relative max-w-5xl max-h-full">
                        {selectedMedia.mime_type.startsWith('image/') ? (
                            <img
                                src={selectedMedia.blob_url}
                                alt={selectedMedia.original_name}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <video
                                src={selectedMedia.blob_url}
                                controls
                                className="max-w-full max-h-full object-contain rounded-lg"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}

                        {/* Modal Controls */}
                        <div className="absolute top-4 right-4 flex space-x-2">
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    saveMediaToDevice(selectedMedia, 0, 1)
                                }}
                                size="sm"
                                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={closeMediaModal}
                                size="sm"
                                variant="outline"
                                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                            >
                                ✕
                            </Button>
                        </div>

                        {/* Media Info */}
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-black/50 rounded-lg p-4 text-white">
                                <h4 className="font-medium">{selectedMedia.original_name}</h4>
                                <p className="text-sm text-white/70">
                                    {selectedMedia.mime_type.startsWith('image/') ? 'Photo' : 'Video'} • Uploaded {new Date(selectedMedia.uploaded_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}