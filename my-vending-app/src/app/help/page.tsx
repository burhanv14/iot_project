export default function HelpPage() {
    return (
        <section className="container mx-auto p-6">
            <h1 className="text-4xl font-bold mb-6 text-indigo-700">How It Works</h1>
            <p className="text-lg text-gray-600 mb-8">
                Learn how to use our IoT vending machine to order and pick up your favorite snacks and beverages effortlessly.
            </p>
            <div className="space-y-6">
                <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="text-2xl font-semibold mb-2 text-indigo-700">1. Browse Products</h2>
                    <p className="text-gray-600">
                        Explore our catalog to view the available snacks and drinks in real-time. Check stock levels and prices before making a decision.
                    </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="text-2xl font-semibold mb-2 text-indigo-700">2. Place Your Order</h2>
                    <p className="text-gray-600">
                        Add items to your cart and proceed to checkout. Pay securely using Razorpay with options like UPI, credit/debit cards, or wallets.
                    </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                    <h2 className="text-2xl font-semibold mb-2 text-indigo-700">3. Collect Your Items</h2>
                    <p className="text-gray-600">
                        Visit the vending machine and scan your RFID card. The machine will dispense your order instantly. Enjoy your snacks and beverages!
                    </p>
                </div>
            </div>
            <div className="mt-8 text-center">
                <p className="text-gray-600">
                    Need further assistance? Contact our support team at <a href="mailto:support@vendiq.com" className="text-indigo-600 hover:underline">support@vendiq.com</a>.
                </p>
            </div>
        </section>
    );
}