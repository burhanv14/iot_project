import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const prisma = new PrismaClient();
    const body = await request.json();
    const { items, rfidTag } = body;

    if (!items || !items.length || !rfidTag) {
      return NextResponse.json(
        { error: 'Missing required fields: items or rfidTag' },
        { status: 400 }
      );
    }

    // Fetch the current user based on the RFID tag
    const user = await prisma.user.findUnique({
      where: { rfidTag },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found for the provided RFID tag' },
        { status: 404 }
      );
    }

    // Calculate totalCents, items, and qty
    let totalCents = 0;
    const productNames: string[] = [];
    const quantities: number[] = [];

    for (const { productId, quantity } of items) {
      const product = await prisma.product.findUnique({ where: { id: productId } });

      if (!product || product.stock < quantity) {
        return NextResponse.json(
          { error: `Product ${productId} is unavailable or insufficient stock` },
          { status: 400 }
        );
      }

      totalCents += product.priceCents * quantity;
      productNames.push(product.name);
      quantities.push(quantity);
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: user.rfidTag,
        user: user.name,
        totalCents,
        items: productNames,
        qty: quantities,
      },
    });

    // Update product stock
    for (const { productId, quantity } of items) {
      await prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });
    }

    return NextResponse.json({ success: true, id: order.id });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    );
  }
}