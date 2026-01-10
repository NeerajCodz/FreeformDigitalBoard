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
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, state } = body;

    const existing = await prisma.board.findFirst({
      where: { id, clerk_user_id: user.clerk_user_id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const updated = await prisma.board.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(state ? { state: sanitizeBoardState(state) as any } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating board", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
