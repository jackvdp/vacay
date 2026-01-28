import { supabase } from './supabase'
import type { Album, CreateAlbumData, UpdateAlbumData } from '@/types/album'

export async function createAlbum(
  data: CreateAlbumData
): Promise<{ album: Album | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { album: null, error: new Error('User not authenticated') }
    }

    const { data: album, error } = await supabase
      .from('albums')
      .insert({
        title: data.title,
        description: data.description,
        is_public: data.is_public || false,
        creator_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return { album: null, error: new Error(error.message) }
    }

    return { album, error: null }
  } catch (error) {
    return { album: null, error: error as Error }
  }
}

export async function getUserAlbums(): Promise<{
  albums: Album[] | null
  error: Error | null
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { albums: null, error: new Error('User not authenticated') }
    }

    // Get albums where user is the creator
    const { data: createdAlbums, error: createdError } = await supabase
      .from('albums')
      .select('*')
      .eq('creator_id', user.id)
      .order('title', { ascending: true })

    if (createdError) {
      return { albums: null, error: new Error(createdError.message) }
    }

    if (!user.email) {
      return { albums: createdAlbums || [], error: null }
    }

    // Get albums where user is a collaborator
    const { data: collaboratorData } = await supabase
      .from('album_members')
      .select(
        `
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
      `
      )
      .ilike('allowed_email', user.email)

    // Extract albums from collaborator data
    const collaboratedAlbums =
      collaboratorData?.map((item) => item.albums as unknown as Album).filter(Boolean) || []

    // Combine and deduplicate albums
    const allAlbums = [...(createdAlbums || []), ...collaboratedAlbums]
    const uniqueAlbums = allAlbums.filter(
      (album, index, self) => index === self.findIndex((a) => a.id === album.id)
    )

    // Sort alphabetically by title
    uniqueAlbums.sort((a, b) => a.title.localeCompare(b.title))

    return { albums: uniqueAlbums, error: null }
  } catch (error) {
    return { albums: null, error: error as Error }
  }
}

export async function getAlbumById(
  id: string
): Promise<{ album: Album | null; error: Error | null }> {
  try {
    const { data: album, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { album: null, error: new Error(error.message) }
    }

    return { album, error: null }
  } catch (error) {
    return { album: null, error: error as Error }
  }
}

export async function getAlbumByShareId(
  shareId: string
): Promise<{ album: Album | null; error: Error | null }> {
  try {
    const { data: album, error } = await supabase
      .from('albums')
      .select('*')
      .eq('share_id', shareId)
      .single()

    if (error) {
      return { album: null, error: new Error(error.message) }
    }

    return { album, error: null }
  } catch (error) {
    return { album: null, error: error as Error }
  }
}

export async function updateAlbum(
  albumId: string,
  data: UpdateAlbumData
): Promise<{ album: Album | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { album: null, error: new Error('User not authenticated') }
    }

    const { data: album, error } = await supabase
      .from('albums')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', albumId)
      .eq('creator_id', user.id)
      .select()
      .single()

    if (error) {
      return { album: null, error: new Error(error.message) }
    }

    return { album, error: null }
  } catch (error) {
    return { album: null, error: error as Error }
  }
}

export async function deleteAlbum(
  albumId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: new Error('User not authenticated') }
    }

    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', albumId)
      .eq('creator_id', user.id)

    if (error) {
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

export async function getAlbumMembers(albumId: string) {
  try {
    const { data: members, error } = await supabase
      .from('album_members')
      .select('*')
      .eq('album_id', albumId)

    if (error) {
      return { members: null, error: new Error(error.message) }
    }

    return { members, error: null }
  } catch (error) {
    return { members: null, error: error as Error }
  }
}

export async function addAlbumMember(albumId: string, email: string) {
  try {
    const { data: member, error } = await supabase
      .from('album_members')
      .insert({
        album_id: albumId,
        allowed_email: email.toLowerCase(),
        role: 'member',
      })
      .select()
      .single()

    if (error) {
      return { member: null, error: new Error(error.message) }
    }

    return { member, error: null }
  } catch (error) {
    return { member: null, error: error as Error }
  }
}

export async function removeAlbumMember(memberId: string) {
  try {
    const { error } = await supabase
      .from('album_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}
