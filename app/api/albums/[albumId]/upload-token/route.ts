// app/api/albums/[albumId]/upload-token/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { supabase } from '@/lib/supabase'
import { supabaseService } from '@/lib/supabase-service'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ albumId: string }> }
): Promise<NextResponse> {
    try {
        const paramsReceived = await params
        const albumId = paramsReceived.albumId
        const body = (await request.json()) as HandleUploadBody

        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname: string, clientPayload: string | null, multipart: boolean) => {
                // The client payload should contain the user's session token
                // since Vercel Blob client doesn't pass Authorization headers
                let user;

                if (clientPayload) {
                    try {
                        const payload = JSON.parse(clientPayload)
                        const userToken = payload.userToken

                        if (userToken) {
                            const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser(userToken)
                            if (!authError && authenticatedUser) {
                                user = authenticatedUser
                            }
                        }
                    } catch (e) {
                        console.warn('Could not parse client payload:', e)
                    }
                }

                if (!user) {
                    throw new Error('Authentication required')
                }

                // Check if album exists and user has permission
                const { data: album, error: albumError } = await supabaseService
                    .from('albums')
                    .select('id, creator_id, title')
                    .eq('id', albumId)
                    .single()

                if (albumError || !album) {
                    throw new Error('Album not found')
                }

                // Check permissions
                const isCreator = album.creator_id === user.id
                let isMember = false

                if (!isCreator) {
                    const { data: membership } = await supabaseService
                        .from('album_members')
                        .select('id, role')
                        .eq('album_id', albumId)
                        .eq('allowed_email', user.email)
                        .single()

                    isMember = !!membership
                }

                if (!isCreator && !isMember) {
                    throw new Error('You do not have permission to upload to this album')
                }

                console.log(`Token generated for user ${user.id} to upload to album ${albumId}`)

                return {
                    allowedContentTypes: [
                        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
                        'video/mp4', 'video/mov', 'video/quicktime', 'video/avi',
                        'application/octet-stream' // For files with generic MIME types
                    ],
                    tokenPayload: JSON.stringify({
                        userId: user.id,
                        albumId: albumId,
                        uploadedAt: new Date().toISOString()
                    }),
                }
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // This is called when the upload completes
                // We'll handle metadata saving separately in the metadata endpoint
                console.log('Blob upload completed:', blob.url)

                try {
                    const payload = JSON.parse(tokenPayload || '{}')
                    console.log('Upload completed for user:', payload.userId, 'album:', payload.albumId)
                } catch (error) {
                    console.warn('Could not parse token payload:', tokenPayload)
                }
            },
        })

        return NextResponse.json(jsonResponse)
    } catch (error: any) {
        console.error('Token generation error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate upload token' },
            { status: 400 }
        )
    }
}