import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boardId = request.nextUrl.searchParams.get("boardId");

  try {
    const labels = await prisma.label.findMany({
      where: {
        board: { clerk_user_id: userId },
        ...(boardId ? { boardId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error("Error fetching labels:", error);
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color } = body;
    const boardId =
      typeof body.boardId === "string"
        ? body.boardId
        : typeof body.board_id === "string"
          ? body.board_id
          : null;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid label name" }, { status: 400 });
    }

    if (!boardId) {
      return NextResponse.json({ error: "boardId is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: "Invalid label name" }, { status: 400 });
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, clerk_user_id: userId },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const label = await prisma.label.create({
      data: {
        boardId,
        name: trimmedName,
        color: typeof color === "string" && color.trim() ? color : "#10B981",
      },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error("Error creating label:", error);
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 });
  }
}
