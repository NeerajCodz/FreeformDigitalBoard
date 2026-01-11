import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/server-auth";
import { sanitizeBoardState } from "@/lib/board-state";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const board = await prisma.board.findFirst({
      where: { id, clerk_user_id: user.clerk_user_id },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...board,
      state: sanitizeBoardState(board.state as any),
    });
  } catch (error) {
    console.error("Error fetching board", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[PATCH Board] Starting update for board:', id);
    
    const user = await getServerUser();

    if (!user) {
      console.log('[PATCH Board] Unauthorized - no user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[PATCH Board] User authenticated:', user.clerk_user_id);

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('[PATCH Board] JSON parse error:', jsonError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    const { title, description, state, tag_ids, category_ids } = body;
    
    console.log('[PATCH Board] Request data:', {
      title,
      hasDescription: description !== undefined,
      hasState: !!state,
      tagCount: tag_ids?.length || 0,
      categoryCount: category_ids?.length || 0,
      pinCount: state?.pins?.length || 0,
    });

    const existing = await prisma.board.findFirst({
      where: { id, clerk_user_id: user.clerk_user_id },
    });

    if (!existing) {
      console.log('[PATCH Board] Board not found:', id);
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    console.log('[PATCH Board] Existing board found, updating...');

    const sanitizedState = state ? sanitizeBoardState(state) : null;
    console.log('[PATCH Board] State sanitized, has', sanitizedState?.pins?.length || 0, 'pins');

    const updated = await prisma.board.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(tag_ids !== undefined ? { tag_ids } : {}),
        ...(category_ids !== undefined ? { category_ids } : {}),
        ...(sanitizedState ? { state: sanitizedState as any } : {}),
      },
    });

    console.log('[PATCH Board] Board updated successfully');
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH Board] Error updating board:", error);
    console.error("[PATCH Board] Error stack:", error instanceof Error ? error.stack : 'No stack');
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.board.findFirst({
      where: { id, clerk_user_id: user.clerk_user_id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    await prisma.board.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting board", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
