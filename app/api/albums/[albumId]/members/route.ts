// app/api/albums/[albumId]/members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseService } from '@/lib/supabase-service'

// GET /api/albums/[albumId]/members - Get all members of an album
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ albumId: string }> }
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

        const paramsReceived = await params
        const albumId = paramsReceived.albumId

        // Check if user has access to this album
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

        // Check if user is creator or member
        const isCreator = album.creator_id === user.id

        if (!isCreator) {
            const { data: membership } = await supabaseService
                .from('album_members')
                .select('id')
                .eq('album_id', albumId)
                .eq('allowed_email', user.email)
                .single()

            if (!membership) {
                return NextResponse.json(
                    { error: 'Access denied' },
                    { status: 403 }
                )
            }
        }

        // Get all allowed emails for this album
        const { data: members, error } = await supabaseService
            .from('album_members')
            .select(`
                id,
                album_id,
                allowed_email,
                role,
                added_at
            `)
            .eq('album_id', albumId)
            .order('added_at', { ascending: true })

        if (error) {
            console.error('Error fetching members:', error)
            return NextResponse.json(
                { error: 'Failed to fetch members' },
                { status: 500 }
            )
        }

        return NextResponse.json({ members })

    } catch (error: any) {
        console.error('Error in GET /api/albums/[albumId]/members:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/albums/[albumId]/members - Add an email to the album
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ albumId: string }> }
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

        const paramsReceived = await params
        const albumId = paramsReceived.albumId
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Check if user is album creator (only creators can add collaborators)
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
            return NextResponse.json(
                { error: 'Only album creators can add collaborators' },
                { status: 403 }
            )
        }

        // Check if email is already added
        const { data: existingMember } = await supabaseService
            .from('album_members')
            .select('id')
            .eq('album_id', albumId)
            .eq('allowed_email', email)
            .single()

        if (existingMember) {
            return NextResponse.json(
                { error: 'This email is already a collaborator' },
                { status: 400 }
            )
        }

        // Don't allow adding the creator's own email
        if (email === user.email) {
            return NextResponse.json(
                { error: 'You are already the album creator' },
                { status: 400 }
            )
        }

        // Add the email as a collaborator
        const { data: newMember, error } = await supabaseService
            .from('album_members')
            .insert({
                album_id: albumId,
                allowed_email: email,
                role: 'member',
                added_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding collaborator:', error)
            return NextResponse.json(
                { error: 'Failed to add collaborator' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            member: newMember
        })

    } catch (error: any) {
        console.error('Error in POST /api/albums/[albumId]/members:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}