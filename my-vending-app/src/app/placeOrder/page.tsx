"use client"

import { useState, type FormEvent, useEffect } from "react"
import type { Product } from "@prisma/client"
import { ShoppingCart, Package, AlertCircle, CheckCircle, Minus, Plus, Loader2 } from "lucide-react"

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
    setQuantities((q) => ({ ...q, [id]: Math.max(0, val) }))
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

    const orderItems = products
      .filter((p) => quantities[p.id] > 0)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        quantity: quantities[p.id],
      }))

    const totalCents = products.reduce((sum, p) => sum + p.priceCents * quantities[p.id], 0)

    if (!orderItems.length) {
      setMessage("Please select at least one product.")
      setMessageType("error")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          totalCents,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Order #${data.id} placed successfully! Total amount: ₹${(totalCents / 100).toFixed(2)}`)
        setMessageType("success")
        // reset form
        setQuantities(Object.fromEntries(products.map((p) => [p.id, 0])))
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

          {message && (
            <Alert variant={messageType === "success" ? "default" : "destructive"} className="mb-6">
              {messageType === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{messageType === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

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
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
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
                  ))}
                </div>
              )}

              <div className="mt-8">
                <Separator className="my-4" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      Total Items: {products.reduce((sum, p) => sum + (quantities[p.id] || 0), 0)}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">Total: ₹{totalAmount.toFixed(2)}</p>
                  </div>
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
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
