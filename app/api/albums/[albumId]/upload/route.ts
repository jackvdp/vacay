import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { supabase } from '@/lib/supabase'
import { supabaseService } from '@/lib/supabase-service'

export async function POST(
    request: NextRequest,
    { params }: { params: { albumId: string } }
) {
    try {
        const albumId = params.albumId

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
            return NextResponse.json(
                { error: 'Invalid token or user not found' },
                { status: 401 }
            )
        }

        console.log('Authenticated user:', user.id, 'for album:', albumId)

        // Use service role client for database operations (bypasses RLS)
        // Check if album exists
        const { data: album, error: albumError } = await supabaseService
            .from('albums')
            .select('id, creator_id, title')
            .eq('id', albumId)
            .single()

        console.log('Album query result:', { album, albumError })

        if (albumError || !album) {
            return NextResponse.json(
                { error: `Album not found: ${albumError?.message || 'Unknown error'}` },
                { status: 404 }
            )
        }

        // Check if user has permission (creator or member)
        const { data: membership, error: membershipError } = await supabaseService
            .from('album_members')
            .select('id, role')
            .eq('album_id', albumId)
            .eq('user_id', user.id)
            .single()

        console.log('Membership check:', { membership, membershipError })

        const isCreator = album.creator_id === user.id
        const isMember = !!membership && !membershipError

        console.log('Permission check:', { isCreator, isMember, creatorId: album.creator_id, userId: user.id })

        if (!isCreator && !isMember) {
            return NextResponse.json(
                { error: 'You do not have permission to upload to this album' },
                { status: 403 }
            )
        }

        // Parse the form data
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const validTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
            'video/mp4', 'video/mov', 'video/avi'
        ]

        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type: ${file.type}. Supported types: ${validTypes.join(', ')}` },
                { status: 400 }
            )
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024 // 50MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 50MB)` },
                { status: 400 }
            )
        }

        // Generate unique filename
        const timestamp = Date.now()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `albums/${albumId}/${timestamp}_${sanitizedName}`

        console.log('Uploading file to Vercel Blob:', filename)

        // Upload to Vercel Blob
        const blob = await put(filename, file, {
            access: 'public',
        })

        console.log('File uploaded to blob:', blob.url)

        // Get image dimensions if it's an image
        let width: number | undefined
        let height: number | undefined

        if (file.type.startsWith('image/')) {
            try {
                const arrayBuffer = await file.arrayBuffer()
                const dimensions = await getImageDimensionsFromBuffer(arrayBuffer)
                width = dimensions.width
                height = dimensions.height
            } catch (err) {
                console.warn('Could not get image dimensions:', err)
            }
        }

        // Save metadata to Supabase using service role (bypasses RLS)
        const mediaData = {
            album_id: albumId,
            uploader_id: user.id,
            filename: filename,
            original_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            blob_url: blob.url,
            width,
            height,
        }

        console.log('Saving media metadata:', mediaData)

        const { data: media, error: mediaError } = await supabaseService
            .from('media')
            .insert(mediaData)
            .select()
            .single()

        if (mediaError) {
            console.error('Error saving media metadata:', mediaError)
            return NextResponse.json(
                { error: `Failed to save media metadata: ${mediaError.message}` },
                { status: 500 }
            )
        }

        console.log('Media saved successfully:', media)

        return NextResponse.json({
            success: true,
            media: media
        })

    } catch (error: any) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: `Internal server error: ${error.message}` },
            { status: 500 }
        )
    }
}

// Helper function to get image dimensions from buffer
async function getImageDimensionsFromBuffer(buffer: ArrayBuffer): Promise<{ width: number; height: number }> {
    // For now, we'll skip dimension detection on server side
    // You could use a library like 'sharp' for this if needed
    return { width: 0, height: 0 }
}