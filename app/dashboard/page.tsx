"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import Navbar from "@/components/navbar"

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!user && !loading) {
            router.push('/')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
                        <Camera className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
            {/* Header */}
            <Navbar />

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">
                        Welcome to your dashboard! 🎉
                    </h2>
                    <p className="text-xl text-slate-600 mb-8">
                        Authentication is working perfectly. Let&apos;s build some features!
                    </p>

                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to build!</h3>
                        <p className="text-slate-600 mb-6">
                            Your Supabase authentication is set up and working. Time to add albums and photo features.
                        </p>
                        <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                            Create First Album
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}