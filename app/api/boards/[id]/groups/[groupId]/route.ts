import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, groupId } = await params

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

    // Verify group belongs to this board
    const existingGroup = await prisma.group.findFirst({
      where: {
        id: groupId,
        boardId: boardId
      }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, color } = body

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(name ? { name } : {}),
        ...(color ? { color } : {}),
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: boardId, groupId } = await params

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

    // Verify group belongs to this board
    const existingGroup = await prisma.group.findFirst({
      where: {
        id: groupId,
        boardId: boardId
      }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    await prisma.group.delete({
      where: { id: groupId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
