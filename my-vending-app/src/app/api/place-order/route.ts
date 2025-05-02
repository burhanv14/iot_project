import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const connectionString = `${process.env.DATABASE_URL}`
    const prisma = new PrismaClient();
    const body = await request.json();
    const { items, totalCents } = body;
    
    // Validate input
    if (!items || !items.length) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        totalCents,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity
          }))
        }
      }
    });
    
    // Optionally update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { 
          stock: { decrement: item.quantity }
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      id: order.id 
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    );
  }
}