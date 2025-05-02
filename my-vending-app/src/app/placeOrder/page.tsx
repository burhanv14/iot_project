'use client';

import { useState, FormEvent, useEffect } from "react";
import type { Product } from "@prisma/client";

export default function PlaceOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
        // Initialize quantities state with fetched products
        setQuantities(Object.fromEntries(data.map((p: Product) => [p.id, 0])));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setMessage('Failed to load products. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleQtyChange = (id: number, val: number) => {
    setQuantities((q) => ({ ...q, [id]: Math.max(0, val) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const orderItems = products
      .filter(p => quantities[p.id] > 0)
      .map(p => ({
        productId: p.id,
        name: p.name,
        quantity: quantities[p.id]
      }));
      
    const totalCents = products.reduce((sum, p) => sum + p.priceCents * quantities[p.id], 0);

    if (!orderItems.length) {
      setMessage("Please select at least one product.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: orderItems,
          totalCents 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`Order #${data.id} placed! Total ₹${(totalCents/100).toFixed(2)}`);
        // reset form
        setQuantities(Object.fromEntries(products.map((p) => [p.id, 0])));
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch (error) {
      setMessage("Failed to place order. Please try again.");
      console.error("Order error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-xl mx-auto my-8 p-4 font-sans">
        <h1 className="text-2xl font-bold mb-4">🛒 Place Your Order</h1>
        <p>Loading products...</p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto my-8 p-4 font-sans">
      <h1 className="text-2xl font-bold mb-4">🛒 Place Your Order</h1>
      
      {products.length === 0 && !isLoading ? (
        <p>No products available.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {products.map((p) => (
            <div key={p.id} className="flex justify-between items-center my-2 p-2 border-b">
              <div>
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-gray-600">₹{(p.priceCents / 100).toFixed(2)}</span>
                {p.stock <= 5 && (
                  <span className="ml-2 text-sm text-red-600">
                    {p.stock === 0 ? 'Out of stock' : `Only ${p.stock} left`}
                  </span>
                )}
              </div>
              <input
                type="number"
                min={0}
                max={p.stock}
                value={quantities[p.id] || 0}
                onChange={(e) => handleQtyChange(p.id, parseInt(e.target.value) || 0)}
                className="w-16 p-1 border rounded"
                disabled={p.stock === 0}
              />
            </div>
          ))}
          
          <div className="mt-4 flex justify-between items-center">
            <span className="font-bold">
              Total: ₹{(products.reduce((sum, p) => sum + p.priceCents * (quantities[p.id] || 0), 0) / 100).toFixed(2)}
            </span>
            <button 
              type="submit" 
              disabled={loading || products.every(p => !quantities[p.id])} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Placing…" : "Place Order"}
            </button>
          </div>
        </form>
      )}
      
      {message && (
        <div className={`mt-4 p-3 rounded ${message.includes('placed') ? 'bg-green-100' : 'bg-red-100'}`}>
          {message}
        </div>
      )}
    </main>
  );
}