"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Camera, ArrowLeft, Share2, Upload, Users, Globe, Lock } from "lucide-react"
import Navbar from "@/components/navbar";
import { getAlbumById } from "@/lib/albums"
import { useAuth } from "@/lib/auth-context"
import type { Album } from "@/types/album"
import { toast } from "sonner"

export default function AlbumPage() {
    const params = useParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [album, setAlbum] = useState<Album | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const albumId = params.id as string

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/")
            return
        }

        if (user && albumId) {
            loadAlbum()
        }
    }, [user, authLoading, albumId])

    const loadAlbum = async () => {
        setLoading(true)
        setError(null)

        try {
            const { album: albumData, error: albumError } = await getAlbumById(albumId)

            if (albumError) {
                console.error("Error loading album:", albumError)
                setError("Failed to load album")
                toast.error("Failed to load album")
                return
            }

            if (!albumData) {
                setError("Album not found")
                toast.error("Album not found")
                return
            }

            setAlbum(albumData)
        } catch (err) {
            console.error("Error loading album:", err)
            setError("Something went wrong")
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
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
                                        <h1 className="text-2xl font-bold text-slate-900">{album.title}</h1>
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
                            <Button
                                onClick={handleShare}
                                variant="outline"
                                className="border-teal-200 text-teal-600 hover:bg-teal-50"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>

                            <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
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
                                <p className="text-2xl font-bold text-slate-900">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Contributors</p>
                                <p className="text-2xl font-bold text-slate-900">1</p>
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

                {/* Photos Grid - Empty State */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-12">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No photos yet</h3>
                        <p className="text-slate-600 mb-6">
                            Start uploading photos to bring this album to life! You can drag and drop multiple photos at once.
                        </p>
                        <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Your First Photos
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}