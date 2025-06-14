import { supabase } from './supabase'
import type { Album, CreateAlbumData } from '@/types/album'

export async function createAlbum(data: CreateAlbumData): Promise<{ album: Album | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { album: null, error: 'User not authenticated' }
        }

        console.log('Creating album with data:', data)
        console.log('User ID:', user.id)

        // Just create the album - no member management for now
        const { data: album, error } = await supabase
            .from('albums')
            .insert({
                title: data.title,
                description: data.description,
                is_public: data.is_public || false,
                creator_id: user.id
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error!:', error)
            return { album: null, error }
        }

        console.log('Album created successfully:', album)
        return { album, error: null }

    } catch (error) {
        console.error('Catch error:', error)
        return { album: null, error }
    }
}

// Updated getUserAlbums function for lib/albums.ts

export async function getUserAlbums(): Promise<{ albums: Album[] | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { albums: null, error: 'User not authenticated' }
        }

        console.log('Fetching albums for user:', user.email)

        // Get albums where user is the creator
        const { data: createdAlbums, error: createdError } = await supabase
            .from('albums')
            .select('*')
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })

        if (createdError) {
            console.error('Error fetching created albums:', createdError)
            return { albums: null, error: createdError }
        }

        // Get albums where user is a collaborator
        const { data: collaboratorData, error: collaboratorError } = await supabase
            .from('album_members')
            .select(`
                album_id,
                albums!inner (
                    id,
                    title,
                    description,
                    share_id,
                    is_public,
                    creator_id,
                    created_at,
                    updated_at
                )
            `)
            .eq('allowed_email', user.email)

        if (collaboratorError) {
            console.error('Error fetching collaborated albums:', collaboratorError)
            // Don't return error here, just log it and continue with created albums only
        }

        // Extract albums from collaborator data
        const collaboratedAlbums = collaboratorData?.map(item => item.albums).filter(Boolean) || []

        // Combine and deduplicate albums
        const allAlbums = [...(createdAlbums || []), ...collaboratedAlbums]

        // Remove duplicates based on album ID
        const uniqueAlbums = allAlbums.filter((album, index, self) =>
            index === self.findIndex(a => a.id === album.id)
        )

        // Sort by created_at descending
        uniqueAlbums.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        console.log(`Found ${createdAlbums?.length || 0} created albums and ${collaboratedAlbums.length} collaborated albums`)
        console.log('Total unique albums:', uniqueAlbums.length)

        return { albums: uniqueAlbums, error: null }

    } catch (error) {
        console.error('Error in getUserAlbums:', error)
        return { albums: null, error }
    }
}

export async function getAlbumById(id: string): Promise<{ album: Album | null; error: any }> {
    try {
        const { data: album, error } = await supabase
            .from('albums')
            .select('*')
            .eq('id', id)
            .single()

        return { album, error }
    } catch (error) {
        return { album: null, error }
    }
}

export async function getAlbumByShareId(shareId: string): Promise<{ album: Album | null; error: any }> {
    try {
        const { data: album, error } = await supabase
            .from('albums')
            .select('*')
            .eq('share_id', shareId)
            .single()

        return { album, error }
    } catch (error) {
        return { album: null, error }
    }
}

export interface UpdateAlbumData {
    title?: string
    description?: string
    is_public?: boolean
}

export async function updateAlbum(albumId: string, data: UpdateAlbumData): Promise<{ album: Album | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { album: null, error: 'User not authenticated' }
        }

        console.log('Updating album:', albumId, 'with data:', data)

        const { data: album, error } = await supabase
            .from('albums')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', albumId)
            .eq('creator_id', user.id) // Only allow creator to update
            .select()
            .single()

        if (error) {
            console.error('Error updating album:', error)
            return { album: null, error }
        }

        console.log('Album updated successfully:', album)
        return { album, error: null }
    } catch (error) {
        console.error('Error updating album:', error)
        return { album: null, error }
    }
}