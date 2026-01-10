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

    const snapshots = await prisma.boardSnapshot.findMany({
      where: {
        board_id: id,
        clerk_user_id: user.clerk_user_id,
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        note: true,
        created_at: true,
      },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error("Error fetching snapshots", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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
    const { name, note, state } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Snapshot name is required" }, { status: 400 });
    }

    const board = await prisma.board.findFirst({
      where: { id, clerk_user_id: user.clerk_user_id },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const snapshot = await prisma.boardSnapshot.create({
      data: {
        board_id: id,
        clerk_user_id: user.clerk_user_id,
        name,
        note,
        state: sanitizeBoardState(state ?? board.state) as any,
      },
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error("Error creating snapshot", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
