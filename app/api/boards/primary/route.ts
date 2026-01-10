import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/server-auth";
import { emptyBoardState, sanitizeBoardState } from "@/lib/board-state";

export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.board.findFirst({
      where: { clerk_user_id: user.clerk_user_id },
      orderBy: { updated_at: "desc" },
    });

    if (existing) {
      return NextResponse.json({
        ...existing,
        state: sanitizeBoardState(existing.state as any),
      });
    }

    const created = await prisma.board.create({
      data: {
        clerk_user_id: user.clerk_user_id,
        title: "My Board",
        description: "A free-form pin board",
        state: emptyBoardState as any,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error resolving primary board", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
