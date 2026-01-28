-- Vacay Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Albums table
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    share_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    is_public BOOLEAN DEFAULT false,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media table
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    blob_url TEXT NOT NULL,          -- Original/raw file for download
    large_url TEXT,                   -- Optimized for viewing (~1500px)
    thumbnail_url TEXT,               -- Grid display (~400px)
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add large_url column if upgrading from older schema
-- ALTER TABLE public.media ADD COLUMN IF NOT EXISTS large_url TEXT;

-- Album members (collaborators) table
CREATE TABLE IF NOT EXISTS public.album_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    allowed_email TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(album_id, allowed_email)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_albums_creator_id ON public.albums(creator_id);
CREATE INDEX IF NOT EXISTS idx_albums_share_id ON public.albums(share_id);
CREATE INDEX IF NOT EXISTS idx_media_album_id ON public.media(album_id);
CREATE INDEX IF NOT EXISTS idx_media_uploader_id ON public.media(uploader_id);
CREATE INDEX IF NOT EXISTS idx_album_members_album_id ON public.album_members(album_id);
CREATE INDEX IF NOT EXISTS idx_album_members_email ON public.album_members(allowed_email);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_members ENABLE ROW LEVEL SECURITY;

-- Albums policies
CREATE POLICY "Users can view their own albums" ON public.albums
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can view albums they're members of" ON public.albums
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.album_members
            WHERE album_id = id AND LOWER(allowed_email) = LOWER(auth.jwt()->>'email')
        )
    );

CREATE POLICY "Anyone can view public albums by share_id" ON public.albums
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create albums" ON public.albums
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their albums" ON public.albums
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their albums" ON public.albums
    FOR DELETE USING (auth.uid() = creator_id);

-- Media policies
CREATE POLICY "Users can view media in their albums" ON public.media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE id = album_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view media in collaborated albums" ON public.media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.album_members am
            JOIN public.albums a ON am.album_id = a.id
            WHERE a.id = album_id AND LOWER(am.allowed_email) = LOWER(auth.jwt()->>'email')
        )
    );

CREATE POLICY "Anyone can view media in public albums" ON public.media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE id = album_id AND is_public = true
        )
    );

CREATE POLICY "Users can upload to their albums" ON public.media
    FOR INSERT WITH CHECK (
        auth.uid() = uploader_id AND
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE id = album_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "Collaborators can upload to albums" ON public.media
    FOR INSERT WITH CHECK (
        auth.uid() = uploader_id AND
        EXISTS (
            SELECT 1 FROM public.album_members am
            WHERE am.album_id = album_id AND LOWER(am.allowed_email) = LOWER(auth.jwt()->>'email')
        )
    );

CREATE POLICY "Creators can delete any media in their albums" ON public.media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE id = album_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "Uploaders can delete their own media" ON public.media
    FOR DELETE USING (auth.uid() = uploader_id);

-- Album members policies
CREATE POLICY "Album creators can view members" ON public.album_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE id = album_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "Members can view their own membership" ON public.album_members
    FOR SELECT USING (LOWER(allowed_email) = LOWER(auth.jwt()->>'email'));

CREATE POLICY "Album creators can add members" ON public.album_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE id = album_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "Album creators can remove members" ON public.album_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE id = album_id AND creator_id = auth.uid()
        )
    );

-- ===========================================
-- SUPABASE STORAGE SETUP
-- ===========================================

-- Create the media storage bucket
-- Run this in Supabase Dashboard > Storage > Create bucket
-- Bucket name: media
-- Public bucket: Yes (for public URL access)

-- Storage policies (set in Supabase Dashboard > Storage > Policies)
-- Or run these SQL commands:

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow public read access
CREATE POLICY "Public read access for media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
