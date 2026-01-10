import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/server-auth";
import { emptyBoardState, sanitizeBoardState } from "@/lib/board-state";

export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const boards = await prisma.board.findMany({
      where: { clerk_user_id: user.clerk_user_id },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        updated_at: true,
        created_at: true,
      },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error("Error fetching boards", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, state } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const boardState = state ? sanitizeBoardState(state) : emptyBoardState;

    const board = await prisma.board.create({
      data: {
        clerk_user_id: user.clerk_user_id,
        title,
        description,
        state: boardState as any,
      },
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("Error creating board", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
