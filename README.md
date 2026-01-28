# Vacay

A cross-platform photo sharing app built with Expo (React Native) that runs on iOS, Android, and Web.

## Features

- Google OAuth authentication
- Create and manage photo albums
- Upload photos and videos
- Share albums publicly
- Collaborate with friends via email invites
- Download photos from shared albums

## Tech Stack

- **Framework**: Expo SDK 52 with Expo Router
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase (Auth, Database, Storage)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Environment Setup

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Supabase Setup

1. Create a new Supabase project
2. Enable Google OAuth in Authentication settings
3. Create a storage bucket named `media` with public access
4. Run the database migrations (see `legacy-nextjs/` for schema reference)

### Installation

```bash
npm install
```

### Development

```bash
# Start Expo development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web
```

### Building for Production

#### Web (Vercel)

The project is configured for Vercel deployment:

```bash
# Build for web
npm run build:web

# Deploy to Vercel
vercel
```

#### Mobile (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Project Structure

```
vacay/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigator
│   │   ├── index.tsx      # Dashboard (albums list)
│   │   └── profile.tsx    # User profile
│   ├── albums/
│   │   └── [id].tsx       # Album detail
│   ├── share/
│   │   └── [shareId].tsx  # Public share view
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Landing/auth page
├── components/
│   ├── ui/                # Base UI components
│   └── albums/            # Album-specific components
├── lib/                   # Utilities and API
├── types/                 # TypeScript definitions
├── constants/             # App constants
└── legacy-nextjs/         # Previous Next.js implementation (reference)
```

## License

MIT
