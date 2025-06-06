"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, LogOut } from "lucide-react"

export default function DashboardPage() {
    const { user, loading, signOut } = useAuth()
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
            <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/20">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <Camera className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                Vacay
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={user.user_metadata?.avatar_url}
                                    alt={user.user_metadata?.full_name}
                                    className="w-8 h-8 rounded-full"
                                />
                                <span className="text-slate-700 font-medium">
                  {user.user_metadata?.full_name}
                </span>
                            </div>
                            <Button
                                onClick={signOut}
                                variant="outline"
                                size="sm"
                                className="border-slate-200"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">
                        Welcome to your dashboard! 🎉
                    </h2>
                    <p className="text-xl text-slate-600 mb-8">
                        Authentication is working perfectly. Let's build some features!
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