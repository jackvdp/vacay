"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit3, Check, X } from "lucide-react"
import { updateAlbum } from "@/lib/albums"
import { toast } from "sonner"
import type { Album } from "@/types/album"

interface EditableAlbumTitleProps {
    album: Album
    onUpdate: (updatedAlbum: Album) => void
}

export function EditableAlbumTitle({ album, onUpdate }: EditableAlbumTitleProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(album.title)
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Album title cannot be empty")
            return
        }

        if (title.trim() === album.title) {
            setIsEditing(false)
            return
        }

        setIsLoading(true)

        try {
            const { album: updatedAlbum, error } = await updateAlbum(album.id, {
                title: title.trim()
            })

            if (error) {
                console.error("Error updating album:", error)
                toast.error("Failed to update album title")
                setTitle(album.title) // Reset to original
            } else if (updatedAlbum) {
                toast.success("Album title updated!")
                onUpdate(updatedAlbum)
                setIsEditing(false)
            }
        } catch (error) {
            console.error("Error updating album:", error)
            toast.error("Something went wrong")
            setTitle(album.title) // Reset to original
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setTitle(album.title)
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave()
        } else if (e.key === "Escape") {
            handleCancel()
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center space-x-2">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="text-2xl font-bold border-teal-200 focus:border-teal-500"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                />
                <Button
                    onClick={handleSave}
                    disabled={isLoading || !title.trim()}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    onClick={handleCancel}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center space-x-2 group">
            <h1 className="text-2xl font-bold text-slate-900">{album.title}</h1>
            <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-700"
            >
                <Edit3 className="h-4 w-4" />
            </Button>
        </div>
    )
}