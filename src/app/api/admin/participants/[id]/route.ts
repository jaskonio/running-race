import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const { valid: isAdmin } = adminToken
      ? verifyAdminToken(adminToken)
      : { valid: false };

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden — admin only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { success: false, error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.update({
      where: { id },
      data: { isActive },
    });

    console.log(`[admin] Participant ${participant.name} set isActive=${isActive}`);

    return NextResponse.json({
      success: true,
      data: {
        id: participant.id,
        name: participant.name,
        isActive: participant.isActive,
      },
    });
  } catch (error) {
    console.error("[admin] Error updating participant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update participant" },
      { status: 500 }
    );
  }
}
