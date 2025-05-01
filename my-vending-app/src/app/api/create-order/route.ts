import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import razorpay from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const { items, userId } = await req.json();
    if (!items?.length) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // 1) Verify stock & calculate total
    let total = 0;
    for (const { productId, quantity } of items) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product || product.stock < quantity) {
        return NextResponse.json(
          { error: `Product ${productId} unavailable` },
          { status: 400 }
        );
      }
      total += product.priceCents * quantity;
    }

    // 2) Create DB order
    const order = await prisma.order.create({
      data: {
        userId,
        totalCents: total,
        items: {
          create: items.map(({ productId, quantity }) => ({
            productId,
            quantity,
          })),
        },
      },
      include: { items: true },
    });

    // 3) Create Razorpay order
    const rpOrder = await razorpay.orders.create({
      amount: total,
      currency: 'INR',
      receipt: `order_${order.id}`,
      payment_capture: 1,
    });

    // 4) Persist Razorpay orderId
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rpOrder.id },
    });

    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      orderDbId: order.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
