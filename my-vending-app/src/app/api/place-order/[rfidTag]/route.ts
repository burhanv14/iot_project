import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

// Create a single PrismaClient instance to be reused
const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: { rfidTag: string } }) {
  try {
    const body = await request.json()
    const { items, rfidNo } = body

    // Use rfidTag from params if not provided in the body
    const rfidTag = rfidNo || params.rfidTag
    if (!rfidTag) {
      return NextResponse.json({ error: "Missing RFID tag" }, { status: 400 })
    }

    // Validate required fields
    if (!items || !items.length) {
      return NextResponse.json({ error: "Missing required fields: items" }, { status: 400 })
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Fetch the current user based on the RFID tag
      const user = await tx.user.findUnique({
        where: { rfidTag }, // Use the resolved rfidTag
      })

      if (!user) {
        throw new Error("User not found for the provided RFID tag")
      }

      // Fetch all products in a single query to reduce database calls
      const productIds = items.map((item) => item.productId)
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      })

      // Validate all products and calculate totals
      let totalCents = 0
      const productNames: string[] = []
      const quantities: number[] = []

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`)
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          )
        }

        totalCents += product.priceCents * item.quantity
        productNames.push(product.name)
        quantities.push(item.quantity)
      }

// Create the order - link to user instead of using rfidNo directly
    const order = await tx.order.create({
      data: {
        user: {
          connect: {
            rfidTag
          }
        },
        totalCents,
        items: productNames,
        qty: quantities,
        status: "pending",
      },
    })

      // Update product stock in bulk
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      return order
    })

    return NextResponse.json({
      success: true,
      id: result.id,
      totalCents: result.totalCents,
    })
  } catch (error: any) {
    console.error("Error creating order:", error)

    // Return more specific error messages when available
    return NextResponse.json(
      { error: error.message || "Failed to place order" },
      { status: error.message?.includes("User not found") ? 404 : 400 },
    )
  }
}
