import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boardId = (await params).id

    // Verify user owns the board
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        clerk_user_id: user.clerk_user_id
      }
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const labels = await prisma.label.findMany({
      where: {
        boardId: boardId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(labels)
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boardId = (await params).id

    // Verify user owns the board
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        clerk_user_id: user.clerk_user_id
      }
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const label = await prisma.label.create({
      data: {
        boardId: boardId,
        name,
        color: color || '#10B981',
      }
    })

    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    console.error('Error creating label:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
