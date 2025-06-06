"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Plus } from "lucide-react"
import Navbar from "@/components/navbar";
import { CreateAlbumModal } from "@/components/albums/create-album-modal"
import { getUserAlbums } from "@/lib/albums"
import type { Album } from "@/types/album"

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [albums, setAlbums] = useState<Album[]>([])
    const [albumsLoading, setAlbumsLoading] = useState(true)

    useEffect(() => {
        if (!user && !loading) {
            router.push('/')
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user) {
            loadAlbums()
        }
    }, [user])

    const loadAlbums = async () => {
        setAlbumsLoading(true)
        try {
            const { albums: userAlbums, error } = await getUserAlbums()
            if (error) {
                console.error("Error loading albums:", error)
            } else {
                setAlbums(userAlbums || [])
            }
        } catch (error) {
            console.error("Error loading albums:", error)
        } finally {
            setAlbumsLoading(false)
        }
    }

    const handleAlbumCreated = () => {
        loadAlbums() // Refresh the albums list
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
                        <Camera className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
            {/* Header */}
            <Navbar />

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Your Albums
                        </h1>
                        <p className="text-slate-600">
                            Create and manage your travel photo collections
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Album
                    </Button>
                </div>

                {albumsLoading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
                            <Camera className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-slate-600">Loading albums...</p>
                    </div>
                ) : albums.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No albums yet</h3>
                            <p className="text-slate-600 mb-6">
                                Create your first album to start collecting and sharing travel memories.
                            </p>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Album
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {albums.map((album) => (
                            <div key={album.id} className="bg-white rounded-xl shadow-lg border border-slate-200/50 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                            <Camera className="h-6 w-6 text-white" />
                                        </div>
                                        {album.is_public && (
                                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                Public
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{album.title}</h3>
                                    {album.description && (
                                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{album.description}</p>
                                    )}
                                    <p className="text-xs text-slate-500">
                                        Created {new Date(album.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Album Modal */}
            <CreateAlbumModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onAlbumCreated={handleAlbumCreated}
            />
        </div>
    )
}