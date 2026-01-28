"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Camera, Loader2 } from "lucide-react"
import { createAlbum } from "@/lib/albums"
import { toast } from "sonner"

interface CreateAlbumModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAlbumCreated?: () => void
}

export function CreateAlbumModal({ open, onOpenChange, onAlbumCreated }: CreateAlbumModalProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [isPublic, setIsPublic] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast.error("Please enter an album title")
            return
        }

        setIsLoading(true)

        try {
            console.log('Submitting album creation...')

            const { album, error } = await createAlbum({
                title: title.trim(),
                description: description.trim() || undefined,
                is_public: isPublic
            })

            if (error) {
                console.error("Error creating album:", error)
                toast.error(`Failed to create album: ${error.message || 'Please try again.'}`)
                return
            }

            if (album) {
                console.log('Album created successfully:', album)
                toast.success("Album created successfully! 🎉")

                // Reset form
                setTitle("")
                setDescription("")
                setIsPublic(false)

                // Close modal
                onOpenChange(false)

                // Notify parent component
                onAlbumCreated?.()
            }
        } catch (error: any) {
            console.error("Error creating album:", error)
            toast.error(`Something went wrong: ${error.message || 'Please try again.'}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Create New Album</DialogTitle>
                            <DialogDescription className="text-slate-600">
                                Start collecting memories from your next adventure
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Album Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Tokyo Summer 2024"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isLoading}
                            className="text-base"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Tell us about this trip..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            rows={3}
                            className="text-base resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="space-y-1">
                            <Label htmlFor="public" className="text-sm font-medium">
                                Public Album
                            </Label>
                            <p className="text-xs text-slate-600">
                                Anyone with the link can view this album
                            </p>
                        </div>
                        <Switch
                            id="public"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !title.trim()}
                            className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Camera className="h-4 w-4 mr-2" />
                                    Create Album
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}