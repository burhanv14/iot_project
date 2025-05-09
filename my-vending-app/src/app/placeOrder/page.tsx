"use client"

import { useState, type FormEvent, useEffect } from "react"
import type { Product } from "@prisma/client"
import { ShoppingCart, Package, AlertCircle, CheckCircle, Minus, Plus, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function PlaceOrderPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderData, setOrderData] = useState<{ id: number; totalAmount: number } | null>(null)

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products")
        if (!res.ok) throw new Error("Failed to fetch products")
        const data = await res.json()
        setProducts(data)
        // Initialize quantities state with fetched products
        setQuantities(Object.fromEntries(data.map((p: Product) => [p.id, 0])))
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching products:", error)
        setMessage("Failed to load products. Please try again later.")
        setMessageType("error")
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleQtyChange = (id: number, val: number) => {
    const product = products.find((p) => p.id === id)
    if (product) {
      // Ensure quantity doesn't exceed available stock and is not negative
      const newQty = Math.min(Math.max(0, val), product.stock)
      setQuantities((q) => ({ ...q, [id]: newQty }))

      // If user tried to enter a value higher than stock, show a message
      if (val > product.stock) {
        setMessage(`Maximum available stock for ${product.name} is ${product.stock}`)
        setMessageType("error")
        // Auto-dismiss the message after 3 seconds
        setTimeout(() => {
          setMessage(null)
          setMessageType(null)
        }, 3000)
      }
    }
  }

  const incrementQuantity = (id: number) => {
    const product = products.find((p) => p.id === id)
    if (product && quantities[id] < product.stock) {
      handleQtyChange(id, quantities[id] + 1)
    }
  }

  const decrementQuantity = (id: number) => {
    if (quantities[id] > 0) {
      handleQtyChange(id, quantities[id] - 1)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Reset previous success state
    setOrderSuccess(false)
    setOrderData(null)

    // 1. Validate RFID tag
    const rfidTag = localStorage.getItem("rfidTag")
    if (!rfidTag) {
      setMessage("RFID tag not found. Please scan your card.")
      setMessageType("error")
      return
    }

    // 2. Validate that at least one product is selected
    const selectedItems = products.filter((p) => quantities[p.id] > 0)
    if (selectedItems.length === 0) {
      setMessage("Please select at least one product.")
      setMessageType("error")
      return
    }

    // 3. Validate stock availability for all selected products
    const stockIssues = selectedItems.filter((p) => quantities[p.id] > p.stock)
    if (stockIssues.length > 0) {
      setMessage(
        `Cannot place order. Some products have insufficient stock: ${stockIssues.map((p) => p.name).join(", ")}`,
      )
      setMessageType("error")
      return
    }

    // 4. Prepare order items
    const orderItems = selectedItems.map((p) => ({
      productId: p.id,
      quantity: quantities[p.id],
    }))

    // 5. Calculate total (though the server will recalculate this)
    const totalCents = products.reduce((sum, p) => sum + p.priceCents * (quantities[p.id] || 0), 0)

    // All validations passed, proceed with API request
    setLoading(true)
    try {
      const res = await fetch(`/api/place-order/${rfidTag}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: orderItems,
          rfidNo: rfidTag, // Ensure rfidTag is passed as rfidNo
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Order #${data.id} placed successfully! Total amount: ₹${(totalCents / 100).toFixed(2)}`)
        setMessageType("success")

        // Set order success state for animations
        setOrderSuccess(true)
        setOrderData({
          id: data.id,
          totalAmount: totalCents / 100,
        })

        // Reset form
        setQuantities(Object.fromEntries(products.map((p) => [p.id, 0])))

        // Optimistically update product stock in the UI
        setProducts(
          products.map((product) => {
            if (quantities[product.id] > 0) {
              return {
                ...product,
                stock: product.stock - quantities[product.id],
              }
            }
            return product
          }),
        )
      } else {
        setMessage(data.error || "Something went wrong")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("Failed to place order. Please try again.")
      setMessageType("error")
      console.error("Order error:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = products.reduce((sum, p) => sum + p.priceCents * (quantities[p.id] || 0), 0) / 100

  const hasItems = products.some((p) => quantities[p.id] > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <ShoppingCart className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Place Your Order</h1>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <Alert variant={messageType === "success" ? "default" : "destructive"}>
                  {messageType === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{messageType === "success" ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order Success Animation */}
          <AnimatePresence>
            {orderSuccess && orderData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="mb-6 p-6 bg-green-50 border border-green-100 rounded-lg text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mx-auto mb-4 bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center"
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-bold text-green-800 mb-2"
                >
                  Order #{orderData.id} Confirmed!
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-green-700"
                >
                  <p className="mb-1">Thank you for your purchase</p>
                  <p className="text-2xl font-bold">₹{orderData.totalAmount.toFixed(2)}</p>
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="h-1 bg-green-300 mt-4 rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6 flex justify-between items-center">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                      <Skeleton className="h-10 w-[100px]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No products available</h3>
                  <p className="mt-1 text-sm text-gray-500">Check back later for new products.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {products.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className={`overflow-hidden ${product.stock === 0 ? "opacity-70 bg-gray-50" : ""}`}>
                          <CardContent className="p-0">
                            <div className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                                  {product.stock <= 5 && (
                                    <Badge variant={product.stock === 0 ? "destructive" : "secondary"} className="ml-2">
                                      {product.stock === 0 ? "Out of stock" : `Only ${product.stock} left`}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-lg font-semibold text-primary">
                                  ₹{(product.priceCents / 100).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Available: {product.stock} {product.stock === 1 ? "unit" : "units"}
                                  {product.stock === 0 && " - Out of stock"}
                                  {product.stock > 0 && product.stock <= 3 && " - Low stock"}
                                </p>
                              </div>

                              <div className="flex items-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  type="button"
                                  disabled={quantities[product.id] <= 0 || product.stock === 0}
                                  onClick={() => decrementQuantity(product.id)}
                                  className="h-8 w-8 rounded-r-none"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min={0}
                                  max={product.stock}
                                  value={quantities[product.id] || 0}
                                  onChange={(e) => handleQtyChange(product.id, Number.parseInt(e.target.value) || 0)}
                                  className="h-8 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  disabled={product.stock === 0}
                                />
                                {quantities[product.id] > 0 && quantities[product.id] === product.stock && (
                                  <span className="ml-2 text-xs text-amber-600 whitespace-nowrap">
                                    Max stock reached
                                  </span>
                                )}
                                <Button
                                  variant="outline"
                                  size="icon"
                                  type="button"
                                  disabled={quantities[product.id] >= product.stock || product.stock === 0}
                                  onClick={() => incrementQuantity(product.id)}
                                  className="h-8 w-8 rounded-l-none"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <div className="mt-8">
                <Separator className="my-4" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      Total Items: {products.reduce((sum, p) => sum + (quantities[p.id] || 0), 0)}
                    </p>
                    <motion.p
                      className="text-2xl font-bold text-gray-900"
                      animate={{ scale: hasItems ? [1, 1.05, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      Total: ₹{totalAmount.toFixed(2)}
                    </motion.p>
                  </div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button type="submit" size="lg" disabled={loading || !hasItems} className="w-full sm:w-auto">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
