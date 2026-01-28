// app/api/albums/[albumId]/media/[mediaId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseService } from '@/lib/supabase-service'
import { del } from '@vercel/blob'

// Define the route context interface
interface RouteContext {
    params: Promise<{
        albumId: string
        mediaId: string
    }>
}

// DELETE /api/albums/[albumId]/media/[mediaId] - Delete a media file
export async function DELETE(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            )
        }

        const token = authHeader.split(' ')[1]

        // Verify the user with regular Supabase client (for authentication)
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            console.error('Auth error:', authError)
            return NextResponse.json(
                { error: 'Invalid token or user not found' },
                { status: 401 }
            )
        }

        const { albumId, mediaId } = await params

        // Check if user has access to this album (creator or collaborator)
        const { data: album } = await supabaseService
            .from('albums')
            .select('creator_id')
            .eq('id', albumId)
            .single()

        if (!album) {
            return NextResponse.json(
                { error: 'Album not found' },
                { status: 404 }
            )
        }

        const isCreator = album.creator_id === user.id

        if (!isCreator) {
            // Check if user is a collaborator
            const { data: membership } = await supabaseService
                .from('album_members')
                .select('id')
                .eq('album_id', albumId)
                .eq('allowed_email', user.email)
                .single()

            if (!membership) {
                return NextResponse.json(
                    { error: 'Access denied - only album creator or collaborators can delete media' },
                    { status: 403 }
                )
            }
        }

        // Get media info before deleting
        const { data: mediaToDelete } = await supabaseService
            .from('media')
            .select('blob_url, uploader_id, original_name')
            .eq('id', mediaId)
            .eq('album_id', albumId)
            .single()

        if (!mediaToDelete) {
            return NextResponse.json(
                { error: 'Media not found' },
                { status: 404 }
            )
        }

        // Optional: Only allow users to delete their own uploads (uncomment if desired)
        // if (!isCreator && mediaToDelete.uploader_id !== user.id) {
        //     return NextResponse.json(
        //         { error: 'You can only delete media you uploaded' },
        //         { status: 403 }
        //     )
        // }

        console.log('Deleting media:', mediaToDelete.original_name)

        // Delete from Vercel Blob first
        try {
            await del(mediaToDelete.blob_url)
            console.log('Successfully deleted from Vercel Blob')
        } catch (blobError) {
            console.error('Error deleting from Vercel Blob:', blobError)
            // Continue with database deletion even if blob deletion fails
        }

        // Delete from database
        const { error: dbError } = await supabaseService
            .from('media')
            .delete()
            .eq('id', mediaId)
            .eq('album_id', albumId)

        if (dbError) {
            console.error('Error deleting from database:', dbError)
            return NextResponse.json(
                { error: 'Failed to delete media from database' },
                { status: 500 }
            )
        }

        console.log('Media deleted successfully')

        return NextResponse.json({
            success: true,
            message: 'Media deleted successfully'
        })

    } catch (error: any) {
        console.error('Error in DELETE /api/albums/[albumId]/media/[mediaId]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}