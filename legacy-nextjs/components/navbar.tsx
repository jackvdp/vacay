"use client"

import { Button } from "@/components/ui/button"
import { Camera, LogOut, LayoutDashboard } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface NavbarProps {
    fixed?: boolean
    className?: string
}

export default function Navbar({ fixed = false, className = "" }: NavbarProps) {
    const { user, loading, signInWithGoogle, signOut } = useAuth()
    const router = useRouter()

    const navClasses = `
    ${fixed ? 'fixed top-0 z-50' : ''} 
    w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/20 
    ${className}
  `.trim()

    const handleLogoClick = () => {
        router.push('/')
    }

    const handleDashboardClick = () => {
        router.push('/dashboard')
    }

    return (
        <motion.nav
            initial={fixed ? { y: -100, opacity: 0 } : { opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={navClasses}
        >
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center space-x-3 cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        onClick={handleLogoClick}
                    >
                        <div className="relative">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <Camera className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                            Vacay
                        </h1>
                    </motion.div>

                    {/* Auth Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {loading ? (
                            <div className="w-20 h-10 bg-slate-100 rounded animate-pulse" />
                        ) : user ? (
                            // Signed in state
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={user.user_metadata?.avatar_url}
                                        alt={user.user_metadata?.full_name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span className="text-slate-700 font-medium hidden sm:block">
                                        {user.user_metadata?.full_name}
                                    </span>
                                </div>

                                <Button
                                    onClick={handleDashboardClick}
                                    variant="outline"
                                    size="sm"
                                    className="border-teal-200 text-teal-600 hover:bg-teal-50"
                                >
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Button>

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
                        ) : (
                            // Signed out state
                            <Button
                                onClick={signInWithGoogle}
                                className="relative bg-gradient-to-r from-teal-600 to-cyan-600 text-white overflow-hidden group"
                            >
                                <span className="relative z-10">Sign In</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-teal-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </Button>
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.nav>
    )
}