import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/server-auth";
import { sanitizeBoardState } from "@/lib/board-state";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const { id, snapshotId } = await params;
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await prisma.boardSnapshot.findFirst({
      where: {
        id: snapshotId,
        board_id: id,
        clerk_user_id: user.clerk_user_id,
      },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    const restored = await prisma.board.update({
      where: { id },
      data: {
        state: sanitizeBoardState(snapshot.state as any) as any,
      },
    });

    return NextResponse.json(restored);
  } catch (error) {
    console.error("Error restoring snapshot", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
