// src/app/api/users/find/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET(request: Request) {
  const connectionString = `${process.env.DATABASE_URL}`
  const prisma = new PrismaClient();
  const url = new URL(request.url)
  const rfidTag = url.searchParams.get('rfidTag')

  if (!rfidTag) {
    return NextResponse.json(
      { error: 'Missing “rfidTag” query parameter' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { rfidTag },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: `No user found with RFID tag “${rfidTag}”` },
      { status: 404 }
    )
  }

  return NextResponse.json(user)
}
