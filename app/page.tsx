"use client"

import { Button } from "@/components/ui/button"
import { Camera, Upload, Share2, ArrowRight, Smartphone } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading state
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

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        {/* Navigation */}
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/20"
        >
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <motion.div
                  className="flex items-center space-x-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
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

              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
              >
                <Button
                    onClick={signInWithGoogle}
                    className="relative bg-gradient-to-r from-teal-600 to-cyan-600 text-white overflow-hidden group"
                >
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 mb-6 leading-[0.9]">
                Share Travel
                <br />
                <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Instantly
              </span>
              </h1>
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto font-light"
            >
              Upload photos together, share with anyone, save to your device.
              <br className="hidden md:block" />
              Travel memories made simple.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
            >
              <Button
                  onClick={signInWithGoogle}
                  size="lg"
                  className="relative bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-8 py-6 text-lg shadow-lg overflow-hidden group"
              >
              <span className="relative z-10 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Start Sharing
                <ArrowRight className="h-5 w-5 ml-2" />
              </span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Button>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="relative max-w-4xl mx-auto"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200/50">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="ml-4 text-sm text-slate-500 font-mono">
                      vacay.app/tokyo-2024
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {[...Array(24)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: 0.5,
                              delay: 0.8 + (i * 0.02),
                              type: "spring",
                              stiffness: 200
                            }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="aspect-square bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <Camera className="h-4 w-4 text-teal-400" />
                        </motion.div>
                    ))}
                  </div>

                  <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="mt-6 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.7 + (i * 0.1), type: "spring" }}
                                className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full border-2 border-white"
                            />
                        ))}
                      </div>
                      <span className="text-sm text-slate-600">3 people</span>
                    </div>
                    <Button size="sm" variant="outline" className="border-teal-200 text-teal-600 hover:bg-teal-50">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Simple Process Section */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Three simple steps
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
                No complicated setup. No confusing interfaces. Just upload, share, and save.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  icon: Upload,
                  title: "Upload Together",
                  description: "Everyone adds their photos to the same album. No more asking friends to send you photos.",
                  step: "01"
                },
                {
                  icon: Share2,
                  title: "Share Instantly",
                  description: "Send a simple link. Anyone can view the album without signing up or downloading apps.",
                  step: "02"
                },
                {
                  icon: Smartphone,
                  title: "Save to Device",
                  description: "Download any photo with one tap. Add the best memories directly to your photo library.",
                  step: "03"
                }
              ].map((item, index) => (
                  <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      whileHover={{ y: -4 }}
                      className="text-center group"
                  >
                    <div className="relative mb-8">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <item.icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed font-light">
                      {item.description}
                    </p>
                  </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-teal-600 to-cyan-600 relative overflow-hidden">
          <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative max-w-4xl mx-auto text-center px-6 lg:px-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to start sharing?
            </h2>
            <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto font-light">
              Join thousands of travelers creating and sharing beautiful photo albums.
            </p>
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
              <Button
                  onClick={signInWithGoogle}
                  size="lg"
                  className="relative bg-white text-teal-600 px-8 py-6 text-lg shadow-xl font-semibold overflow-hidden group"
              >
              <span className="relative z-10 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </span>
                <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Subtle background elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-300/10 rounded-full blur-3xl"></div>
        </section>

        {/* Minimal Footer */}
        <footer className="bg-slate-900 text-white py-12">
          <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-5xl mx-auto px-6 lg:px-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-6 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    Vacay
                  </h3>
                </div>
              </div>

              <div className="flex space-x-8 text-sm text-slate-400">
                <a href="#" className="hover:text-teal-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-teal-400 transition-colors">Terms</a>
                <a href="#" className="hover:text-teal-400 transition-colors">Support</a>
              </div>
            </div>

            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
              <p>&copy; 2024 Vacay. Made for travelers who love to share.</p>
            </div>
          </motion.div>
        </footer>
      </div>
  )
}