// app/api/share/[shareId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase-service'

// GET /api/share/[shareId] - Get public album data by share ID
export async function GET(
    request: NextRequest,
    { params }: { params: { shareId: string } }
) {
    try {
        const { shareId } = params

        if (!shareId) {
            return NextResponse.json(
                { error: 'Share ID is required' },
                { status: 400 }
            )
        }

        // Get album by share_id (no auth required for public albums)
        const { data: album, error: albumError } = await supabaseService
            .from('albums')
            .select('*')
            .eq('share_id', shareId)
            .single()

        if (albumError || !album) {
            console.error('Album not found:', albumError)
            return NextResponse.json(
                { error: 'Album not found' },
                { status: 404 }
            )
        }

        // Check if album is public (optional - you might want all shared albums to be viewable)
        if (!album.is_public) {
            return NextResponse.json(
                { error: 'This album is private' },
                { status: 403 }
            )
        }

        // Get all media for this album
        const { data: media, error: mediaError } = await supabaseService
            .from('media')
            .select('*')
            .eq('album_id', album.id)
            .order('uploaded_at', { ascending: false })

        if (mediaError) {
            console.error('Error fetching media:', mediaError)
            return NextResponse.json(
                { error: 'Failed to fetch media' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            album: {
                id: album.id,
                title: album.title,
                description: album.description,
                is_public: album.is_public,
                created_at: album.created_at,
                share_id: album.share_id
            },
            media: media || []
        })

    } catch (error: any) {
        console.error('Error in GET /api/share/[shareId]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}