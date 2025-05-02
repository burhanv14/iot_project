// src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="text-center py-20 bg-gradient-to-b from-indigo-50 to-white">
      <h1 className="text-6xl font-extrabold mb-6 text-indigo-700">
        Remote IoT Vending Machine
      </h1>
      <p className="text-lg max-w-2xl mx-auto mb-8 text-gray-600">
        Browse and pay for your favorite snacks and drinks from your phone—then simply tap your RFID card at the machine to collect them. Fast, secure, and contactless.
      </p>
      <div className="space-x-4">
        <Link
          href="/checkout"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-transform transform hover:scale-105"
        >
          Order Now
        </Link>
        <Link
          href="/help"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-8 py-3 rounded-full shadow-lg transition-transform transform hover:scale-105"
        >
          How It Works
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold mb-2 text-indigo-700">Browse Products</h3>
          <p className="text-gray-600">View real-time stock and prices in our catalog.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold mb-2 text-indigo-700">Secure Payment</h3>
          <p className="text-gray-600">Checkout instantly via Razorpay with UPI, cards, or wallets.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-semibold mb-2 text-indigo-700">RFID Pickup</h3>
          <p className="text-gray-600">Scan your RFID card on the ESP32 vending machine to dispense.</p>
        </div>
      </div>
    </section>
  );
}
