import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/server-auth";
import { sanitizeBoardState } from "@/lib/board-state";

export async function GET(
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

    return NextResponse.json({
      ...snapshot,
      state: sanitizeBoardState(snapshot.state as any),
    });
  } catch (error) {
    console.error("Error reading snapshot", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const { id, snapshotId } = await params;
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.boardSnapshot.findFirst({
      where: {
        id: snapshotId,
        board_id: id,
        clerk_user_id: user.clerk_user_id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    await prisma.boardSnapshot.delete({ where: { id: snapshotId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting snapshot", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const { id, snapshotId } = await params;
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const name = body?.name as string | undefined;
    const note = body?.note as string | undefined;

    if (!name && note === undefined) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const existing = await prisma.boardSnapshot.findFirst({
      where: {
        id: snapshotId,
        board_id: id,
        clerk_user_id: user.clerk_user_id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    const updated = await prisma.boardSnapshot.update({
      where: { id: snapshotId },
      data: {
        ...(name && { name }),
        ...(note !== undefined && { note }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating snapshot", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
