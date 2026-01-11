import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, labelId } = await params

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

    // Verify label belongs to this board
    const existingLabel = await prisma.label.findFirst({
      where: {
        id: labelId,
        boardId: boardId
      }
    })

    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, color } = body

    const label = await prisma.label.update({
      where: { id: labelId },
      data: {
        ...(name ? { name } : {}),
        ...(color ? { color } : {}),
      }
    })

    return NextResponse.json(label)
  } catch (error) {
    console.error('Error updating label:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, labelId } = await params

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

    // Verify label belongs to this board
    const existingLabel = await prisma.label.findFirst({
      where: {
        id: labelId,
        boardId: boardId
      }
    })

    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    await prisma.label.delete({
      where: { id: labelId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting label:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
