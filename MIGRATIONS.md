# Database Migrations

Run these in order in your Supabase SQL Editor.

## Initial Setup (Required)

Run the full schema from `supabase-setup.sql`, or run these individually:

### 1. Enable UUID Extension
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Create Albums Table
```sql
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
```

### 3. Create Media Table
```sql
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    blob_url TEXT NOT NULL,
    large_url TEXT,
    thumbnail_url TEXT,
    live_video_url TEXT,
    is_live_photo BOOLEAN DEFAULT false,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Create Album Members Table
```sql
CREATE TABLE IF NOT EXISTS public.album_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    allowed_email TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(album_id, allowed_email)
);
```

### 5. Create Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_albums_creator_id ON public.albums(creator_id);
CREATE INDEX IF NOT EXISTS idx_albums_share_id ON public.albums(share_id);
CREATE INDEX IF NOT EXISTS idx_media_album_id ON public.media(album_id);
CREATE INDEX IF NOT EXISTS idx_media_uploader_id ON public.media(uploader_id);
CREATE INDEX IF NOT EXISTS idx_album_members_album_id ON public.album_members(album_id);
CREATE INDEX IF NOT EXISTS idx_album_members_email ON public.album_members(allowed_email);
```

### 6. Enable Row Level Security
```sql
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_members ENABLE ROW LEVEL SECURITY;
```

### 7. Create RLS Policies
See `supabase-setup.sql` for the full list of policies, or run:

```sql
-- Albums: Users can view their own
CREATE POLICY "Users can view their own albums" ON public.albums
    FOR SELECT USING (auth.uid() = creator_id);

-- Albums: Users can view collaborated albums
CREATE POLICY "Users can view albums they're members of" ON public.albums
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.album_members
            WHERE album_id = id AND LOWER(allowed_email) = LOWER(auth.jwt()->>'email')
        )
    );

-- Albums: Anyone can view public albums
CREATE POLICY "Anyone can view public albums by share_id" ON public.albums
    FOR SELECT USING (is_public = true);

-- Albums: Users can create
CREATE POLICY "Users can create albums" ON public.albums
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Albums: Creators can update
CREATE POLICY "Creators can update their albums" ON public.albums
    FOR UPDATE USING (auth.uid() = creator_id);

-- Albums: Creators can delete
CREATE POLICY "Creators can delete their albums" ON public.albums
    FOR DELETE USING (auth.uid() = creator_id);

-- Media: View own albums
CREATE POLICY "Users can view media in their albums" ON public.media
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.albums WHERE id = album_id AND creator_id = auth.uid())
    );

-- Media: View collaborated albums
CREATE POLICY "Users can view media in collaborated albums" ON public.media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.album_members am
            JOIN public.albums a ON am.album_id = a.id
            WHERE a.id = album_id AND LOWER(am.allowed_email) = LOWER(auth.jwt()->>'email')
        )
    );

-- Media: Anyone can view public
CREATE POLICY "Anyone can view media in public albums" ON public.media
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.albums WHERE id = album_id AND is_public = true)
    );

-- Media: Upload to own albums
CREATE POLICY "Users can upload to their albums" ON public.media
    FOR INSERT WITH CHECK (
        auth.uid() = uploader_id AND
        EXISTS (SELECT 1 FROM public.albums WHERE id = album_id AND creator_id = auth.uid())
    );

-- Media: Collaborators can upload
CREATE POLICY "Collaborators can upload to albums" ON public.media
    FOR INSERT WITH CHECK (
        auth.uid() = uploader_id AND
        EXISTS (
            SELECT 1 FROM public.album_members am
            WHERE am.album_id = album_id AND LOWER(am.allowed_email) = LOWER(auth.jwt()->>'email')
        )
    );

-- Media: Creators can delete any
CREATE POLICY "Creators can delete any media in their albums" ON public.media
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.albums WHERE id = album_id AND creator_id = auth.uid())
    );

-- Media: Uploaders can delete own
CREATE POLICY "Uploaders can delete their own media" ON public.media
    FOR DELETE USING (auth.uid() = uploader_id);

-- Members: Creators can view
CREATE POLICY "Album creators can view members" ON public.album_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.albums WHERE id = album_id AND creator_id = auth.uid())
    );

-- Members: View own membership
CREATE POLICY "Members can view their own membership" ON public.album_members
    FOR SELECT USING (LOWER(allowed_email) = LOWER(auth.jwt()->>'email'));

-- Members: Creators can add
CREATE POLICY "Album creators can add members" ON public.album_members
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.albums WHERE id = album_id AND creator_id = auth.uid())
    );

-- Members: Creators can remove
CREATE POLICY "Album creators can remove members" ON public.album_members
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.albums WHERE id = album_id AND creator_id = auth.uid())
    );
```

---

## Storage Setup (Required)

### 1. Create Storage Bucket
In Supabase Dashboard → Storage → Create Bucket:
- **Name**: `media`
- **Public**: Yes

### 2. Storage Policies
```sql
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

-- Allow users to delete their uploads
CREATE POLICY "Users can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');
```

---

## Future Migrations

If you upgrade from an earlier version, run these:

### Add Image Optimization Columns
```sql
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS large_url TEXT;
```

### Add Live Photo Support
```sql
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS live_video_url TEXT;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_live_photo BOOLEAN DEFAULT false;
```

---

## Quick Start (All-in-One)

For a fresh setup, just run the entire `supabase-setup.sql` file - it includes everything above.
