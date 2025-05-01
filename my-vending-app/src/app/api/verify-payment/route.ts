import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import mqttClient from '@/lib/mqttClient';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();

    // 1) Verify signature
    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2) Mark order paid & fetch details
    const order = await prisma.order.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { status: 'paid' },
      include: { items: true, user: true },
    });

    // 3) Publish to MQTT
    mqttClient.publish(
      'vending/machine1',
      JSON.stringify({
        orderId: order.id,
        userRFID: order.user?.rfidTag,
        items: order.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
