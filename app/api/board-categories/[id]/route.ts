import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/server-auth";

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
    const { name, color, description } = body;

    const existing = await prisma.category.findFirst({
      where: { id, clerk_user_id: user.clerk_user_id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating board category", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.category.findFirst({
      where: { id, clerk_user_id: user.clerk_user_id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    let deleteBoardCount = 0;
    const body = await request.json().catch(() => null);
    const cascadeBoards = Boolean(body?.deleteBoardsAndSnapshots);

    if (cascadeBoards) {
      const result = await prisma.board.deleteMany({
        where: {
          clerk_user_id: user.clerk_user_id,
          category_ids: { has: id },
        },
      });
      deleteBoardCount = result.count;
    } else {
      const boardsToUpdate = await prisma.board.findMany({
        where: {
          clerk_user_id: user.clerk_user_id,
          category_ids: { has: id },
        },
        select: { id: true, category_ids: true },
      });

      await Promise.all(
        boardsToUpdate.map((board) =>
          prisma.board.update({
            where: { id: board.id },
            data: {
              category_ids: board.category_ids.filter((categoryId) => categoryId !== id),
            },
          })
        )
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true, deletedBoards: deleteBoardCount });
  } catch (error) {
    console.error("Error deleting board category", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
