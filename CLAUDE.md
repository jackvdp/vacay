# Vacay - Project Guide for Claude

## What is this project?

Vacay is a cross-platform photo-sharing app built with **Expo (React Native)** that runs on iOS, Android, and Web from a single codebase. Users create albums, upload photos/videos, collaborate with friends, and share albums publicly. It was migrated from a Next.js web app to Expo universal; the original Next.js code is archived in `legacy-nextjs/` for reference.

## Tech Stack

- **Framework**: Expo SDK 52, Expo Router v4 (file-based routing)
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native), Tailwind 3.4
- **Backend**: Supabase (Auth, PostgreSQL database, Storage)
- **Auth**: Google OAuth via Supabase + expo-auth-session
- **Image Processing**: expo-image-manipulator (native), Canvas API (web)
- **Media Library**: expo-media-library (album download, save to Photos)
- **Video Playback**: expo-av (Live Photos)

## Project Structure

```
app/                          # Expo Router screens (file-based routing)
  _layout.tsx                 # Root layout with AuthProvider
  index.tsx                   # Landing/auth page
  (tabs)/
    _layout.tsx               # Tab navigator (Home + Profile)
    index.tsx                 # Dashboard - album list
    profile.tsx               # User profile + sign out
  albums/
    [id].tsx                  # Album detail (upload, grid, manage)
  share/
    [shareId].tsx             # Public share view (no auth required)

components/
  ui/                         # Reusable UI primitives
    Button.tsx                # Variants: primary, secondary, outline, ghost, danger
    Card.tsx, Input.tsx, Modal.tsx, Switch.tsx
    index.ts                  # Barrel export
  albums/                     # Feature components
    AlbumCard.tsx             # Album list item with cover image
    CreateAlbumModal.tsx      # New album form
    PhotoUpload.tsx           # Upload handler with Live Photo detection
    PhotoGrid.tsx             # Responsive photo grid using thumbnails
    LivePhotoView.tsx         # Live Photo playback (long-press to play video)
    MemberManagementModal.tsx # Add/remove collaborators by email
    index.ts                  # Barrel export

lib/                          # Business logic
  supabase.ts                 # Supabase client (SecureStore on native, localStorage on web)
  auth-context.tsx            # AuthProvider context, Google OAuth
  albums.ts                   # Album CRUD (create, update, delete, list, getById)
  media.ts                    # Upload (3 image versions + Live Photo video), delete, query
  image-processing.ts         # Resize to original/large(1500px)/thumbnail(400px)
  album-download.ts           # Save album to device Photos app or browser download
  live-photo.ts               # iOS Live Photo detection + video extraction
  utils.ts                    # cn(), formatFileSize(), MIME type helpers

types/
  album.ts                    # Album, Media, AlbumMember, UploadProgress interfaces

constants/
  Colors.ts                   # Teal primary palette, light/dark theme tokens
```

## Key Architecture Decisions

### Image Optimization (3-version system)
Every image upload creates 3 versions stored in Supabase Storage:
- **Original** (`-original.{ext}`) - raw file for download
- **Large** (`-large.jpg`) - ~1500px max dimension, 85% JPEG, for full-screen viewing
- **Thumbnail** (`-thumb.jpg`) - ~400px max dimension, 85% JPEG, for grid display

Helper functions in `lib/media.ts`: `getGridImageUrl()`, `getViewImageUrl()`, `getDownloadUrl()`

### Live Photo Support (iOS)
- Detection via `mediaSubtypes` in expo-image-picker asset info
- Uploads both the still image and paired `.MOV` video to Supabase Storage
- Database fields: `is_live_photo` (boolean), `live_video_url` (text)
- `LivePhotoView` component shows a LIVE badge and plays video on long-press (200ms+)
- `lib/live-photo.ts` handles detection and video URI extraction

### Album Download (Native)
- **iOS/Android**: Downloads photos via expo-file-system, saves to Photos app via expo-media-library, creates an album with the Vacay album name
- **Android-specific**: Uses `copyAsset=true` for reliable album creation; graceful fallback if album creation fails (photos still saved to gallery)
- **Web**: Browser download fallback with 500ms delay between files
- Progress tracking with phases: downloading → saving → complete

### Storage Layout in Supabase
Files stored in the `media` bucket with path: `{albumId}/{timestamp}-{random}-{variant}.{ext}`

Variants: `-original.{ext}`, `-large.jpg`, `-thumb.jpg`, `-live.mov`

### Authentication Flow
- Google OAuth via Supabase
- Web: redirect flow
- Native: expo-auth-session with expo-web-browser
- Token storage: SecureStore (native), localStorage (web)
- `AuthProvider` wraps the app, exposes `user`, `signIn()`, `signOut()`, `loading`

## Database Schema (Supabase PostgreSQL)

3 tables with Row Level Security enabled:

**albums** - `id`, `title`, `description`, `share_id` (UUID for public links), `is_public`, `creator_id`, `created_at`, `updated_at`

**media** - `id`, `album_id`, `uploader_id`, `filename`, `original_name`, `mime_type`, `size_bytes`, `blob_url`, `large_url`, `thumbnail_url`, `live_video_url`, `is_live_photo`, `width`, `height`, `duration`, `uploaded_at`

**album_members** - `id`, `album_id`, `allowed_email`, `role` ('admin'|'member'), `added_at`

RLS policies enforce: creators see their albums, members see shared albums, public albums visible by share_id, uploaders/creators can delete media. Full schema in `supabase-setup.sql`, migration steps in `MIGRATIONS.md`.

### Storage Bucket
- Bucket name: `media`, public read access
- Authenticated users can upload and delete

## Configuration Files

- **app.json** - Expo config: bundle ID `com.vacay.app`, teal splash (#0d9488), plugins for expo-router, expo-secure-store, expo-image-picker (camera/photo permissions), expo-media-library (save/location permissions)
- **tailwind.config.js** - Custom teal primary color palette (50-950), NativeWind preset
- **tsconfig.json** - Strict mode, `@/*` path alias
- **vercel.json** - Web deployment: `npx expo export --platform web`, output to `dist/`, SPA rewrite
- **.env** - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Commands

```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser
npm run build:web  # Build for Vercel
npm run lint       # ESLint
```

## Feature Summary

| Feature | Status | Key Files |
|---------|--------|-----------|
| Google OAuth | Done | `lib/auth-context.tsx` |
| Album CRUD | Done | `lib/albums.ts`, `app/(tabs)/index.tsx`, `app/albums/[id].tsx` |
| Photo/Video Upload | Done | `components/albums/PhotoUpload.tsx`, `lib/media.ts` |
| Image Optimization (3 versions) | Done | `lib/image-processing.ts`, `lib/media.ts` |
| Live Photo Support (iOS) | Done | `lib/live-photo.ts`, `components/albums/LivePhotoView.tsx` |
| Photo Grid with Thumbnails | Done | `components/albums/PhotoGrid.tsx` |
| Collaborator Management | Done | `components/albums/MemberManagementModal.tsx` |
| Public Album Sharing | Done | `app/share/[shareId].tsx` |
| Native Album Download | Done | `lib/album-download.ts` |
| User Profile | Done | `app/(tabs)/profile.tsx` |

## Things to Know

- The `legacy-nextjs/` folder contains the original Next.js app for reference only; do not modify it.
- All media deletion cleans up all 3 image versions + Live Photo video from storage.
- Android album creation uses `copyAsset=true` (vs `false` on iOS) for reliability.
- The `expo-media-library` plugin in app.json has `isAccessMediaLocationEnabled: true` for Android 10+ scoped storage.
- NativeWind className props work on React Native components; use `className` not `style` for Tailwind classes.
- Path alias `@/` maps to project root (e.g., `@/lib/media`, `@/components/ui`).
- Database migrations are idempotent and documented in `MIGRATIONS.md`. Run `supabase-setup.sql` for fresh setup.
