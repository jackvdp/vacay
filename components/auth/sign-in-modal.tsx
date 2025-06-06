"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { motion, AnimatePresence } from "framer-motion"

interface SignInModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
    const { signInWithGoogle } = useAuth()
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        try {
            await signInWithGoogle()
            onOpenChange(false)
        } catch (error) {
            console.error('Error signing in:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-xl">
                <DialogHeader className="text-center space-y-4">
                    <div className="mx-auto">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                        Welcome to Vacay
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 text-base">
                        Sign in to start creating and sharing beautiful photo albums with friends.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        size="lg"
                        className="w-full bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 relative overflow-hidden group"
                    >
            <span className="relative z-10 flex items-center justify-center">
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-3" />
              ) : (
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                  </svg>
              )}
                {isLoading ? "Signing in..." : "Continue with Google"}
            </span>
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-slate-500">or</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        disabled
                    >
                        <Mail className="w-5 h-5 mr-3" />
                        Continue with Email
                        <span className="ml-2 text-xs bg-slate-100 px-2 py-1 rounded-full">Soon</span>
                    </Button>
                </div>

                <div className="pt-6 text-center">
                    <p className="text-xs text-slate-500">
                        By signing in, you agree to our{" "}
                        <a href="#" className="underline hover:text-slate-700">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="underline hover:text-slate-700">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}