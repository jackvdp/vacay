"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Camera, ArrowLeft, Share2, Upload, Users, Globe, Lock, UserPlus } from "lucide-react"
import Navbar from "@/components/navbar"
import { getAlbumById } from "@/lib/albums"
import { getAlbumMedia } from "@/lib/media"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import type { Album, Media } from "@/types/album"
import { PhotoUpload } from "@/components/albums/photo-upload"
import { EditableAlbumTitle } from "@/components/albums/editable-album-title"
import { SimpleMemberModal} from "@/components/albums/member-management-modal";
import { toast } from "sonner"

export default function AlbumPage() {
    const params = useParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [album, setAlbum] = useState<Album | null>(null)
    const [media, setMedia] = useState<Media[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showUpload, setShowUpload] = useState(false)
    const [showMemberModal, setShowMemberModal] = useState(false)
    const [collaboratorCount, setCollaboratorCount] = useState(0)

    const albumId = params.id as string

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/")
            return
        }

        if (user && albumId) {
            loadAlbumData()
            loadCollaboratorCount()
        }
    }, [user, authLoading, albumId])

    const loadAlbumData = async () => {
        setLoading(true)
        setError(null)

        try {
            const [albumResult, mediaResult] = await Promise.all([
                getAlbumById(albumId),
                getAlbumMedia(albumId)
            ])

            if (albumResult.error) {
                console.error("Error loading album:", albumResult.error)
                setError("Failed to load album")
                toast.error("Failed to load album")
                return
            }

            if (!albumResult.album) {
                setError("Album not found")
                toast.error("Album not found")
                return
            }

            setAlbum(albumResult.album)
            setMedia(mediaResult.media || [])
        } catch (err) {
            console.error("Error loading album:", err)
            setError("Something went wrong")
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const loadCollaboratorCount = async () => {
        try {
            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.access_token) {
                return
            }

            const response = await fetch(`/api/albums/${albumId}/members`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            if (response.ok) {
                const result = await response.json()
                // Count all collaborators (including creator)
                const totalCollaborators = result.members?.length || 0
                setCollaboratorCount(totalCollaborators)
            }
        } catch (error) {
            console.error("Error loading collaborator count:", error)
        }
    }

    const handleUploadComplete = () => {
        loadAlbumData() // Refresh album data
        setShowUpload(false) // Hide upload component
    }

    const handleAlbumUpdate = (updatedAlbum: Album) => {
        setAlbum(updatedAlbum)
    }

    const handleCollaboratorUpdate = () => {
        loadCollaboratorCount() // Refresh collaborator count when collaborators change
    }

    const handleShare = async () => {
        if (!album) return

        const shareUrl = `${window.location.origin}/share/${album.share_id}`

        try {
            await navigator.clipboard.writeText(shareUrl)
            toast.success("Share link copied to clipboard! 📋")
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea")
            textArea.value = shareUrl
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand("copy")
            document.body.removeChild(textArea)
            toast.success("Share link copied to clipboard! 📋")
        }
    }

    const isCreator = album && user && album.creator_id === user.id

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
                <Navbar />
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
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Camera className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {error || "Album not found"}
                        </h3>
                        <p className="text-slate-600 mb-6">
                            The album you're looking for doesn't exist or you don't have access to it.
                        </p>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
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
                <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/dashboard")}
                                className="text-slate-600 hover:text-slate-900"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>

                            <div>
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                        <Camera className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        {isCreator ? (
                                            <EditableAlbumTitle
                                                album={album}
                                                onUpdate={handleAlbumUpdate}
                                            />
                                        ) : (
                                            <h1 className="text-2xl font-bold text-slate-900">{album.title}</h1>
                                        )}
                                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                                            <span className="flex items-center">
                                                {album.is_public ? (
                                                    <>
                                                        <Globe className="h-4 w-4 mr-1" />
                                                        Public
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="h-4 w-4 mr-1" />
                                                        Private
                                                    </>
                                                )}
                                            </span>
                                            <span>Created {new Date(album.created_at).toLocaleDateString()}</span>
                                            {isCreator && (
                                                <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
                                                    Owner
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {album.description && (
                                    <p className="text-slate-600 max-w-2xl ml-15">
                                        {album.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Collaborators Button */}
                            <Button
                                onClick={() => setShowMemberModal(true)}
                                variant="outline"
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                {collaboratorCount} Collaborator{collaboratorCount !== 1 ? 's' : ''}
                            </Button>

                            {/* Add Collaborator Button - Only for creators */}
                            {isCreator && (
                                <Button
                                    onClick={() => setShowMemberModal(true)}
                                    variant="outline"
                                    className="border-teal-200 text-teal-600 hover:bg-teal-50"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Collaborator
                                </Button>
                            )}

                            <Button
                                onClick={handleShare}
                                variant="outline"
                                className="border-teal-200 text-teal-600 hover:bg-teal-50"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>

                            <Button
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                                onClick={() => setShowUpload(true)}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Photos
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Album Content */}
            <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
                {/* Album Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Camera className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Total Photos</p>
                                <p className="text-2xl font-bold text-slate-900">{media.length}</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setShowMemberModal(true)}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Collaborators</p>
                                <p className="text-2xl font-bold text-slate-900">{collaboratorCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Share2 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Share Link</p>
                                <p className="text-xs text-slate-500 font-mono">
                                    vacay.app/share/{album.share_id}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Photos Grid */}
                {showUpload ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Upload Photos</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUpload(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                        <PhotoUpload albumId={albumId} onUploadComplete={handleUploadComplete} />
                    </div>
                ) : media.length > 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Photos ({media.length})</h3>
                            <Button
                                onClick={() => setShowUpload(true)}
                                size="sm"
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Add More
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {media.map((item) => (
                                <div key={item.id} className="aspect-square bg-slate-100 rounded-lg overflow-hidden group cursor-pointer">
                                    {item.mime_type.startsWith('image/') ? (
                                        <img
                                            src={item.blob_url}
                                            alt={item.original_name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-12">
                        <div className="text-center max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No photos yet</h3>
                            <p className="text-slate-600 mb-6">
                                Start uploading photos to bring this album to life! You can drag and drop multiple photos at once.
                            </p>
                            <Button
                                onClick={() => setShowUpload(true)}
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Your First Photos
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* Member Management Modal */}
            <SimpleMemberModal
                open={showMemberModal}
                onOpenChange={setShowMemberModal}
                albumId={albumId}
                isCreator={isCreator || false}
                onMemberUpdate={handleCollaboratorUpdate}
            />
        </div>
    )
}