import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Vacay - Share Your Travel Memories',
    description: 'Upload photos together, share with anyone, save to your device. Travel memories made simple.',
    keywords: ['travel', 'photos', 'sharing', 'collaboration', 'memories'],
    authors: [{ name: 'Vacay Team' }],
    openGraph: {
        title: 'Vacay - Share Your Travel Memories',
        description: 'Upload photos together, share with anyone, save to your device. Travel memories made simple.',
        type: 'website',
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    )
}