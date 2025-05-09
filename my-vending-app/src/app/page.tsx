"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ShoppingCart, HelpCircle, Smartphone, CreditCard, Scan, ChevronRight } from "lucide-react"

export default function HomePage() {
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  }

  const featureCardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-100 opacity-50 blur-3xl"></div>
          <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-teal-100 opacity-40 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-200 opacity-30 blur-3xl"></div>
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-800 mb-6">
                  Next-Gen Vending Experience
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent"
              >
                Remote IoT Vending Machine
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-lg max-w-2xl mx-auto lg:mx-0 mb-8 text-gray-600"
              >
                Browse and pay for your favorite snacks and drinks from your phone—then simply tap your RFID card at the
                machine to collect them. Fast, secure, and contactless.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link href="/checkout">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg flex items-center justify-center gap-2 group"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Order Now</span>
                    <ChevronRight className="w-5 h-5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </motion.div>
                </Link>

                <Link href="/help">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white border border-gray-200 text-gray-800 font-medium px-8 py-3.5 rounded-full shadow-md flex items-center justify-center gap-2"
                  >
                    <HelpCircle className="w-5 h-5 text-emerald-500" />
                    <span>How It Works</span>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative mx-auto lg:mx-0 max-w-md"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-3xl transform rotate-3 scale-105 blur-xl opacity-30"></div>
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                  <Image
                    src="/placeholder.svg?key=vuiao"
                    alt="IoT Vending Machine"
                    width={400}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-sm font-medium">Online & Ready</span>
                    </div>
                    <h3 className="text-lg font-semibold">Smart Vending Station</h3>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contactless</p>
                  <p className="text-sm font-semibold">RFID Access</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Secure</p>
                  <p className="text-sm font-semibold">Digital Payment</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            <motion.div
              variants={featureCardVariants}
              className="group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 mb-6 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Browse Products</h3>
                <p className="text-gray-600">
                  View real-time stock and prices in our catalog. Choose from a variety of snacks and beverages.
                </p>
                <div className="mt-6 flex items-center text-emerald-600 font-medium">
                  <span>Explore catalog</span>
                  <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={featureCardVariants}
              className="group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 mb-6 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Secure Payment</h3>
                <p className="text-gray-600">
                  Checkout instantly via Razorpay with UPI, cards, or wallets. Fast and secure transactions.
                </p>
                <div className="mt-6 flex items-center text-teal-600 font-medium">
                  <span>Payment options</span>
                  <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={featureCardVariants}
              className="group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 mb-6 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Scan className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">RFID Pickup</h3>
                <p className="text-gray-600">
                  Scan your RFID card on the ESP32 vending machine to dispense your selected items instantly.
                </p>
                <div className="mt-6 flex items-center text-emerald-600 font-medium">
                  <span>How it works</span>
                  <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative max-w-4xl mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]"></div>
            <div className="relative p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to try the future of vending?</h2>
              <p className="text-emerald-50 text-lg mb-8 max-w-2xl mx-auto">
                Experience the convenience of contactless ordering and pickup. Your snacks are just a tap away.
              </p>
              <Link href="/checkout">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 bg-white text-emerald-600 font-semibold px-8 py-3.5 rounded-full shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Get Started Now</span>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
