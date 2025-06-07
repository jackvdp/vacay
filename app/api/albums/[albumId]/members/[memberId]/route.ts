// app/api/albums/[albumId]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseService } from '@/lib/supabase-service'

// DELETE /api/albums/[albumId]/members/[memberId] - Remove a collaborator
export async function DELETE(
    request: NextRequest,
    { params }: { params: { albumId: string; memberId: string } }
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

        const { albumId, memberId } = params

        // Check if user is album creator (only creators can remove collaborators)
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

        if (album.creator_id !== user.id) {
            return NextResponse.json(
                { error: 'Only album creators can remove collaborators' },
                { status: 403 }
            )
        }

        // Check if member exists
        const { data: memberToRemove } = await supabaseService
            .from('album_members')
            .select('allowed_email')
            .eq('id', memberId)
            .eq('album_id', albumId)
            .single()

        if (!memberToRemove) {
            return NextResponse.json(
                { error: 'Collaborator not found' },
                { status: 404 }
            )
        }

        // Remove the collaborator
        const { error } = await supabaseService
            .from('album_members')
            .delete()
            .eq('id', memberId)
            .eq('album_id', albumId)

        if (error) {
            console.error('Error removing collaborator:', error)
            return NextResponse.json(
                { error: 'Failed to remove collaborator' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error in DELETE /api/albums/[albumId]/members/[memberId]:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}