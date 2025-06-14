// app/api/albums/[albumId]/metadata/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseService } from '@/lib/supabase-service'

interface MediaMetadata {
    album_id: string
    filename: string
    original_name: string
    mime_type: string
    size_bytes: number
    blob_url: string
    width?: number
    height?: number
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ albumId: string }> }
) {
    try {
        const paramsReceived = await params
        const albumId = paramsReceived.albumId

        // Get the authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            )
        }

        const token = authHeader.split(' ')[1]

        // Verify the user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Invalid token or user not found' },
                { status: 401 }
            )
        }

        // Parse the request body
        const mediaData: MediaMetadata = await request.json()

        // Validate that albumId matches
        if (mediaData.album_id !== albumId) {
            return NextResponse.json(
                { error: 'Album ID mismatch' },
                { status: 400 }
            )
        }

        console.log('Saving media metadata for user:', user.id, 'album:', albumId)

        // Save metadata to database using service role (bypasses RLS)
        const { data: media, error: mediaError } = await supabaseService
            .from('media')
            .insert({
                ...mediaData,
                uploader_id: user.id,
            })
            .select()
            .single()

        if (mediaError) {
            console.error('Error saving media metadata:', mediaError)
            return NextResponse.json(
                { error: `Failed to save media metadata: ${mediaError.message}` },
                { status: 500 }
            )
        }

        console.log('Media metadata saved successfully:', media.id)

        return NextResponse.json({
            success: true,
            media: media
        })

    } catch (error: any) {
        console.error('Metadata save error:', error)
        return NextResponse.json(
            { error: `Internal server error: ${error.message}` },
            { status: 500 }
        )
    }
}