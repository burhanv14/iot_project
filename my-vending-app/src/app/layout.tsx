// src/app/layout.tsx
import './globals.css';
import Link from 'next/link';
import { ReactNode } from 'react';

export const metadata = {
  title: 'IoT Vending Machine',
  description: 'Order snacks & beverages remotely, then pick up with your RFID card.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
        <header className="bg-white shadow-md sticky top-0 z-50">
          <nav className="container mx-auto flex items-center justify-between p-4">
            <Link href="/" className="text-3xl font-bold text-indigo-700">
              VendiQ
            </Link>
            <div className="space-x-6">
              <Link href="/" className="text-gray-600 hover:text-indigo-500 transition-colors">
                Home
              </Link>
              <Link href="/checkout" className="text-gray-600 hover:text-indigo-500 transition-colors">
                Order Now
              </Link>
              <Link href="/success" className="text-gray-600 hover:text-indigo-500 transition-colors">
                Success
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-grow container mx-auto p-6">
          {children}
        </main>

        <footer className="bg-gray-100 border-t">
          <div className="container mx-auto p-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} VendiQ IoT Vending — Built with Next.js & ESP32
          </div>
        </footer>
      </body>
    </html>
  );
}
