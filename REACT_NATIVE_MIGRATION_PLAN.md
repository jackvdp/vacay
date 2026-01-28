# React Native Migration Plan for Vacay

## Executive Summary

This document outlines two approaches for adding mobile support to the Vacay photo-sharing application:

| Aspect | Option A: Separate RN App | Option B: Expo Universal (Recommended) |
|--------|--------------------------|----------------------------------------|
| Complexity | Medium | Medium-High initially, then simpler |
| Code Sharing | Minimal (~20% types/API) | Maximum (~80% components/logic) |
| Maintenance | Two codebases | Single codebase |
| Web Hosting | Keep Vercel | Vercel, Netlify, or EAS Hosting |
| Native Features | Full access | Full access via Expo |
| Time to MVP | Faster (mobile only) | Slower initially, faster long-term |

**Recommendation**: Option B (Expo Universal) - Single codebase for iOS, Android, and Web

---

## Current Tech Stack Analysis

### What You Have
- **Framework**: Next.js 15.3.3 with App Router
- **UI**: Radix UI + Tailwind CSS v4
- **Auth**: Supabase (Google OAuth)
- **Database**: Supabase PostgreSQL
- **File Storage**: Vercel Blob
- **Animations**: Framer Motion
- **Hosting**: Vercel

### Migration Compatibility

| Component | Reusable in RN? | Notes |
|-----------|-----------------|-------|
| TypeScript types | ✅ 100% | Direct copy |
| Supabase client | ✅ 95% | Minor auth flow changes |
| API logic (lib/) | ✅ 80% | Abstract fetch calls |
| React Context | ✅ 100% | Works identically |
| Radix UI | ❌ 0% | Web-only, need replacements |
| Tailwind CSS | ⚠️ 70% | Use NativeWind for RN |
| Framer Motion | ❌ 0% | Use Reanimated 3 |
| Next.js routing | ❌ 0% | Use Expo Router |

---

## Option A: Separate React Native App

Keep the existing Next.js web app and create a new React Native mobile app alongside it.

### Structure
```
vacay/
├── web/                    # Existing Next.js app (moved here)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── mobile/                 # New React Native app
│   ├── app/               # Expo Router screens
│   ├── components/
│   ├── lib/               # Shared logic (duplicated)
│   └── package.json
└── shared/                # Optional: shared types/utils
    └── types/
```

### Pros
- Lower risk - existing web app unchanged
- Can ship mobile faster without affecting web
- Independent deployment cycles
- Easier to experiment with mobile UX

### Cons
- **Code duplication** - maintain two codebases
- **Feature drift** - mobile/web can diverge
- **Double testing** - test everything twice
- **Slower iteration** - changes need two implementations

### Hosting
- **Web**: Continue using Vercel (unchanged)
- **Mobile**: App Store + Google Play via EAS Build

### Estimated Effort
- Initial setup: 1-2 days
- Core features (auth, albums, upload): 2-3 weeks
- Parity with web: 3-4 weeks

---

## Option B: Expo Universal App (Recommended)

Convert entire project to Expo with React Native Web support. Single codebase for iOS, Android, and Web.

### Structure
```
vacay/
├── legacy-nextjs/          # Old Next.js app (archived/reference)
├── app/                    # Expo Router (file-based routing)
│   ├── (tabs)/            # Tab navigator group
│   │   ├── index.tsx      # Home/Dashboard
│   │   ├── albums/
│   │   │   └── [id].tsx   # Album detail
│   │   └── profile.tsx    # User profile
│   ├── (auth)/            # Auth flow group
│   │   ├── sign-in.tsx
│   │   └── callback.tsx
│   ├── share/
│   │   └── [shareId].tsx  # Public share (no auth)
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 page
├── components/
│   ├── ui/                # Platform-adaptive components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── albums/
│   │   ├── AlbumCard.tsx
│   │   ├── PhotoGrid.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── MemberModal.tsx
│   └── auth/
│       └── AuthProvider.tsx
├── lib/
│   ├── supabase.ts        # Supabase client (universal)
│   ├── auth-context.tsx   # Auth state management
│   ├── albums.ts          # Album API functions
│   └── media.ts           # Media utilities
├── hooks/
│   ├── useAuth.ts
│   ├── useAlbums.ts
│   └── useMedia.ts
├── types/
│   └── album.ts           # TypeScript interfaces (unchanged)
├── assets/                # Images, fonts
├── app.json               # Expo config
├── package.json
├── tsconfig.json
├── metro.config.js        # Metro bundler config
├── babel.config.js
└── nativewind-env.d.ts    # NativeWind types
```

### Tech Stack for Universal App

| Category | Library | Why |
|----------|---------|-----|
| Framework | Expo SDK 52+ | Best DX, OTA updates, EAS Build |
| Routing | Expo Router v4 | File-based routing like Next.js |
| Styling | NativeWind v4 | Tailwind CSS for React Native |
| UI Kit | Tamagui or custom | Cross-platform primitives |
| Animations | Reanimated 3 | 60fps native animations |
| Auth | Supabase + Expo AuthSession | OAuth flows on all platforms |
| Storage | Vercel Blob | Keep existing (works via fetch) |
| Forms | React Hook Form | Universal form handling |
| Images | expo-image | Optimized image component |
| Camera | expo-image-picker | Camera/gallery access |
| Toast | burnt or sonner | Cross-platform notifications |

### Pros
- **Single codebase** - write once, deploy everywhere
- **Code sharing** - 80%+ code reuse across platforms
- **Consistent UX** - same features on all platforms
- **Easier maintenance** - one set of tests, one deployment
- **Future-proof** - Expo is the recommended RN approach
- **OTA updates** - push JS updates without app store review

### Cons
- **Initial effort** - more work upfront to convert
- **Learning curve** - React Native specifics
- **Web styling** - NativeWind has some web limitations vs pure Tailwind
- **Bundle size** - Web bundle larger than pure Next.js

### Hosting Options

#### 1. **Vercel** (Easiest for you)
```bash
# expo export for web, deploy to Vercel
npx expo export --platform web
# Configure vercel.json for SPA routing
```

**vercel.json:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

**Pros**: You already use it, easy CI/CD, fast global CDN
**Cons**: Static export only (no SSR), need separate API hosting

#### 2. **EAS Hosting** (New - Expo's offering)
```bash
# Deploy directly from EAS
eas deploy
```

**Pros**: Native Expo integration, unified mobile+web deploys
**Cons**: Newer service, pricing still evolving

#### 3. **Netlify**
```bash
npx expo export --platform web
# Deploy dist folder to Netlify
```

**Pros**: Great free tier, easy setup, serverless functions
**Cons**: Similar to Vercel, just preference

#### 4. **Cloudflare Pages**
```bash
npx expo export --platform web
# Deploy to Cloudflare Pages
```

**Pros**: Unlimited bandwidth, fast edge network, free tier generous
**Cons**: Less Next.js-specific features

### API Hosting Consideration

Since Expo web exports as a static SPA, your current Next.js API routes need a new home:

| Option | Effort | Notes |
|--------|--------|-------|
| **Supabase Edge Functions** | Low | Best fit - already using Supabase |
| **Vercel Serverless** | Low | Keep API routes, separate deploy |
| **Cloudflare Workers** | Medium | Fast, cheap, but new platform |

**Recommendation**: Move API logic to **Supabase Edge Functions** since you're already using Supabase. This also simplifies auth (no Bearer token passing needed).

---

## Detailed Migration Steps (Option B)

### Phase 1: Project Setup (Day 1)

1. **Archive existing code**
   ```bash
   mkdir legacy-nextjs
   mv app components lib types public legacy-nextjs/
   mv *.json *.ts *.js *.mjs legacy-nextjs/
   ```

2. **Initialize Expo project**
   ```bash
   npx create-expo-app@latest . --template tabs
   ```

3. **Install dependencies**
   ```bash
   npx expo install expo-router expo-image expo-image-picker
   npx expo install @supabase/supabase-js
   npm install nativewind tailwindcss
   npm install react-hook-form zod @hookform/resolvers
   npm install burnt # for toasts
   ```

4. **Configure NativeWind**
   - Setup tailwind.config.js for React Native
   - Configure babel.config.js with NativeWind preset

### Phase 2: Core Infrastructure (Days 2-3)

1. **Auth System**
   - Port `lib/auth-context.tsx`
   - Setup Expo AuthSession for Google OAuth
   - Test auth flow on iOS, Android, Web

2. **Supabase Client**
   - Port `lib/supabase.ts` (minimal changes)
   - Configure for React Native environment

3. **Navigation Structure**
   - Setup Expo Router file structure
   - Implement tab navigation (Dashboard, Profile)
   - Stack navigation for album details

### Phase 3: UI Components (Days 4-7)

1. **Design System**
   - Port color tokens to NativeWind config
   - Create base components (Button, Card, Input, Modal)
   - Setup dark mode support

2. **Album Components**
   - AlbumCard with image preview
   - PhotoGrid with virtualized list (FlashList)
   - CreateAlbumModal

3. **Media Components**
   - PhotoUpload with expo-image-picker
   - Image viewer with pinch-to-zoom
   - Video player

### Phase 4: Features (Days 8-14)

1. **Dashboard**
   - Album list with pull-to-refresh
   - Create album flow
   - Search/filter albums

2. **Album Detail**
   - Photo grid view
   - Upload photos (camera + gallery)
   - Member management
   - Share functionality

3. **Public Share**
   - View shared album
   - Download media
   - Deep linking support

### Phase 5: Polish & Deploy (Days 15-21)

1. **Performance**
   - Image caching
   - List virtualization
   - Skeleton loaders

2. **Platform-Specific**
   - iOS: Share sheet, Photos integration
   - Android: Download to gallery
   - Web: Drag-and-drop upload

3. **Testing**
   - Test on physical devices
   - Test web build on different browsers

4. **Deployment**
   - Setup EAS Build for mobile
   - Configure Vercel for web
   - Setup CI/CD pipeline

---

## API Migration Strategy

### Current Next.js API Routes → Supabase Edge Functions

| Current Route | New Location | Notes |
|--------------|--------------|-------|
| `/api/albums/[id]/upload-token` | Edge Function | Generate Vercel Blob tokens |
| `/api/albums/[id]/metadata` | Direct Supabase | Insert via client SDK |
| `/api/albums/[id]/members` | Direct Supabase | RLS handles permissions |
| `/api/share/[shareId]` | Direct Supabase | Public query with RLS |

**Most operations can use Supabase client directly**, eliminating need for API routes:

```typescript
// Before: API call
const res = await fetch(`/api/albums/${id}/members`, {
  headers: { Authorization: `Bearer ${token}` }
})

// After: Direct Supabase
const { data } = await supabase
  .from('album_members')
  .select('*')
  .eq('album_id', id)
```

**Only Vercel Blob upload needs a serverless function** (for token generation):
- Option 1: Supabase Edge Function
- Option 2: Keep single Vercel serverless function
- Option 3: Switch to Supabase Storage (simpler, unified)

### Recommendation: Switch to Supabase Storage

Since you're already using Supabase, consider migrating from Vercel Blob to Supabase Storage:

**Pros:**
- Unified platform (auth + db + storage)
- RLS policies for storage too
- No separate API for upload tokens
- Simpler architecture

**Cons:**
- Migration effort for existing files
- Different URL structure

---

## Cost Comparison

### Current (Vercel + Supabase)
- Vercel Pro: ~$20/month
- Supabase Free: $0 (or Pro at $25/month)
- Vercel Blob: Pay per GB stored/transferred

### Option B with Vercel Web Hosting
- Vercel Pro: ~$20/month (web hosting)
- Supabase Pro: ~$25/month (db + auth + storage)
- EAS Build: Free tier or $29/month for teams
- Apple Developer: $99/year
- Google Play: $25 one-time

### Estimated Monthly: $45-75 + app store fees

---

## Recommended Path Forward

### My Recommendation: **Option B (Expo Universal)**

**Reasoning:**
1. Your app is relatively simple (CRUD + file uploads)
2. 80%+ of your code will work across platforms
3. Long-term maintenance is significantly easier
4. Expo's web support has matured considerably
5. You get native mobile features (camera, share sheet, push notifications)
6. Single deployment pipeline

### Immediate Next Steps

1. **Confirm direction** - Are you comfortable with Option B?
2. **Storage decision** - Keep Vercel Blob or migrate to Supabase Storage?
3. **Design review** - Any mobile-specific UX changes you want?
4. **Timeline** - Do you have a target launch date?

### Quick Start (If you want to proceed)

```bash
# Create new branch for migration
git checkout -b expo-migration

# Archive existing code
mkdir legacy-nextjs
git mv app components lib types public *.json *.ts *.js *.mjs legacy-nextjs/

# Initialize Expo
npx create-expo-app@latest . --template tabs

# Install core dependencies
npx expo install expo-router expo-image expo-image-picker @supabase/supabase-js
npm install nativewind tailwindcss

# Start development
npx expo start
```

---

## Questions to Discuss

1. **Option A or B?** (I recommend B)
2. **Keep Vercel Blob or switch to Supabase Storage?**
3. **Any features you want to add/remove for mobile?**
4. **Timeline expectations?**
5. **Do you need offline support?**

Let me know your preferences and I can start the implementation!
