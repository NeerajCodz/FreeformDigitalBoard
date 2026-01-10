import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: { clerk_user_id: user.clerk_user_id },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        color: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching board categories", error);
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
    const { name, color, description } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        clerk_user_id: user.clerk_user_id,
        name,
        color: color || "#3B82F6",
        description,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating board category", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
