'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/product';

declare global { interface Window { Razorpay: any } }

export default function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart]     = useState<{ productId: number; quantity: number }[]>([]);
  const userId = 1; // demo user

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);

  const addToCart = (id: number) => {
    setCart(prev => {
      const found = prev.find(i => i.productId === id);
      if (found) {
        return prev.map(i => i.productId === id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: id, quantity: 1 }];
    });
  };

  const placeOrder = async () => {
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, userId }),
    });
    const { keyId, orderId, amount, currency } = await res.json();
    
    const options = {
      key: keyId,
      amount,
      currency,
      name: 'IoT Vending',
      description: 'Your order',
      order_id: orderId,
      handler: async (resp: any) => {
        await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resp),
        });
        window.location.href = '/success';
      },
      prefill: { name: 'Demo User', email: 'demo@user.com' },
      theme: { color: '#3399cc' },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const totalRs = cart.reduce((sum, item) => {
    const p = products.find(x => x.id === item.productId);
    return sum + (p?.priceCents ?? 0) * item.quantity;
  }, 0) / 100;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Vending Machine</h1>
      <div className="grid grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="border rounded p-4 flex flex-col">
            <h2 className="font-semibold">{p.name}</h2>
            <p>₹{(p.priceCents/100).toFixed(2)}</p>
            <p>Stock: {p.stock}</p>
            <button
              className="mt-auto bg-green-500 text-white py-1 rounded"
              onClick={() => addToCart(p.id)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
      {cart.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold">Cart (Total: ₹{totalRs.toFixed(2)})</h2>
          <ul className="list-disc pl-5">
            {cart.map(item => {
              const p = products.find(x => x.id === item.productId)!;
              return <li key={item.productId}>{p.name} × {item.quantity}</li>;
            })}
          </ul>
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            onClick={placeOrder}
          >
            Pay ₹{totalRs.toFixed(2)}
          </button>
        </div>
      )}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
}
