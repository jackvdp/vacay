import { supabase } from './supabase'
import type { Album, CreateAlbumData } from '@/types/album'

export async function createAlbum(data: CreateAlbumData): Promise<{ album: Album | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { album: null, error: 'User not authenticated' }
        }

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

        return { album, error }
    } catch (error) {
        return { album: null, error }
    }
}

export async function getUserAlbums(): Promise<{ albums: Album[] | null; error: any }> {
    try {
        const { data: albums, error } = await supabase
            .from('albums')
            .select('*')
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