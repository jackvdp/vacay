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
            console.error('Supabase error:', error)
        } else {
            console.log('Album created successfully:', album)
        }

        return { album, error }
    } catch (error) {
        console.error('Catch error:', error)
        return { album: null, error }
    }
}

export async function getUserAlbums(): Promise<{ albums: Album[] | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { albums: null, error: 'User not authenticated' }
        }

        const { data: albums, error } = await supabase
            .from('albums')
            .select('*')
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })

        return { albums, error }
    } catch (error) {
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