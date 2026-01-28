import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Users,
    Mail,
    UserPlus,
    UserMinus,
    Crown,
    Check,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

// Simplified types
interface AlbumMember {
    id: string
    album_id: string
    allowed_email: string
    role: 'admin' | 'member'
    added_at: string
}

interface SimpleMemberModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    albumId: string
    isCreator: boolean
    onMemberUpdate?: () => void
}

export function SimpleMemberModal({
                                      open,
                                      onOpenChange,
                                      albumId,
                                      isCreator,
                                      onMemberUpdate
                                  }: SimpleMemberModalProps) {
    const [members, setMembers] = useState<AlbumMember[]>([])
    const [loading, setLoading] = useState(false)
    const [addEmail, setAddEmail] = useState("")
    const [addLoading, setAddLoading] = useState(false)

    useEffect(() => {
        if (open) {
            loadMembers()
        }
    }, [open, albumId])

    const loadMembers = async () => {
        setLoading(true)
        try {
            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.access_token) {
                toast.error("Authentication required")
                return
            }

            const response = await fetch(`/api/albums/${albumId}/members`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            const result = await response.json()

            if (response.ok) {
                setMembers(result.members || [])
            } else {
                toast.error(result.error || "Failed to load collaborators")
            }
        } catch (error) {
            console.error("Error loading collaborators:", error)
            toast.error("Error loading collaborators")
        } finally {
            setLoading(false)
        }
    }

    const handleAddCollaborator = async (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault()

        if (!addEmail.trim()) {
            toast.error("Please enter an email address")
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(addEmail)) {
            toast.error("Please enter a valid email address")
            return
        }

        setAddLoading(true)
        try {
            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.access_token) {
                toast.error("Authentication required")
                return
            }

            const response = await fetch(`/api/albums/${albumId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ email: addEmail })
            })

            const result = await response.json()

            if (response.ok) {
                toast.success(`${addEmail} can now collaborate on this album!`)
                setAddEmail("")
                loadMembers()
                onMemberUpdate?.()
            } else {
                toast.error(result.error || "Failed to add collaborator")
            }
        } catch (error) {
            console.error("Error adding collaborator:", error)
            toast.error("Error adding collaborator")
        } finally {
            setAddLoading(false)
        }
    }

    const handleRemoveCollaborator = async (memberId: string, email: string) => {
        if (!isCreator) return

        try {
            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.access_token) {
                toast.error("Authentication required")
                return
            }

            const response = await fetch(`/api/albums/${albumId}/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (response.ok) {
                toast.success(`Removed ${email} from album`)
                loadMembers()
                onMemberUpdate?.()
            } else {
                const result = await response.json()
                toast.error(result.error || "Failed to remove collaborator")
            }
        } catch (error) {
            console.error("Error removing collaborator:", error)
            toast.error("Error removing collaborator")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Album Collaborators</DialogTitle>
                            <p className="text-sm text-slate-600">
                                {members.length} collaborator{members.length !== 1 ? 's' : ''} can upload to this album
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col space-y-6">
                    {/* Add Collaborator Form - Only show to creators */}
                    {isCreator && (
                        <div className="space-y-3">
                            <Label htmlFor="add-email">Add Collaborator by Email</Label>
                            <div className="flex space-x-2">
                                <div className="flex-1 relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="add-email"
                                        type="email"
                                        placeholder="friend@example.com"
                                        value={addEmail}
                                        onChange={(e) => setAddEmail(e.target.value)}
                                        disabled={addLoading}
                                        className="pl-10"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddCollaborator(e)
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    onClick={handleAddCollaborator}
                                    disabled={addLoading || !addEmail.trim()}
                                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                                >
                                    {addLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <UserPlus className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                                Anyone who signs in with this email can upload photos to your album.
                            </p>
                        </div>
                    )}

                    {/* Collaborators List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">
                                                    {member.allowed_email?.charAt(0)?.toUpperCase() || '?'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{member.allowed_email}</p>
                                                <p className="text-sm text-slate-600">
                                                    Added {new Date(member.added_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {/* Role Badge */}
                                            {member.role === 'admin' ? (
                                                <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                                    <Crown className="h-3 w-3" />
                                                    <span>Creator</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-1 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                                                    <Check className="h-3 w-3" />
                                                    <span>Collaborator</span>
                                                </div>
                                            )}

                                            {/* Remove Button - Only for creators, and can't remove themselves */}
                                            {isCreator && member.role !== 'admin' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveCollaborator(member.id, member.allowed_email)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {members.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                        <p>No collaborators yet</p>
                                        {isCreator && (
                                            <p className="text-sm">Add someone's email to let them upload photos!</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}